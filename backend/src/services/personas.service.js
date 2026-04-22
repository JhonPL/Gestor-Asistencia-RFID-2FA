// src/services/personas.service.js
// Corrección: se añade p.programa_id al SELECT de getPersonas y getPersonaById
// para que el frontend pueda preseleccionar el programa al editar.

import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

// Listado con filtros opcionales
export async function getPersonas({ rol, activo, search } = {}) {
  const conditions = [];
  const params = [];

  if (rol) {
    params.push(rol);
    conditions.push(`r.nombre = $${params.length}`);
  }
  if (activo !== undefined) {
    params.push(activo);
    conditions.push(`p.activo = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(p.nombre ILIKE $${params.length} OR p.apellido ILIKE $${params.length} OR p.correo ILIKE $${params.length})`,
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT
       p.id, p.nombre, p.apellido, p.correo,
       p.codigo_tarjeta, p.activo, p.created_at,
       p.programa_id,
       r.nombre  AS rol,
       pr.nombre AS programa
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     LEFT JOIN programa pr ON pr.id = p.programa_id
     ${where}
     ORDER BY p.apellido, p.nombre`,
    params,
  );
  return rows;
}

export async function getPersonaById(id) {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.nombre, p.apellido, p.correo,
       p.codigo_tarjeta, p.activo, p.programa_id,
       r.nombre  AS rol,
       pr.nombre AS programa
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     LEFT JOIN programa pr ON pr.id = p.programa_id
     WHERE p.id = $1`,
    [id],
  );
  if (!rows.length) throw createError(404, 'Persona no encontrada');
  return rows[0];
}

export async function createPersona({ nombre, apellido, correo, rolNombre, programaId }) {
  const rolRes = await pool.query('SELECT id FROM rol WHERE nombre = $1', [rolNombre]);
  if (!rolRes.rows.length) throw createError(400, `Rol inválido: ${rolNombre}`);
  const rolId = rolRes.rows[0].id;

  const { rows } = await pool.query(
    `INSERT INTO persona (nombre, apellido, correo, rol_id, programa_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombre, apellido, correo, activo, programa_id`,
    [nombre, apellido, correo, rolId, programaId || null],
  );

  const result = rows[0];

  // Enriquecer con nombre de rol y programa
  const prog = programaId
    ? await pool.query('SELECT nombre FROM programa WHERE id = $1', [programaId])
    : { rows: [] };

  return {
    ...result,
    rol:           rolNombre,
    programa:      prog.rows[0]?.nombre ?? null,
    codigo_tarjeta: null,
  };
}

export async function updatePersona(id, campos) {
  const allowed = ['nombre', 'apellido', 'correo', 'activo', 'programa_id'];
  const sets = [];
  const params = [];

  for (const [key, val] of Object.entries(campos)) {
    if (allowed.includes(key)) {
      params.push(val);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) throw createError(400, 'No hay campos válidos para actualizar');

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE persona
     SET ${sets.join(', ')}
     WHERE id = $${params.length}
     RETURNING id, nombre, apellido, correo, activo, programa_id`,
    params,
  );
  if (!rows.length) throw createError(404, 'Persona no encontrada');

  // Enriquecer con nombres de rol y programa
  const updated = rows[0];
  const enriched = await pool.query(
    `SELECT r.nombre AS rol, pr.nombre AS programa
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     LEFT JOIN programa pr ON pr.id = p.programa_id
     WHERE p.id = $1`,
    [updated.id],
  );

  return {
    ...updated,
    rol:      enriched.rows[0]?.rol      ?? null,
    programa: enriched.rows[0]?.programa ?? null,
  };
}

export async function linkTarjeta(personaId, codigoTarjeta) {
  const { rows } = await pool.query(
    'UPDATE persona SET codigo_tarjeta = $1 WHERE id = $2 RETURNING id, codigo_tarjeta',
    [codigoTarjeta, personaId],
  );
  if (!rows.length) throw createError(404, 'Persona no encontrada');
  return rows[0];
}