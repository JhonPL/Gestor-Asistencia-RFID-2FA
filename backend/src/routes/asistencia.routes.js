// src/routes/asistencia.routes.js

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Asistencia
 *     description: Consulta y edición manual del registro de asistencia
 */

/**
 * @openapi
 * /api/asistencia/sesion/{sesionId}:
 *   get:
 *     tags: [Asistencia]
 *     summary: Lista de asistencia de una sesión
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 14
 *     responses:
 *       200:
 *         description: Lista de registros de asistencia
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RegistroAsistencia'
 */
router.get(
  '/sesion/:sesionId',
  verifyJwt,
  requireRole('docente', 'administrador'),
  async (req, res, next) => {
    try {
      // Obtener sesión para encontrar el curso
      const sesionRes = await pool.query(
        'SELECT curso_id FROM aula_curso_horario WHERE id = (SELECT aula_curso_horario_id FROM sesion_clase WHERE id = $1)',
        [req.params.sesionId],
      );
      
      if (!sesionRes.rows.length) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }

      const cursoId = sesionRes.rows[0].curso_id;

      // Obtener todos los estudiantes inscritos con su estado de asistencia (si existe)
      const { rows } = await pool.query(
        `SELECT
          COALESCE(a.id, 0) AS id,
          le.id AS lista_estudiantes_id,
          p.nombre, p.apellido, p.correo,
          COALESCE(ea.nombre, 'Pendiente') AS estado,
          -- ← CAMBIO AQUÍ: verificar si tiene app registrada
          CASE
            WHEN ev.nombre IS NOT NULL THEN ev.nombre
            WHEN EXISTS (
              SELECT 1 FROM dispositivo_movil dm 
              WHERE dm.persona_id = p.id AND dm.activo = true
            ) THEN 'registrado'
            ELSE 'sin_app'
          END AS estado_verificacion,
          a.fecha_registro, a.hora_registro,
          COALESCE(a.verificado_biometrico, false) AS verificado_biometrico,
          mv.nombre AS metodo_verificacion
        FROM lista_estudiantes le
        JOIN persona p ON p.id = le.persona_id
        LEFT JOIN asistencia a ON a.lista_estudiantes_id = le.id AND a.sesion_clase_id = $1
        LEFT JOIN estado_asistencia ea ON ea.id = a.estado_asistencia_id
        LEFT JOIN estado_verificacion ev ON ev.id = a.estado_verificacion_id
        LEFT JOIN verificacion_biometrica vb ON vb.asistencia_id = a.id
        LEFT JOIN metodo_verificacion mv ON mv.id = vb.metodo_verificacion_id
        WHERE le.curso_id = $2 AND le.activo = true
        ORDER BY p.apellido`,
        [req.params.sesionId, cursoId],
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/asistencia/{id}:
 *   patch:
 *     tags: [Asistencia]
 *     summary: Cambiar estado de asistencia manualmente (un registro)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 42
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [Presente, Ausente, Justificado]
 *                 example: Justificado
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado inválido o faltante
 *       404:
 *         description: Registro de asistencia no encontrado
 */
router.patch(
  '/:id',
  verifyJwt,
  requireRole('docente', 'administrador'),
  async (req, res, next) => {
    try {
      const { estado } = req.body;
      if (!estado) return res.status(400).json({ error: 'estado requerido' });

      const eaRes = await pool.query(
        'SELECT id FROM estado_asistencia WHERE nombre = $1',
        [estado],
      );
      if (!eaRes.rows.length) {
        return res.status(400).json({ error: `Estado inválido: ${estado}` });
      }

      const { rows } = await pool.query(
        'UPDATE asistencia SET estado_asistencia_id = $1 WHERE id = $2 RETURNING id',
        [eaRes.rows[0].id, req.params.id],
      );
      if (!rows.length) {
        return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
      }
      res.json({ ok: true, id: rows[0].id });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /api/asistencia/batch:
 *   post:
 *     tags: [Asistencia]
 *     summary: Actualizar múltiples registros de asistencia en un solo request
 *     description: |
 *       Permite al docente o administrador guardar los cambios de estado de
 *       varios estudiantes a la vez. Crea registros nuevos si no existen.
 *       Procesa cada elemento de forma independiente: si uno falla, los demás
 *       se actualizan igualmente y el error queda registrado en la respuesta.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cambios]
 *             properties:
 *               cambios:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [estado]
 *                   properties:
 *                     asistencia_id:
 *                       type: integer
 *                       description: ID del registro existente (0 si es nuevo)
 *                       example: 42
 *                     lista_estudiantes_id:
 *                       type: integer
 *                       description: ID del estudiante (requerido si asistencia_id es 0)
 *                       example: 5
 *                     sesion_clase_id:
 *                       type: integer
 *                       description: ID de la sesión (requerido si asistencia_id es 0)
 *                       example: 14
 *                     estado:
 *                       type: string
 *                       enum: [Presente, Ausente, Justificado]
 *                       example: Justificado
 *     responses:
 *       200:
 *         description: Resultado del batch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 actualizados:
 *                   type: integer
 *                   example: 5
 *                 creados:
 *                   type: integer
 *                   example: 2
 *                 errores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       motivo:
 *                         type: string
 *       400:
 *         description: El array cambios está vacío o falta
 */
router.post(
  '/batch',
  verifyJwt,
  requireRole('docente', 'administrador'),
  async (req, res, next) => {
    try {
      console.log('\n🚀 ===== INICIO ENDPOINT /batch =====');
      console.log('Método:', req.method);
      console.log('URL:', req.originalUrl);
      console.log('Headers:', req.headers);
      
      const { cambios } = req.body;
      console.log('📥 Body recibido:', JSON.stringify(req.body, null, 2));

      if (!Array.isArray(cambios) || cambios.length === 0) {
        console.log('❌ Error: cambios no es array o está vacío');
        throw createError(400, 'Se requiere un array "cambios" no vacío');
      }

      console.log('📥 [BATCH] Cambios recibidos:', JSON.stringify(cambios, null, 2));

      // Precarga el catálogo de estados para no hacer N queries al pool
      const { rows: estadosCatalogo } = await pool.query(
        'SELECT id, nombre FROM estado_asistencia',
      );
      console.log('📋 [BATCH] Estados disponibles:', estadosCatalogo);
      
      const estadoMap = Object.fromEntries(
        estadosCatalogo.map((e) => [e.nombre, e.id]),
      );
      console.log('🗺️ [BATCH] Mapa de estados:', estadoMap);

      let actualizados = 0;
      let creados = 0;
      const errores = [];

      for (const cambio of cambios) {
        const { asistencia_id, lista_estudiantes_id, sesion_clase_id, estado } = cambio;

        console.log(`\n🔍 [BATCH] Procesando cambio:`, { asistencia_id, lista_estudiantes_id, sesion_clase_id, estado });

        // Validar estado
        if (!estado) {
          console.log('❌ Estado requerido faltante');
          errores.push({ motivo: 'estado es requerido' });
          continue;
        }

        const estadoId = estadoMap[estado];
        if (!estadoId) {
          console.log(`❌ Estado inválido: "${estado}"`);
          errores.push({
            motivo: `Estado inválido: "${estado}". Valores: Presente, Ausente, Justificado`,
          });
          continue;
        }

        try {
          if (asistencia_id && asistencia_id > 0) {
            // Caso 1: UPDATE de registro existente
            console.log(`📝 UPDATE: asistencia_id=${asistencia_id}, estadoId=${estadoId}`);
            const { rows } = await pool.query(
              'UPDATE asistencia SET estado_asistencia_id = $1 WHERE id = $2 RETURNING id',
              [estadoId, asistencia_id],
            );
            if (rows.length) {
              console.log(`✅ UPDATE exitoso, id=${rows[0].id}`);
              actualizados++;
            } else {
              console.log(`❌ UPDATE falló: no encontrado`);
              errores.push({ asistencia_id, motivo: 'Registro no encontrado' });
            }
          } else if (lista_estudiantes_id && sesion_clase_id) {
            // Caso 2: CREATE de nuevo registro
            console.log(`➕ INSERT: lista_estudiantes_id=${lista_estudiantes_id}, sesion_clase_id=${sesion_clase_id}, estadoId=${estadoId}`);
            
            // Obtener ID del estado de verificación "sin_app" 
            const { rows: evRows } = await pool.query(
              'SELECT id FROM estado_verificacion WHERE nombre = $1',
              ['sin_app'],
            );
            const estadoVerificacionId = evRows.length > 0 ? evRows[0].id : 1; // Por defecto id 1 si no existe
            
            const { rows } = await pool.query(
              'INSERT INTO asistencia (lista_estudiantes_id, sesion_clase_id, estado_asistencia_id, estado_verificacion_id, fecha_registro, hora_registro) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
              [lista_estudiantes_id, sesion_clase_id, estadoId, estadoVerificacionId],
            );
            if (rows.length) {
              console.log(`✅ INSERT exitoso, nuevo id=${rows[0].id}`);
              creados++;
            } else {
              console.log(`❌ INSERT falló: no retornó id`);
              errores.push({
                lista_estudiantes_id,
                motivo: 'No se pudo crear el registro',
              });
            }
          } else {
            console.log('❌ Parámetros insuficientes');
            errores.push({
              motivo: 'Se requiere asistencia_id > 0 O (lista_estudiantes_id Y sesion_clase_id)',
            });
          }
        } catch (updateErr) {
          console.error(`❌ Error durante procesamiento:`, updateErr.message);
          errores.push({
            motivo: updateErr.message,
          });
        }
      }

      const resultado = { ok: true, actualizados, creados, errores };
      console.log('📤 [BATCH] Resultado final:', JSON.stringify(resultado, null, 2));
      console.log('🚀 ===== FIN ENDPOINT /batch =====\n');
      res.json(resultado);
    } catch (err) {
      console.error('❌ [BATCH] Error general:', err);
      next(err);
    }
  },
);

export default router;