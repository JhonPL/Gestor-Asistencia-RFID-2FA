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
      const { rows } = await pool.query(
        `SELECT
           a.id,
           p.nombre, p.apellido, p.correo,
           ea.nombre  AS estado,
           ev.nombre  AS estado_verificacion,
           a.fecha_registro, a.hora_registro,
           a.verificado_biometrico,
           mv.nombre  AS metodo_verificacion
         FROM asistencia a
         JOIN lista_estudiantes le ON le.id = a.lista_estudiantes_id
         JOIN persona            p  ON p.id  = le.persona_id
         JOIN estado_asistencia  ea ON ea.id = a.estado_asistencia_id
         JOIN estado_verificacion ev ON ev.id = a.estado_verificacion_id
         LEFT JOIN verificacion_biometrica vb ON vb.asistencia_id = a.id
         LEFT JOIN metodo_verificacion mv ON mv.id = vb.metodo_verificacion_id
         WHERE a.sesion_clase_id = $1
         ORDER BY p.apellido`,
        [req.params.sesionId],
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
 *       varios estudiantes a la vez (ej. al terminar de revisar la lista).
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
 *                   required: [asistencia_id, estado]
 *                   properties:
 *                     asistencia_id:
 *                       type: integer
 *                       example: 42
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
 *                 errores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       asistencia_id:
 *                         type: integer
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
      const { cambios } = req.body;

      if (!Array.isArray(cambios) || cambios.length === 0) {
        throw createError(400, 'Se requiere un array "cambios" no vacío');
      }

      // Precarga el catálogo de estados para no hacer N queries al pool
      const { rows: estadosCatalogo } = await pool.query(
        'SELECT id, nombre FROM estado_asistencia',
      );
      const estadoMap = Object.fromEntries(
        estadosCatalogo.map((e) => [e.nombre, e.id]),
      );

      let actualizados = 0;
      const errores = [];

      for (const { asistencia_id, estado } of cambios) {
        // Validar campo por campo sin romper el loop
        if (!asistencia_id || !estado) {
          errores.push({
            asistencia_id: asistencia_id ?? null,
            motivo: 'asistencia_id y estado son requeridos',
          });
          continue;
        }

        const estadoId = estadoMap[estado];
        if (!estadoId) {
          errores.push({
            asistencia_id,
            motivo: `Estado inválido: "${estado}". Valores: Presente, Ausente, Justificado`,
          });
          continue;
        }

        try {
          const { rows } = await pool.query(
            'UPDATE asistencia SET estado_asistencia_id = $1 WHERE id = $2 RETURNING id',
            [estadoId, asistencia_id],
          );
          if (!rows.length) {
            errores.push({
              asistencia_id,
              motivo: 'Registro no encontrado',
            });
          } else {
            actualizados++;
          }
        } catch (updateErr) {
          errores.push({
            asistencia_id,
            motivo: updateErr.message,
          });
        }
      }

      res.json({ ok: true, actualizados, errores });
    } catch (err) {
      next(err);
    }
  },
);

export default router;