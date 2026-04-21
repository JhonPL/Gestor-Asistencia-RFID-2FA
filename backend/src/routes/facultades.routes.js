// src/routes/facultades.routes.js
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
 *   - name: Facultades
 *     description: CRUD de facultades académicas (solo administrador)
 */

/**
 * @openapi
 * /api/facultades:
 *   get:
 *     tags: [Facultades]
 *     summary: Listar todas las facultades
 *     responses:
 *       200:
 *         description: Lista de facultades con conteo de programas
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.nombre, f.created_at,
              COUNT(p.id)::int AS total_programas
       FROM facultad f
       LEFT JOIN programa p ON p.facultad_id = f.id
       GROUP BY f.id
       ORDER BY f.nombre`,
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/facultades/{id}:
 *   get:
 *     tags: [Facultades]
 *     summary: Obtener una facultad con sus programas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { rows } = await pool.query(
      `SELECT f.id, f.nombre, f.created_at,
              COALESCE(
                json_agg(
                  json_build_object('id', p.id, 'nombre', p.nombre, 'codigo', p.codigo)
                  ORDER BY p.nombre
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
              ) AS programas
       FROM facultad f
       LEFT JOIN programa p ON p.facultad_id = f.id
       WHERE f.id = $1
       GROUP BY f.id`,
      [id],
    );
    if (!rows.length) throw createError(404, 'Facultad no encontrada');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/facultades:
 *   post:
 *     tags: [Facultades]
 *     summary: Crear una facultad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string, example: Facultad de Ingeniería }
 */
router.post('/', async (req, res, next) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) {
      throw createError(400, 'El campo nombre es requerido');
    }
    const { rows } = await pool.query(
      `INSERT INTO facultad (nombre) VALUES ($1)
       RETURNING id, nombre, created_at`,
      [nombre.trim()],
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/facultades/{id}:
 *   patch:
 *     tags: [Facultades]
 *     summary: Actualizar nombre de una facultad
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre } = req.body;
    if (!nombre?.trim()) {
      throw createError(400, 'El campo nombre es requerido');
    }
    const { rows } = await pool.query(
      `UPDATE facultad SET nombre = $1
       WHERE id = $2
       RETURNING id, nombre, created_at`,
      [nombre.trim(), id],
    );
    if (!rows.length) throw createError(404, 'Facultad no encontrada');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/facultades/{id}:
 *   delete:
 *     tags: [Facultades]
 *     summary: Eliminar una facultad (y sus programas por CASCADE)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Advertir si hay personas vinculadas a programas de esta facultad
    const { rows: afectados } = await pool.query(
      `SELECT COUNT(pe.id)::int AS total
       FROM persona pe
       JOIN programa pr ON pr.id = pe.programa_id
       WHERE pr.facultad_id = $1`,
      [id],
    );

    if (afectados[0].total > 0) {
      throw createError(
        409,
        `No se puede eliminar: ${afectados[0].total} persona(s) están vinculadas a programas de esta facultad`,
      );
    }

    const { rows } = await pool.query(
      `DELETE FROM facultad WHERE id = $1 RETURNING id, nombre`,
      [id],
    );
    if (!rows.length) throw createError(404, 'Facultad no encontrada');
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) { next(err); }
});

export default router;