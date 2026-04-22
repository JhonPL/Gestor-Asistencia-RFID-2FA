// src/routes/horarios.routes.js
// CRUD completo para la tabla `horario`
// Campos BD: id, dia_semana_id (FK → dia_semana), hora_inicio (TIME), hora_fin (TIME), created_at

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();
router.use(verifyJwt, requireRole('administrador'));

/**
 * @openapi
 * tags:
 *   - name: Horarios
 *     description: CRUD de franjas horarias (solo administrador)
 */

/**
 * @openapi
 * /api/horarios/dias:
 *   get:
 *     tags: [Horarios]
 *     summary: Listar días de la semana
 *     description: Devuelve los 7 días de la semana del catálogo fijo.
 *     responses:
 *       200:
 *         description: Lista de días
 */
router.get('/dias', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre FROM dia_semana ORDER BY id',
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/horarios:
 *   get:
 *     tags: [Horarios]
 *     summary: Listar todas las franjas horarias
 *     description: Devuelve todos los horarios con el nombre del día de la semana.
 *     parameters:
 *       - in: query
 *         name: dia_semana_id
 *         schema: { type: integer }
 *         description: Filtrar por día de la semana
 *     responses:
 *       200:
 *         description: Lista de horarios
 */
router.get('/', async (req, res, next) => {
  try {
    const { dia_semana_id } = req.query;
    const params = [];
    const where = dia_semana_id
      ? `WHERE h.dia_semana_id = $${params.push(parseInt(dia_semana_id))}`
      : '';

    const { rows } = await pool.query(
      `SELECT
         h.id,
         h.dia_semana_id,
         d.nombre AS dia,
         h.hora_inicio,
         h.hora_fin,
         h.created_at
       FROM horario h
       JOIN dia_semana d ON d.id = h.dia_semana_id
       ${where}
       ORDER BY d.id, h.hora_inicio`,
      params,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/horarios/{id}:
 *   get:
 *     tags: [Horarios]
 *     summary: Obtener un horario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Datos del horario
 *       404:
 *         description: Horario no encontrado
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.id, h.dia_semana_id, d.nombre AS dia, h.hora_inicio, h.hora_fin, h.created_at
       FROM horario h
       JOIN dia_semana d ON d.id = h.dia_semana_id
       WHERE h.id = $1`,
      [parseInt(req.params.id)],
    );
    if (!rows.length) throw createError(404, 'Horario no encontrado');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/horarios:
 *   post:
 *     tags: [Horarios]
 *     summary: Crear una franja horaria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dia_semana_id, hora_inicio, hora_fin]
 *             properties:
 *               dia_semana_id: { type: integer, example: 1 }
 *               hora_inicio:   { type: string,  example: "08:00" }
 *               hora_fin:      { type: string,  example: "10:00" }
 *     responses:
 *       201:
 *         description: Horario creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/', async (req, res, next) => {
  try {
    const { dia_semana_id, hora_inicio, hora_fin } = req.body;

    if (!dia_semana_id) throw createError(400, 'El campo dia_semana_id es requerido');
    if (!hora_inicio)   throw createError(400, 'El campo hora_inicio es requerido');
    if (!hora_fin)      throw createError(400, 'El campo hora_fin es requerido');
    if (hora_fin <= hora_inicio) {
      throw createError(400, 'hora_fin debe ser posterior a hora_inicio');
    }

    // Verificar que el día existe
    const dia = await pool.query('SELECT id FROM dia_semana WHERE id = $1', [dia_semana_id]);
    if (!dia.rows.length) throw createError(400, 'El dia_semana_id indicado no existe');

    const { rows } = await pool.query(
      `INSERT INTO horario (dia_semana_id, hora_inicio, hora_fin)
       VALUES ($1, $2, $3)
       RETURNING id, dia_semana_id, hora_inicio, hora_fin, created_at`,
      [parseInt(dia_semana_id), hora_inicio, hora_fin],
    );

    // Devolver con nombre del día
    const { rows: full } = await pool.query(
      `SELECT h.id, h.dia_semana_id, d.nombre AS dia, h.hora_inicio, h.hora_fin, h.created_at
       FROM horario h JOIN dia_semana d ON d.id = h.dia_semana_id
       WHERE h.id = $1`,
      [rows[0].id],
    );
    res.status(201).json(full[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/horarios/{id}:
 *   patch:
 *     tags: [Horarios]
 *     summary: Actualizar una franja horaria (PATCH parcial)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dia_semana_id: { type: integer }
 *               hora_inicio:   { type: string }
 *               hora_fin:      { type: string }
 *     responses:
 *       200:
 *         description: Horario actualizado
 *       404:
 *         description: Horario no encontrado
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { dia_semana_id, hora_inicio, hora_fin } = req.body;

    const sets   = [];
    const params = [];

    if (dia_semana_id !== undefined) {
      const dia = await pool.query('SELECT id FROM dia_semana WHERE id = $1', [dia_semana_id]);
      if (!dia.rows.length) throw createError(400, 'El dia_semana_id indicado no existe');
      params.push(parseInt(dia_semana_id));
      sets.push(`dia_semana_id = $${params.length}`);
    }
    if (hora_inicio !== undefined) {
      params.push(hora_inicio);
      sets.push(`hora_inicio = $${params.length}`);
    }
    if (hora_fin !== undefined) {
      params.push(hora_fin);
      sets.push(`hora_fin = $${params.length}`);
    }

    if (!sets.length) throw createError(400, 'No hay campos válidos para actualizar');

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE horario SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id`,
      params,
    );
    if (!rows.length) throw createError(404, 'Horario no encontrado');

    // Validar hora_fin > hora_inicio con los valores actuales
    const { rows: updated } = await pool.query(
      `SELECT hora_inicio, hora_fin FROM horario WHERE id = $1`,
      [rows[0].id],
    );
    if (updated[0].hora_fin <= updated[0].hora_inicio) {
      // Rollback lógico: revertir el update
      throw createError(400, 'hora_fin debe ser posterior a hora_inicio');
    }

    // Devolver con nombre del día
    const { rows: full } = await pool.query(
      `SELECT h.id, h.dia_semana_id, d.nombre AS dia, h.hora_inicio, h.hora_fin, h.created_at
       FROM horario h JOIN dia_semana d ON d.id = h.dia_semana_id
       WHERE h.id = $1`,
      [rows[0].id],
    );
    res.json(full[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/horarios/{id}:
 *   delete:
 *     tags: [Horarios]
 *     summary: Eliminar una franja horaria
 *     description: |
 *       Bloquea la eliminación si el horario está siendo usado en `aula_curso_horario`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Horario eliminado
 *       409:
 *         description: El horario está en uso y no puede eliminarse
 *       404:
 *         description: Horario no encontrado
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Bloquear si está asignado a algún aula_curso_horario
    const { rows: usos } = await pool.query(
      `SELECT COUNT(id)::int AS total FROM aula_curso_horario WHERE horario_id = $1`,
      [id],
    );
    if (usos[0].total > 0) {
      throw createError(
        409,
        `No se puede eliminar: este horario está asignado a ${usos[0].total} curso(s)`,
      );
    }

    const { rows } = await pool.query(
      'DELETE FROM horario WHERE id = $1 RETURNING id, hora_inicio, hora_fin',
      [id],
    );
    if (!rows.length) throw createError(404, 'Horario no encontrado');
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;