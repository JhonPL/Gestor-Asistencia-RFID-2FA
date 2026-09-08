// src/routes/rfid.routes.js
// Endpoint principal del sistema: procesa la lectura de una tarjeta RFID.
// El ESP32 llama a este endpoint cada vez que detecta una tarjeta.

import { Router } from 'express';
import { getTransaction, pool } from '../config/db.js';
import { sendPushNotification } from '../services/notifications.service.js';

const router = Router();

// ── Helper para insertar ausentes con estado correcto ─────────
export async function insertarAusentes(sesionId, tx) {
  // 1. Marcar como Ausentes a los que pasaron la tarjeta pero nunca verificaron en la app
  await tx.query(
    `UPDATE asistencia
     SET estado_asistencia_id = (SELECT id FROM estado_asistencia WHERE nombre = 'Ausente'),
         estado_verificacion_id = (SELECT id FROM estado_verificacion WHERE nombre = 'rechazado')
     WHERE sesion_clase_id = $1
       AND estado_verificacion_id = (SELECT id FROM estado_verificacion WHERE nombre = 'pendiente')`,
    [sesionId]
  );

  // 2. Insertar ausentes para los que nunca pasaron la tarjeta
  const inscritos = await tx.query(
    `SELECT le.id, le.persona_id FROM lista_estudiantes le
     WHERE le.curso_id = (
       SELECT curso_id FROM aula_curso_horario WHERE id =
         (SELECT aula_curso_horario_id FROM sesion_clase WHERE id = $1)
     )
     AND le.activo = true
     AND NOT EXISTS (
       SELECT 1 FROM asistencia a2
       WHERE a2.lista_estudiantes_id = le.id AND a2.sesion_clase_id = $1
     )`,
    [sesionId],
  );

  for (const est of inscritos.rows) {
    const tieneApp = await tx.query(
      `SELECT id FROM dispositivo_movil 
       WHERE persona_id = $1 AND activo = true LIMIT 1`,
      [est.persona_id],
    );
    const estadoVerif = tieneApp.rows.length > 0 ? 'rechazado' : 'sin_app';

    await tx.query(
      `INSERT INTO asistencia
         (lista_estudiantes_id, sesion_clase_id, fecha_registro, hora_registro,
          estado_asistencia_id, estado_verificacion_id)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME,
         (SELECT id FROM estado_asistencia  WHERE nombre = 'Ausente'),
         (SELECT id FROM estado_verificacion WHERE nombre = $3))`,
      [est.id, sesionId, estadoVerif],
    );
  }
}

/**
 * @openapi
 * tags:
 *   - name: RFID
 *     description: Endpoints para el ESP32 y la app móvil (sin JWT, flujo interno)
 */

/**
 * @openapi
 * /api/rfid/scan:
 *   post:
 *     tags: [RFID]
 *     summary: Procesar lectura de tarjeta RFID
 *     description: |
 *       Endpoint principal llamado por el **ESP32** cada vez que detecta una tarjeta.
 *
 *       **Si la tarjeta pertenece a un docente:**
 *       - Sin sesión activa en el aula → **abre** la sesión de clase.
 *       - Con sesión activa en el aula → **cierra** la sesión y marca ausentes automáticamente.
 *
 *       **Si la tarjeta pertenece a un estudiante:**
 *       - Valida cadena completa: tarjeta → aula → sesión activa → inscripción → duplicado.
 *       - Crea registro de asistencia con `estado_verificacion = pendiente`.
 *       - Si no tiene dispositivo móvil registrado → `estado_verificacion = sin_app`.
 *
 *       Este endpoint **no requiere JWT** (lo llama el hardware directamente).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RfidScanInput'
 *     responses:
 *       200:
 *         description: Acción ejecutada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RfidScanResponse'
 *             examples:
 *               sesion_abierta:
 *                 value: { accion: sesion_abierta, persona: Carlos, sesion_id: 14 }
 *               sesion_cerrada:
 *                 value: { accion: sesion_cerrada, persona: Carlos }
 *               pendiente_verificacion:
 *                 value: { accion: pendiente_verificacion, asistencia_id: 42, persona: Ana }
 *               sin_app:
 *                 value: { accion: sin_app, asistencia_id: 42 }
 *               ya_registrado:
 *                 value: { accion: ya_registrado, motivo: Asistencia ya registrada en esta sesión }
 *       400:
 *         description: Dispositivo sin aula asignada o sin curso programado ahora
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RfidScanResponse'
 *       403:
 *         description: Estudiante no inscrito en el curso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RfidScanResponse'
 *       404:
 *         description: Tarjeta no registrada en el sistema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RfidScanResponse'
 */
