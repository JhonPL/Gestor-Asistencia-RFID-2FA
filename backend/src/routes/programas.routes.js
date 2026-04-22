// src/routes/programas.routes.js
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
 *   - name: Programas
 *     description: CRUD de programas académicos (solo administrador)
 */

/**
 * @openapi
 * /api/programas:
 *   get:
 *     tags: [Programas]
 *     summary: Listar todos los programas con nombre de facultad
 *     parameters:
 *       - in: query
 *         name: facultad_id
 *         schema: { type: integer }
 *         description: Filtrar por facultad
 */
router.get('/', async (req, res, next) => {
  try {
    const { facultad_id } = req.query;
    const params = [];
    const where  = facultad_id ? `WHERE p.facultad_id = $${params.push(parseInt(facultad_id))}` : '';

    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.codigo, p.facultad_id, p.created_at,
              f.nombre AS facultad
       FROM programa p
       JOIN facultad f ON f.id = p.facultad_id
       ${where}
       ORDER BY f.nombre, p.nombre`,
      params,
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/programas/{id}:
 *   get:
 *     tags: [Programas]
 *     summary: Obtener un programa por ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.codigo, p.facultad_id, p.created_at,
              f.nombre AS facultad
       FROM programa p
       JOIN facultad f ON f.id = p.facultad_id
       WHERE p.id = $1`,
      [parseInt(req.params.id)],
    );
    if (!rows.length) throw createError(404, 'Programa no encontrado');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/programas:
 *   post:
 *     tags: [Programas]
 *     summary: Crear un programa académico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, facultad_id]
 *             properties:
 *               nombre:      { type: string,  example: Ingeniería de Sistemas }
 *               codigo:      { type: string,  nullable: true, example: ING-SIS }
 *               facultad_id: { type: integer, example: 1 }
 */
router.post('/', async (req, res, next) => {
  try {
    const { nombre, codigo, facultad_id } = req.body;
    if (!nombre?.trim())  throw createError(400, 'El campo nombre es requerido');
    if (!facultad_id)     throw createError(400, 'El campo facultad_id es requerido');

    // Verificar que la facultad existe
    const fac = await pool.query('SELECT id FROM facultad WHERE id = $1', [facultad_id]);
    if (!fac.rows.length) throw createError(404, 'La facultad indicada no existe');

    const codigoFinal = codigo?.trim().toUpperCase() || null;

    const { rows } = await pool.query(
      `INSERT INTO programa (nombre, codigo, facultad_id)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, codigo, facultad_id, created_at`,
      [nombre.trim(), codigoFinal, parseInt(facultad_id)],
    );

    // Devolver con nombre de facultad
    const { rows: full } = await pool.query(
      `SELECT p.id, p.nombre, p.codigo, p.facultad_id, p.created_at,
              f.nombre AS facultad
       FROM programa p JOIN facultad f ON f.id = p.facultad_id
       WHERE p.id = $1`,
      [rows[0].id],
    );
    res.status(201).json(full[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/programas/{id}:
 *   patch:
 *     tags: [Programas]
 *     summary: Actualizar un programa (PATCH parcial)
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, codigo, facultad_id } = req.body;

    // Construir SET dinámico
    const sets   = [];
    const params = [];

    if (nombre !== undefined) {
      if (!nombre.trim()) throw createError(400, 'El nombre no puede estar vacío');
      params.push(nombre.trim());
      sets.push(`nombre = $${params.length}`);
    }
    if (codigo !== undefined) {
      const c = codigo?.trim().toUpperCase() || null;
      params.push(c);
      sets.push(`codigo = $${params.length}`);
    }
    if (facultad_id !== undefined) {
      const fac = await pool.query('SELECT id FROM facultad WHERE id = $1', [facultad_id]);
      if (!fac.rows.length) throw createError(404, 'La facultad indicada no existe');
      params.push(parseInt(facultad_id));
      sets.push(`facultad_id = $${params.length}`);
    }

    if (!sets.length) throw createError(400, 'No hay campos válidos para actualizar');

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE programa SET ${sets.join(', ')}
       WHERE id = $${params.length}
       RETURNING id`,
      params,
    );
    if (!rows.length) throw createError(404, 'Programa no encontrado');

    // Devolver con nombre de facultad
    const { rows: full } = await pool.query(
      `SELECT p.id, p.nombre, p.codigo, p.facultad_id, p.created_at,
              f.nombre AS facultad
       FROM programa p JOIN facultad f ON f.id = p.facultad_id
       WHERE p.id = $1`,
      [rows[0].id],
    );
    res.json(full[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/programas/{id}:
 *   delete:
 *     tags: [Programas]
 *     summary: Eliminar un programa
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Bloquear si hay personas vinculadas
    const { rows: afectados } = await pool.query(
      `SELECT COUNT(id)::int AS total FROM persona WHERE programa_id = $1`,
      [id],
    );
    if (afectados[0].total > 0) {
      throw createError(
        409,
        `No se puede eliminar: ${afectados[0].total} persona(s) están en este programa`,
      );
    }

    const { rows } = await pool.query(
      `DELETE FROM programa WHERE id = $1 RETURNING id, nombre`,
      [id],
    );
    if (!rows.length) throw createError(404, 'Programa no encontrado');
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) { next(err); }
});

export default router;