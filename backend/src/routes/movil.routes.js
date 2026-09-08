// backend/src/routes/movil.routes.js
// Endpoints exclusivos para la app móvil (rol estudiante).
// Cubre: sesión activa del día, registro de dispositivo push y historial.

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// A) GET /api/movil/sesiones/activa
//    Devuelve la sesión activa del día para el estudiante autenticado.
//    El mobile usa el campo `estado` para decidir qué pantalla mostrar.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/sesiones/activa',
  verifyJwt,
  requireRole('estudiante'),
  async (req, res, next) => {
    try {
      const personaId = req.user.id;

      // Buscar si hoy hay un registro de asistencia pendiente/completado/fallido
      // en alguna sesión activa a la que el estudiante pertenezca
      const { rows } = await pool.query(
        `SELECT
           a.id                          AS asistencia_id,
           sc.id                         AS sesion_id,
           ev.nombre                     AS estado,
           c.id                          AS curso_id,
           c.codigo                      AS curso_codigo,
           c.nombre                      AS curso_nombre,
           au.numero                     AS aula,
           h.hora_inicio,
           h.hora_fin,
           p.nombre || ' ' || p.apellido AS docente,
           sc.fecha
         FROM asistencia a
         JOIN lista_estudiantes le    ON le.id  = a.lista_estudiantes_id
         JOIN sesion_clase sc         ON sc.id  = a.sesion_clase_id
         JOIN aula_curso_horario ach  ON ach.id = sc.aula_curso_horario_id
         JOIN curso c                 ON c.id   = ach.curso_id
         JOIN aula au                 ON au.id  = ach.aula_id
         JOIN horario h               ON h.id   = ach.horario_id
         JOIN estado_verificacion ev  ON ev.id  = a.estado_verificacion_id
         LEFT JOIN persona p          ON p.id   = sc.persona_id
         WHERE le.persona_id = $1
           AND sc.fecha      = CURRENT_DATE
           AND sc.estado     = 'activa'
           AND ev.nombre    IN ('pendiente', 'verificado', 'rechazado')
         ORDER BY a.id DESC
         LIMIT 1`,
        [personaId],
      );

      if (!rows.length) {
        return res.json({ estado: 'sin_clase' });
      }

      const row = rows[0];
      return res.json({
        estado:       row.estado,
        asistencia_id: row.asistencia_id,
        sesion_id:    row.sesion_id,
        curso: {
          id:     row.curso_id,
          codigo: row.curso_codigo,
          nombre: row.curso_nombre,
        },
        aula:        row.aula,
        hora_inicio: row.hora_inicio,
        hora_fin:    row.hora_fin,
        docente:     row.docente,
        fecha:       row.fecha,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// A.1) GET /api/movil/sesiones/hoy
//      Devuelve TODAS las clases del estudiante para hoy, ordenadas por hora.
//      Incluye la información de asistencia si existe.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/sesiones/hoy',
  verifyJwt,
  requireRole('estudiante'),
  async (req, res, next) => {
    try {
      const personaId = req.user.id;

      // Verificar si el estudiante tiene app registrada
      const deviceCheck = await pool.query(
        `SELECT id FROM dispositivo_movil 
         WHERE persona_id = $1 AND activo = true LIMIT 1`,
        [personaId],
      );
      const tieneApp = deviceCheck.rows.length > 0;


      // Obtener todas las sesiones de hoy donde el estudiante está inscrito
      // La relación es: lista_estudiantes (curso_id) → aula_curso_horario (curso_id) → sesion_clase
      const { rows } = await pool.query(
        `SELECT
           sc.id                         AS sesion_id,
           c.id                          AS curso_id,
           c.codigo                      AS curso_codigo,
           c.nombre                      AS curso_nombre,
           au.numero                     AS aula,
           h.hora_inicio,
           h.hora_fin,
           p.nombre || ' ' || p.apellido AS docente,
           sc.fecha,
           sc.estado                     AS sesion_estado,
           COALESCE(a.id, NULL)          AS asistencia_id,
           ev.nombre                     AS estado_verificacion_real
         FROM lista_estudiantes le
         JOIN aula_curso_horario ach  ON ach.curso_id = le.curso_id
         JOIN sesion_clase sc         ON sc.aula_curso_horario_id = ach.id
         JOIN curso c                 ON c.id = ach.curso_id
         JOIN aula au                 ON au.id = ach.aula_id
         JOIN horario h               ON h.id = ach.horario_id
         JOIN persona p               ON p.id = sc.persona_id
         LEFT JOIN asistencia a       ON a.lista_estudiantes_id = le.id 
                                     AND a.sesion_clase_id = sc.id
         LEFT JOIN estado_verificacion ev ON ev.id = a.estado_verificacion_id
         WHERE le.persona_id = $1
           AND sc.fecha      = CURRENT_DATE
         ORDER BY h.hora_inicio ASC`,
        [personaId],
      );

      // Formatear respuesta
      const sesiones = rows.map((row) => {
        let estadoVerificacion;

        if (row.estado_verificacion_real) {
          estadoVerificacion = row.estado_verificacion_real;
        } else if (row.sesion_estado === 'cerrada') {
          estadoVerificacion = tieneApp ? 'registrado' : 'sin_app';
        } else {
          estadoVerificacion = tieneApp ? 'registrado' : 'sin_app';
        }

        return {
          sesion_id:           row.sesion_id,
          curso: {
            id:     row.curso_id,
            codigo: row.curso_codigo,
            nombre: row.curso_nombre,
          },
          aula:                row.aula,
          hora_inicio:         row.hora_inicio,
          hora_fin:            row.hora_fin,
          docente:             row.docente,
          fecha:               row.fecha,
          sesion_estado:       row.sesion_estado,
          asistencia_id:       row.asistencia_id,
          estado_verificacion: estadoVerificacion,
        };
      });

      res.json(sesiones);
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// B) POST /api/movil/dispositivo
//    Registra o actualiza el dispositivo push del estudiante.
//    Solo un dispositivo puede estar activo por persona.
//    Si el push_token ya existe → actualiza en lugar de duplicar.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/dispositivo',
  verifyJwt,
  requireRole('estudiante'),
  async (req, res, next) => {
    try {
      const personaId = req.user.id;
      const { push_token, plataforma } = req.body;

      // Validaciones básicas
      if (!push_token?.trim()) {
        throw createError(400, 'El campo push_token es requerido');
      }
      if (!plataforma || !['ios', 'android'].includes(plataforma)) {
        throw createError(400, "El campo plataforma debe ser 'ios' o 'android'");
      }

      // Desactivar todos los dispositivos anteriores del usuario
      await pool.query(
        `UPDATE asistencia
        SET estado_verificacion_id = (
          SELECT id FROM estado_verificacion WHERE nombre = 'registrado'
        )
        WHERE estado_verificacion_id = (
          SELECT id FROM estado_verificacion WHERE nombre = 'sin_app'
        )
        AND lista_estudiantes_id IN (
          SELECT id FROM lista_estudiantes WHERE persona_id = $1
        )
        AND sesion_clase_id IN (
          SELECT id FROM sesion_clase 
          WHERE fecha >= CURRENT_DATE
            AND estado != 'cerrada'
        )`,
        [personaId],
      );

      // Insertar el nuevo dispositivo.
      // ON CONFLICT en persona_id: solo un dispositivo activo por persona.
      // Si el usuario hace login de nuevo, actualizar el registro existente
      // con el nuevo push_token (puede cambiar si reinstala la app).
      const { rows } = await pool.query(
        `INSERT INTO dispositivo_movil (persona_id, push_token, plataforma, activo, ultima_sesion)
         VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
         ON CONFLICT (persona_id)
           DO UPDATE SET
             push_token    = EXCLUDED.push_token,
             plataforma    = EXCLUDED.plataforma,
             activo        = true,
             ultima_sesion = CURRENT_TIMESTAMP
         RETURNING id, persona_id, push_token, plataforma, activo, ultima_sesion`,
        [personaId, push_token.trim(), plataforma],
      );

      await pool.query(
  `UPDATE asistencia
   SET estado_verificacion_id = (
     SELECT id FROM estado_verificacion WHERE nombre = 'registrado'
   )
   WHERE estado_verificacion_id = (
     SELECT id FROM estado_verificacion WHERE nombre = 'sin_app'
   )
   AND lista_estudiantes_id IN (
     SELECT id FROM lista_estudiantes WHERE persona_id = $1
   )
   AND sesion_clase_id IN (
     SELECT id FROM sesion_clase 
     WHERE fecha >= CURRENT_DATE
       AND estado != 'cerrada'
   )`,
  [personaId],
);

      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// C) GET /api/movil/historial
//    Últimas 50 asistencias del estudiante en sesiones cerradas.
//    Incluye stats agregados al final.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/historial',
  verifyJwt,
  requireRole('estudiante'),
  async (req, res, next) => {
    try {
      const personaId = req.user.id;

      const { rows } = await pool.query(
        `SELECT
           a.id,
           c.codigo                          AS curso_codigo,
           c.nombre                          AS curso_nombre,
           sc.fecha,
           TO_CHAR(a.hora_registro, 'HH12:MI AM') AS hora_registro,
           ea.nombre                         AS estado,
           ev.nombre                         AS estado_verificacion,
           mv.nombre                         AS metodo,
           vb.dentro_campus,
           vb.exitoso                        AS biometria_exitosa,
           -- fecha_formateada en español  (ej: "Lunes, 7 de julio")
           TO_CHAR(
             sc.fecha,
             'TMDay, FMDD " de " TMMonth'
           )                                 AS fecha_formateada
         FROM asistencia a
         JOIN lista_estudiantes le   ON le.id  = a.lista_estudiantes_id
         JOIN sesion_clase sc        ON sc.id  = a.sesion_clase_id
         JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
         JOIN curso c                ON c.id   = ach.curso_id
         JOIN estado_asistencia  ea  ON ea.id  = a.estado_asistencia_id
         JOIN estado_verificacion ev ON ev.id  = a.estado_verificacion_id
         LEFT JOIN LATERAL (
           SELECT vb.*
           FROM verificacion_biometrica vb
           WHERE vb.asistencia_id = a.id
           ORDER BY vb.id DESC
           LIMIT 1
         ) vb ON true
         LEFT JOIN metodo_verificacion mv
           ON mv.id = vb.metodo_verificacion_id
         WHERE le.persona_id = $1
           AND sc.estado     = 'cerrada'
         ORDER BY sc.fecha DESC, a.hora_registro DESC
         LIMIT 50`,
        [personaId],
      );

      // Calcular stats sobre TODA la historia (no solo los 50 del límite)
      const { rows: statsRows } = await pool.query(
        `SELECT
           COUNT(*)::int                                              AS total,
           COUNT(CASE WHEN ea.nombre = 'Presente'    THEN 1 END)::int AS presentes,
           COUNT(CASE WHEN ea.nombre = 'Ausente'     THEN 1 END)::int AS ausentes,
           COUNT(CASE WHEN ea.nombre = 'Justificado' THEN 1 END)::int AS justificados
         FROM asistencia a
         JOIN lista_estudiantes le ON le.id  = a.lista_estudiantes_id
         JOIN sesion_clase sc      ON sc.id  = a.sesion_clase_id
         JOIN estado_asistencia ea ON ea.id  = a.estado_asistencia_id
         WHERE le.persona_id = $1
           AND sc.estado     = 'cerrada'`,
        [personaId],
      );

      const s = statsRows[0];
      const tasa =
        s.total > 0
          ? Math.round(((s.presentes + s.justificados) / s.total) * 100)
          : 0;

      res.json({
        registros: rows,
        stats: {
          total:          s.total,
          presentes:      s.presentes,
          ausentes:       s.ausentes,
          justificados:   s.justificados,
          tasa_asistencia: tasa,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;