router.post('/scan', async (req, res, next) => {
  const tx = await getTransaction();
  try {
    const { codigo_dispositivo, codigo_tarjeta } = req.body;
    if (!codigo_dispositivo || !codigo_tarjeta) {
      return res.status(400).json({ error: 'codigo_dispositivo y codigo_tarjeta son requeridos' });
    }

    await tx.begin();

    // ── Paso 1: ¿La tarjeta existe? ───────────────────────────
    const personaRes = await tx.query(
      `SELECT p.id, p.nombre, p.apellido, r.nombre AS rol
       FROM persona p
       JOIN rol r ON r.id = p.rol_id
       WHERE p.codigo_tarjeta = $1 AND p.activo = true`,
      [codigo_tarjeta],
    );
    if (!personaRes.rows.length) {
      await tx.rollback();
      return res.status(404).json({ accion: 'rechazado', motivo: 'Tarjeta no registrada' });
    }
    const persona = personaRes.rows[0];

    // ── Paso 2: ¿El dispositivo tiene aula asignada? ──────────
    const dispositivoRes = await tx.query(
      `SELECT dr.id, dr.aula_id, a.numero AS aula_numero
       FROM dispositivo_rfid dr
       JOIN aula a ON a.id = dr.aula_id
       JOIN estado_dispositivo ed ON ed.id = dr.estado_dispositivo_id
       WHERE dr.codigo = $1 AND ed.nombre = 'Activo'`,
      [codigo_dispositivo],
    );
    if (!dispositivoRes.rows.length) {
      await tx.rollback();
      return res.status(400).json({ accion: 'rechazado', motivo: 'Dispositivo no activo o sin aula asignada' });
    }
    const { aula_id } = dispositivoRes.rows[0];

    // ── Flujo DOCENTE ─────────────────────────────────────────
    if (persona.rol === 'docente') {
      // ── CIERRE AUTOMÁTICO: Si hay sesiones de este docente en esta aula
      //    que ya vencieron, cerrarlas antes de continuar
      const sesionesVencidas = await tx.query(
        `SELECT sc.id
         FROM sesion_clase sc
         JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
         JOIN horario h ON h.id = ach.horario_id
         WHERE ach.aula_id = $1 
           AND sc.persona_id = $2 
           AND sc.estado = 'activa'
           AND sc.fecha = CURRENT_DATE
           AND h.hora_fin < CURRENT_TIME`,
        [aula_id, persona.id],
      );

      // Cerrar automáticamente todas las sesiones vencidas
      for (const sesion of sesionesVencidas.rows) {
        await tx.query(
          `UPDATE sesion_clase SET estado = 'cerrada', hora_fin_real = CURRENT_TIME WHERE id = $1`,
          [sesion.id],
        );
        await insertarAusentes(sesion.id, tx);
      }

      const sesionActiva = await tx.query(
        `SELECT sc.id
         FROM sesion_clase sc
         JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
         WHERE ach.aula_id = $1 AND sc.persona_id = $2 AND sc.estado = 'activa'`,
        [aula_id, persona.id],
      );

      if (sesionActiva.rows.length) {
        // CIERRE
        const sesionId = sesionActiva.rows[0].id;
        await tx.query(
          `UPDATE sesion_clase SET estado = 'cerrada', hora_fin_real = CURRENT_TIME WHERE id = $1`,
          [sesionId],
        );
        await insertarAusentes(sesionId, tx);
        await tx.commit();
        return res.json({ accion: 'sesion_cerrada', persona: persona.nombre });
      }

      // APERTURA
      const achRes = await tx.query(
        `SELECT ach.id, c.codigo AS codigo, c.nombre AS nombre, a.nombre AS aula, 
                h.hora_inicio, h.hora_fin
         FROM aula_curso_horario ach
         JOIN horario h ON h.id = ach.horario_id
         JOIN dia_semana d ON d.id = h.dia_semana_id
         JOIN curso c ON c.id = ach.curso_id
         JOIN aula a ON a.id = ach.aula_id
         WHERE ach.aula_id = $1
           AND c.persona_id = $2
           AND c.activo = true
           AND d.id = EXTRACT(ISODOW FROM CURRENT_DATE)
           AND h.hora_inicio <= CURRENT_TIME
           AND h.hora_fin    >= CURRENT_TIME`,
        [aula_id, persona.id],
      );
      if (!achRes.rows.length) {
        await tx.rollback();
        return res.status(400).json({ accion: 'rechazado', motivo: 'Sin curso programado en este aula ahora' });
      }

      // Intentar reutilizar sesión existente (estado programada, cerrada, etc)
      // o crear una nueva si no existe
      const { rows: sesionRes } = await tx.query(
        `INSERT INTO sesion_clase (aula_curso_horario_id, persona_id, fecha, hora_inicio_real, estado)
         VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, 'activa')
         ON CONFLICT (aula_curso_horario_id, fecha) DO UPDATE SET
           estado = 'activa',
           hora_inicio_real = CURRENT_TIME,
           hora_fin_real = NULL
         RETURNING id`,
        [achRes.rows[0].id, persona.id],
      );
      
      if (!sesionRes.length) {
        await tx.rollback();
        return res.status(500).json({ accion: 'rechazado', motivo: 'Error al crear/actualizar la sesión' });
      }

      await tx.commit();
      return res.json({ accion: 'sesion_abierta', persona: persona.nombre, sesion_id: sesionRes[0].id });
    }

    // ── Flujo ESTUDIANTE ──────────────────────────────────────
    if (persona.rol === 'estudiante') {
      const sesionRes = await tx.query(
        `SELECT sc.id, ach.curso_id
         FROM sesion_clase sc
         JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
         WHERE ach.aula_id = $1 AND sc.estado = 'activa' LIMIT 1`,
        [aula_id],
      );
      if (!sesionRes.rows.length) {
        await tx.rollback();
        return res.status(400).json({ accion: 'rechazado', motivo: 'No hay sesión activa en esta aula' });
      }
      const { id: sesionId, curso_id } = sesionRes.rows[0];

      const inscripcionRes = await tx.query(
        `SELECT id FROM lista_estudiantes WHERE persona_id = $1 AND curso_id = $2 AND activo = true`,
        [persona.id, curso_id],
      );
      if (!inscripcionRes.rows.length) {
        await tx.rollback();
        return res.status(403).json({ accion: 'rechazado', motivo: 'No inscrito en este curso' });
      }
      const listaEstudiantesId = inscripcionRes.rows[0].id;

      const yaRegistrado = await tx.query(
        `SELECT id FROM asistencia WHERE lista_estudiantes_id = $1 AND sesion_clase_id = $2`,
        [listaEstudiantesId, sesionId],
      );
      if (yaRegistrado.rows.length) {
        await tx.rollback();
        return res.json({ accion: 'ya_registrado', motivo: 'Asistencia ya registrada en esta sesión' });
      }

      const { rows: nuevaAsistencia } = await tx.query(
        `INSERT INTO asistencia
           (lista_estudiantes_id, sesion_clase_id, fecha_registro, hora_registro,
            estado_asistencia_id, estado_verificacion_id)
         VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME,
           (SELECT id FROM estado_asistencia WHERE nombre = 'Presente'),
           (SELECT id FROM estado_verificacion WHERE nombre = 'pendiente'))
         RETURNING id`,
        [listaEstudiantesId, sesionId],
      );
      const asistenciaId = nuevaAsistencia[0].id;

      // ── Obtener datos del curso para la notificación push ────
      const cursoRes = await tx.query(
        `SELECT c.codigo, c.nombre, a.nombre AS aula,
                p2.nombre AS docente_nombre,
                h.hora_inicio, h.hora_fin
         FROM sesion_clase sc
         JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
         JOIN curso c ON c.id = ach.curso_id
         JOIN aula a ON a.id = ach.aula_id
         JOIN horario h ON h.id = ach.horario_id
         JOIN persona p2 ON p2.id = c.persona_id
         WHERE sc.id = $1`,
        [sesionId],
      );

      const pushRes = await tx.query(
        `SELECT id, push_token FROM dispositivo_movil WHERE persona_id = $1 AND activo = true LIMIT 1`,
        [persona.id],
      );

      if (!pushRes.rows.length) {
        console.warn(`[rfid] Estudiante ${persona.id} sin dispositivo móvil registrado — asistencia ${asistenciaId}`);
        await tx.commit();
        return res.json({ accion: 'sin_app', asistencia_id: asistenciaId });
      }

      const { push_token: pushToken, id: deviceId } = pushRes.rows[0];
      
      // Validar que el push_token no sea null o vacío
      if (!pushToken || !pushToken.trim()) {
        console.warn(`[rfid] Dispositivo ${deviceId} (persona ${persona.id}) tiene push_token vacío/null — asistencia ${asistenciaId}`);
        await tx.commit();
        return res.json({ accion: 'sin_app', asistencia_id: asistenciaId });
      }

      await tx.commit();
      
      // Enviar notificación de forma asíncrona (fire-and-forget) con datos del curso
      console.log(`[rfid] ✓ Asistencia ${asistenciaId} creada para ${persona.nombre}, enviando push...`);
      const infoCurso = cursoRes.rows[0];
      const cursoInfo = {
        codigo:      infoCurso?.codigo      ?? '',
        nombre:      infoCurso?.nombre      ?? '',
        aula:        infoCurso?.aula        ?? '',
        docente:     infoCurso?.docente_nombre ?? persona.nombre,
        hora_inicio: infoCurso?.hora_inicio ?? '',
        hora_fin:    infoCurso?.hora_fin    ?? '',
      };
      sendPushNotification(pushToken, asistenciaId, cursoInfo);
      
      return res.json({ accion: 'pendiente', asistencia_id: asistenciaId, persona: persona.nombre });
    }

    await tx.rollback();
    res.status(400).json({ accion: 'rechazado', motivo: 'Rol no permitido para esta operación' });
  } catch (err) {
    await tx.rollback();
    next(err);
  }
});

