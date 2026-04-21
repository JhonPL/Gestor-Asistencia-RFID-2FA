// src/routes/asistencia.routes.js

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';

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
 *     description: |
 *       Devuelve todos los registros de asistencia de una sesión de clase,
 *       incluyendo el estado de verificación biométrica y el método usado.
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
 *       401:
 *         description: Token faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Rol insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sesion/:sesionId', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
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
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/asistencia/{id}:
 *   patch:
 *     tags: [Asistencia]
 *     summary: Cambiar estado de asistencia manualmente
 *     description: |
 *       Permite al docente o administrador cambiar el estado de un registro
 *       de asistencia (justificar una ausencia, corregir un error, etc.).
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: Estado inválido o faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Registro de asistencia no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ error: 'estado requerido' });

    const eaRes = await pool.query('SELECT id FROM estado_asistencia WHERE nombre = $1', [estado]);
    if (!eaRes.rows.length) return res.status(400).json({ error: `Estado inválido: ${estado}` });

    const { rows } = await pool.query(
      'UPDATE asistencia SET estado_asistencia_id = $1 WHERE id = $2 RETURNING id',
      [eaRes.rows[0].id, req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Registro de asistencia no encontrado' });
    res.json({ ok: true, id: rows[0].id });
  } catch (err) { next(err); }
});

export default router;
