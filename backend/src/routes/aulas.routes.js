// src/routes/aulas.routes.js
import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();
router.use(verifyJwt, requireRole('administrador'));

// GET /api/aulas
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const params = [];
    let where = '';
    if (search?.trim()) {
      params.push(`%${search.trim()}%`);
      where = `WHERE (a.numero ILIKE $1 OR a.nombre ILIKE $1 OR a.edificio ILIKE $1)`;
    }
    const { rows } = await pool.query(
      `SELECT
         a.id, a.numero, a.nombre, a.edificio, a.piso, a.capacidad, a.created_at,
         (SELECT COUNT(*)::int FROM aula_curso_horario ach WHERE ach.aula_id = a.id) AS total_cursos,
         (SELECT COUNT(*)::int FROM dispositivo_rfid    dr  WHERE dr.aula_id  = a.id) AS total_dispositivos
       FROM aula a ${where} ORDER BY a.numero`,
      params,
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/aulas/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.numero, a.nombre, a.edificio, a.piso, a.capacidad, a.created_at,
         (SELECT COUNT(*)::int FROM aula_curso_horario ach WHERE ach.aula_id = a.id) AS total_cursos,
         (SELECT COUNT(*)::int FROM dispositivo_rfid    dr  WHERE dr.aula_id  = a.id) AS total_dispositivos
       FROM aula a WHERE a.id = $1`,
      [parseInt(req.params.id)],
    );
    if (!rows.length) throw createError(404, 'Aula no encontrada');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/aulas
router.post('/', async (req, res, next) => {
  try {
    const { numero, nombre, edificio, piso, capacidad } = req.body;
    if (!numero?.trim()) throw createError(400, 'El campo número es requerido');
    const { rows } = await pool.query(
      `INSERT INTO aula (numero, nombre, edificio, piso, capacidad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, numero, nombre, edificio, piso, capacidad, created_at`,
      [
        numero.trim().toUpperCase(),
        nombre?.trim()   || null,
        edificio?.trim() || null,
        piso      != null && piso      !== '' ? parseInt(piso)      : null,
        capacidad != null && capacidad !== '' ? parseInt(capacidad) : null,
      ],
    );
    res.status(201).json({ ...rows[0], total_cursos: 0, total_dispositivos: 0 });
  } catch (err) { next(err); }
});

// PATCH /api/aulas/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { numero, nombre, edificio, piso, capacidad } = req.body;
    const sets = [], params = [];
    const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

    if (numero    !== undefined) add('numero',    numero?.trim().toUpperCase() || null);
    if (nombre    !== undefined) add('nombre',    nombre?.trim()   || null);
    if (edificio  !== undefined) add('edificio',  edificio?.trim() || null);
    if (piso      !== undefined) add('piso',      piso      != null && piso      !== '' ? parseInt(piso)      : null);
    if (capacidad !== undefined) add('capacidad', capacidad != null && capacidad !== '' ? parseInt(capacidad) : null);
    if (!sets.length) throw createError(400, 'No hay campos válidos para actualizar');

    const check = await pool.query('SELECT id FROM aula WHERE id = $1', [id]);
    if (!check.rows.length) throw createError(404, 'Aula no encontrada');

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE aula SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, numero, nombre, edificio, piso, capacidad, created_at`,
      params,
    );
    const { rows: c } = await pool.query(
      `SELECT (SELECT COUNT(*)::int FROM aula_curso_horario WHERE aula_id=$1) AS total_cursos,
              (SELECT COUNT(*)::int FROM dispositivo_rfid WHERE aula_id=$1) AS total_dispositivos`,
      [id],
    );
    res.json({ ...rows[0], ...c[0] });
  } catch (err) { next(err); }
});

// DELETE /api/aulas/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { rows: cu } = await pool.query(
      `SELECT COUNT(id)::int AS total FROM aula_curso_horario WHERE aula_id = $1`, [id],
    );
    if (cu[0].total > 0)
      throw createError(409, `No se puede eliminar: asignada a ${cu[0].total} curso(s). Reasigna las asignaciones primero.`);

    const { rows: du } = await pool.query(
      `SELECT COUNT(id)::int AS total FROM dispositivo_rfid WHERE aula_id = $1`, [id],
    );
    if (du[0].total > 0)
      throw createError(409, `No se puede eliminar: tiene ${du[0].total} dispositivo(s) RFID. Reasígnalos primero.`);

    const { rows } = await pool.query(
      `DELETE FROM aula WHERE id = $1 RETURNING id, numero, nombre`, [id],
    );
    if (!rows.length) throw createError(404, 'Aula no encontrada');
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) { next(err); }
});

export default router;