/**
 * @openapi
 * /api/rfid/verificar:
 *   post:
 *     tags: [RFID]
 *     summary: Enviar resultado del segundo factor (app móvil)
 *     description: |
 *       Llamado por la **app móvil** del estudiante después de completar
 *       biometría y captura GPS. El backend calcula la distancia Haversine
 *       contra el campus de la UCC Villavicencio (radio 200 m) y actualiza
 *       el estado de verificación a `completado` o `fallido`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RfidVerificarInput'
 *     responses:
 *       200:
 *         description: Verificación procesada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 estado_verificacion:
 *                   type: string
 *                   enum: [completado, fallido]
 *                   example: completado
 *                 dentro_campus:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Método de verificación inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verificar', async (req, res, next) => {
  try {
    const { asistencia_id, dispositivo_movil_id, metodo, exitoso, latitud, longitud } = req.body;

    const sesionRes = await pool.query(
      `SELECT sc.estado 
       FROM asistencia a
       JOIN sesion_clase sc ON sc.id = a.sesion_clase_id
       WHERE a.id = $1`,
      [asistencia_id]
    );

    if (!sesionRes.rows.length) return res.status(404).json({ error: 'Asistencia no encontrada' });
    if (sesionRes.rows[0].estado === 'cerrada') {
      return res.status(400).json({ error: 'La clase ya ha sido cerrada. No es posible verificar.' });
    }

    const CAMPUS_LAT = parseFloat(process.env.CAMPUS_LAT);
    const CAMPUS_LNG = parseFloat(process.env.CAMPUS_LNG);
    const RADIUS_M   = parseInt(process.env.CAMPUS_RADIUS_METERS || '200', 10);

    const R = 6371000;
    const dLat = ((latitud - CAMPUS_LAT) * Math.PI) / 180;
    const dLng = ((longitud - CAMPUS_LNG) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((CAMPUS_LAT * Math.PI) / 180) *
        Math.cos((latitud * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const distanciaMetros = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dentroCampus = distanciaMetros <= RADIUS_M;

    // La ubicación enviada por el cliente no es confiable; el servidor decide según el GPS.
    const ubicacionValida = dentroCampus;
    const verificacionExitosa = exitoso && ubicacionValida;
    
    // Determinar el motivo del rechazo si aplica
    let motivoRechazo = null;
    if (!verificacionExitosa) {
      if (!exitoso) {
        // Falló la biometría
        motivoRechazo = metodo; // fingerprint, face_id, etc.
      } else if (!ubicacionValida) {
        // Falló el GPS
        motivoRechazo = 'ubicacion';
      }
    }
    
    const nuevoEstado = verificacionExitosa ? 'verificado' : 'rechazado';

    const metodoRes = await pool.query(
      'SELECT id FROM metodo_verificacion WHERE nombre = $1', [metodo],
    );
    if (!metodoRes.rows.length) return res.status(400).json({ error: `Método inválido: ${metodo}` });

    // Guardar el registro de verificación biométrica
    await pool.query(
      `INSERT INTO verificacion_biometrica
         (asistencia_id, dispositivo_movil_id, metodo_verificacion_id,
          exitoso, latitud, longitud, dentro_campus)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [asistencia_id, dispositivo_movil_id, metodoRes.rows[0].id,
       exitoso, latitud, longitud, ubicacionValida],
    );

    // Actualizar estado de asistencia
    await pool.query(
      `UPDATE asistencia
       SET estado_verificacion_id = (SELECT id FROM estado_verificacion WHERE nombre = $1),
           estado_asistencia_id = (
             SELECT id FROM estado_asistencia 
             WHERE nombre = CASE WHEN $1 = 'rechazado' THEN 'Ausente' ELSE 'Presente' END
           ),
           verificado_biometrico  = $2, 
           verificado_ubicacion   = $3, 
           latitud                = $4, 
           longitud               = $5
       WHERE id = $6`,
      [nuevoEstado, exitoso, ubicacionValida, latitud, longitud, asistencia_id],
    );

    console.log(
      `[rfid] Verificación ${asistencia_id}: ${nuevoEstado}${motivoRechazo ? ` (falló: ${motivoRechazo})` : ''}`
    );

    res.json({ 
      ok: true, 
      estado_verificacion: nuevoEstado, 
      metodo: metodo,
      motivo_rechazo: motivoRechazo,
      dentro_campus: ubicacionValida,
    });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/rfid/diagnostico:
 *   post:
 *     tags: [RFID]
 *     summary: Diagnosticar por qué falla pasar la tarjeta
 *     description: |
 *       Endpoint para debugging. Devuelve información detallada de:
 *       - ¿El dispositivo existe y está activo?
 *       - ¿La tarjeta existe?
 *       - ¿Hay curso programado en esta hora?
 *       - ¿Hay sesión activa?
 *       - ¿Es estudiante inscrito?
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo_dispositivo:
 *                 type: string
 *               codigo_tarjeta:
 *                 type: string
 *     responses:
 *       200:
 *         description: Información de diagnóstico
 */
