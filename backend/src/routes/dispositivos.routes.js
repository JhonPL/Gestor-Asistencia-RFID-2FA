// src/routes/dispositivos.routes.js
// CRUD completo para la tabla `dispositivo_rfid`
// El "eliminar" es solo cambio de estado (Activo / Inactivo / Mantenimiento)

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
 *   - name: Dispositivos
 *     description: CRUD de dispositivos RFID (solo administrador)
 */

/**
 * @openapi
 * /api/dispositivos:
 *   get:
 *     tags: [Dispositivos]
 *     summary: Listar todos los dispositivos RFID
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [Activo, Inactivo, Mantenimiento] }
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de dispositivos con aula y estado
 */
router.get('/', async (req, res, next) => {
  try {
    const { estado } = req.query;
    const params = [];
    const where = estado
      ? `WHERE ed.nombre = $${params.push(estado)}`
      : '';

    const { rows } = await pool.query(
      `SELECT
         d.id,
         d.codigo,
         d.aula_id,
         a.numero  AS aula_numero,
         a.nombre  AS aula_nombre,
         CASE
           WHEN a.numero IS NOT NULL AND a.nombre IS NOT NULL
             THEN a.numero || ' – ' || a.nombre
           WHEN a.numero IS NOT NULL
             THEN a.numero
           ELSE NULL
         END AS aula,
         d.ip_address,
         d.mac_address,
         d.estado_dispositivo_id,
         ed.nombre AS estado,
         d.ultima_conexion,
         d.created_at
       FROM dispositivo_rfid d
       JOIN estado_dispositivo ed ON ed.id = d.estado_dispositivo_id
       LEFT JOIN aula a ON a.id = d.aula_id
       ${where}
       ORDER BY d.codigo`,
      params,
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/dispositivos/{id}:
 *   get:
 *     tags: [Dispositivos]
 *     summary: Obtener un dispositivo por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         d.id, d.codigo, d.aula_id,
         a.numero AS aula_numero, a.nombre AS aula_nombre,
         CASE
           WHEN a.numero IS NOT NULL AND a.nombre IS NOT NULL
             THEN a.numero || ' – ' || a.nombre
           WHEN a.numero IS NOT NULL THEN a.numero
           ELSE NULL
         END AS aula,
         d.ip_address, d.mac_address,
         d.estado_dispositivo_id, ed.nombre AS estado,
         d.ultima_conexion, d.created_at
       FROM dispositivo_rfid d
       JOIN estado_dispositivo ed ON ed.id = d.estado_dispositivo_id
       LEFT JOIN aula a ON a.id = d.aula_id
       WHERE d.id = $1`,
      [parseInt(req.params.id)],
    );
    if (!rows.length) throw createError(404, 'Dispositivo no encontrado');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/dispositivos:
 *   post:
 *     tags: [Dispositivos]
 *     summary: Crear un dispositivo RFID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo]
 *             properties:
 *               codigo:      { type: string, example: ESP32-05 }
 *               aula_id:     { type: integer, nullable: true }
 *               ip_address:  { type: string, nullable: true }
 *               mac_address: { type: string, nullable: true }
 *               estado:      { type: string, enum: [Activo, Inactivo, Mantenimiento], default: Activo }
 */
router.post('/', async (req, res, next) => {
  try {
    const { codigo, aula_id, ip_address, mac_address, estado = 'Activo' } = req.body;

    if (!codigo?.trim()) throw createError(400, 'El campo código es requerido');

    // Resolver estado_dispositivo_id
    const edRes = await pool.query(
      'SELECT id FROM estado_dispositivo WHERE nombre = $1',
      [estado],
    );
    if (!edRes.rows.length) throw createError(400, `Estado inválido: ${estado}`);
    const estadoId = edRes.rows[0].id;

    // Validar aula si se envía
    if (aula_id) {
      const aulaCheck = await pool.query('SELECT id FROM aula WHERE id = $1', [aula_id]);
      if (!aulaCheck.rows.length) throw createError(404, 'El aula indicada no existe');
    }

    const { rows } = await pool.query(
      `INSERT INTO dispositivo_rfid (codigo, aula_id, ip_address, mac_address, estado_dispositivo_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        codigo.trim().toUpperCase(),
        aula_id || null,
        ip_address?.trim() || null,
        mac_address?.trim() || null,
        estadoId,
      ],
    );

    // Devolver con join
    const { rows: full } = await pool.query(
      `SELECT d.id, d.codigo, d.aula_id,
              a.numero AS aula_numero, a.nombre AS aula_nombre,
              CASE
                WHEN a.numero IS NOT NULL AND a.nombre IS NOT NULL
                  THEN a.numero || ' – ' || a.nombre
                WHEN a.numero IS NOT NULL THEN a.numero
                ELSE NULL
              END AS aula,
              d.ip_address, d.mac_address,
              d.estado_dispositivo_id, ed.nombre AS estado,
              d.ultima_conexion, d.created_at
       FROM dispositivo_rfid d
       JOIN estado_dispositivo ed ON ed.id = d.estado_dispositivo_id
       LEFT JOIN aula a ON a.id = d.aula_id
       WHERE d.id = $1`,
      [rows[0].id],
    );
    res.status(201).json(full[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/dispositivos/{id}:
 *   patch:
 *     tags: [Dispositivos]
 *     summary: Actualizar un dispositivo (PATCH parcial)
 *     description: |
 *       Permite editar código, aula, IP, MAC y/o cambiar el estado
 *       (Activo / Inactivo / Mantenimiento). No existe eliminación física.
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { codigo, aula_id, ip_address, mac_address, estado } = req.body;

    // Verificar que existe
    const check = await pool.query('SELECT id FROM dispositivo_rfid WHERE id = $1', [id]);
    if (!check.rows.length) throw createError(404, 'Dispositivo no encontrado');

    const sets = [];
    const params = [];

    const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

    if (codigo      !== undefined) add('codigo',      codigo.trim().toUpperCase());
    if (ip_address  !== undefined) add('ip_address',  ip_address?.trim() || null);
    if (mac_address !== undefined) add('mac_address', mac_address?.trim() || null);

    // aula_id puede ser null (desasignar)
    if (aula_id !== undefined) {
      if (aula_id !== null) {
        const aulaCheck = await pool.query('SELECT id FROM aula WHERE id = $1', [aula_id]);
        if (!aulaCheck.rows.length) throw createError(404, 'El aula indicada no existe');
      }
      add('aula_id', aula_id || null);
    }

    // Cambio de estado → resuelve FK
    if (estado !== undefined) {
      const edRes = await pool.query(
        'SELECT id FROM estado_dispositivo WHERE nombre = $1',
        [estado],
      );
      if (!edRes.rows.length) throw createError(400, `Estado inválido: ${estado}`);
      add('estado_dispositivo_id', edRes.rows[0].id);
    }

    if (!sets.length) throw createError(400, 'No hay campos válidos para actualizar');

    params.push(id);
    await pool.query(
      `UPDATE dispositivo_rfid SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params,
    );

    // Devolver con join
    const { rows: full } = await pool.query(
      `SELECT d.id, d.codigo, d.aula_id,
              a.numero AS aula_numero, a.nombre AS aula_nombre,
              CASE
                WHEN a.numero IS NOT NULL AND a.nombre IS NOT NULL
                  THEN a.numero || ' – ' || a.nombre
                WHEN a.numero IS NOT NULL THEN a.numero
                ELSE NULL
              END AS aula,
              d.ip_address, d.mac_address,
              d.estado_dispositivo_id, ed.nombre AS estado,
              d.ultima_conexion, d.created_at
       FROM dispositivo_rfid d
       JOIN estado_dispositivo ed ON ed.id = d.estado_dispositivo_id
       LEFT JOIN aula a ON a.id = d.aula_id
       WHERE d.id = $1`,
      [id],
    );
    res.json(full[0]);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/dispositivos/{id}/estado:
 *   patch:
 *     tags: [Dispositivos]
 *     summary: Cambiar solo el estado de un dispositivo
 *     description: |
 *       Endpoint de conveniencia para cambiar rápidamente el estado
 *       sin enviar el objeto completo. No existe DELETE físico.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
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
 *                 enum: [Activo, Inactivo, Mantenimiento]
 */
router.patch('/:id/estado', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { estado } = req.body;

    if (!estado) throw createError(400, 'El campo estado es requerido');

    const edRes = await pool.query(
      'SELECT id FROM estado_dispositivo WHERE nombre = $1',
      [estado],
    );
    if (!edRes.rows.length) throw createError(400, `Estado inválido: ${estado}. Valores: Activo, Inactivo, Mantenimiento`);

    const { rows } = await pool.query(
      `UPDATE dispositivo_rfid SET estado_dispositivo_id = $1
       WHERE id = $2 RETURNING id`,
      [edRes.rows[0].id, id],
    );
    if (!rows.length) throw createError(404, 'Dispositivo no encontrado');

    res.json({ ok: true, id: rows[0].id, estado });
  } catch (err) { next(err); }
});

export default router;