router.post('/diagnostico', async (req, res, next) => {
  try {
    const { codigo_dispositivo, codigo_tarjeta } = req.body;
    const diagnostico = {};

    // 1. Verificar dispositivo
    const dispositivoRes = await pool.query(
      `SELECT dr.id, dr.aula_id, a.numero AS aula_numero, ed.nombre AS estado
       FROM dispositivo_rfid dr
       LEFT JOIN aula a ON a.id = dr.aula_id
       LEFT JOIN estado_dispositivo ed ON ed.id = dr.estado_dispositivo_id
       WHERE dr.codigo = $1`,
      [codigo_dispositivo],
    );
    
    if (!dispositivoRes.rows.length) {
      return res.json({ diagnostico: { dispositivo: { existe: false } }, error: 'Dispositivo no registrado' });
    }
    
    const dispositivo = dispositivoRes.rows[0];
    diagnostico.dispositivo = {
      existe: true,
      id: dispositivo.id,
      aula_id: dispositivo.aula_id,
      aula_numero: dispositivo.aula_numero,
      estado: dispositivo.estado,
      activo: dispositivo.estado === 'Activo',
    };

    // 2. Verificar tarjeta
    const personaRes = await pool.query(
      `SELECT p.id, p.nombre, p.apellido, r.nombre AS rol
       FROM persona p
       JOIN rol r ON r.id = p.rol_id
       WHERE p.codigo_tarjeta = $1 AND p.activo = true`,
      [codigo_tarjeta],
    );

    if (!personaRes.rows.length) {
      return res.json({ diagnostico: { ...diagnostico, tarjeta: { existe: false } }, error: 'Tarjeta no registrada' });
    }

    const persona = personaRes.rows[0];
    diagnostico.tarjeta = {
      existe: true,
      id: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      rol: persona.rol,
    };

    if (!dispositivo.aula_id) {
      return res.json({ diagnostico, error: 'Dispositivo sin aula asignada' });
    }

    res.json({ diagnostico, ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
