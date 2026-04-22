// src/services/cursos.service.js
// Lógica de negocio para cursos extraída de las rutas.
// Las rutas ahora son delgadas: solo parsean req/res y llaman aquí.

import { pool, getTransaction } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

// ── Consulta de detalle con horarios (usada en GET/:id y POST) ────────────────
export async function getCursoConHorarios(id, client = pool) {
  const { rows } = await client.query(
    `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo, c.persona_id,
            p.nombre || ' ' || p.apellido AS docente,
            COALESCE(
              json_agg(
                json_build_object(
                  'ach_id', ach.id,
                  'aula_id', a.id, 'aula', a.numero,
                  'horario_id', h.id,
                  'dia', d.nombre,
                  'hora_inicio', h.hora_inicio,
                  'hora_fin', h.hora_fin
                ) ORDER BY d.id, h.hora_inicio
              ) FILTER (WHERE ach.id IS NOT NULL),
              '[]'
            ) AS horarios
     FROM curso c
     LEFT JOIN persona p ON p.id = c.persona_id
     LEFT JOIN aula_curso_horario ach ON ach.curso_id = c.id
     LEFT JOIN aula a ON a.id = ach.aula_id
     LEFT JOIN horario h ON h.id = ach.horario_id
     LEFT JOIN dia_semana d ON d.id = h.dia_semana_id
     WHERE c.id = $1
     GROUP BY c.id, p.nombre, p.apellido`,
    [id],
  );
  if (!rows.length) throw createError(404, 'Curso no encontrado');
  return rows[0];
}

// ── Insertar asignaciones aula-horario ────────────────────────────────────────
async function insertAsignaciones(cursoId, asignaciones, tx) {
  if (!asignaciones?.length) return;
  const aulaIds = [...new Set(asignaciones.map(a => a.aula_id).filter(Boolean))];
  if (!aulaIds.length) return;

  const { rows: aulasExistentes } = await tx.query(
    'SELECT id FROM aula WHERE id = ANY($1)', [aulaIds],
  );
  const aulasValidas = new Set(aulasExistentes.map(a => a.id));

  for (const { aula_id, horario_id } of asignaciones) {
    if (!aula_id || !horario_id || !aulasValidas.has(aula_id)) continue;
    await tx.query(
      `INSERT INTO aula_curso_horario (aula_id, curso_id, horario_id)
       VALUES ($1, $2, $3) ON CONFLICT (aula_id, horario_id) DO NOTHING`,
      [aula_id, cursoId, horario_id],
    );
  }
}

// ── CRUD principal ────────────────────────────────────────────────────────────

export async function listarCursos(userId, rol) {
  if (rol === 'administrador') {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo, c.created_at,
              p.nombre || ' ' || p.apellido AS docente, c.persona_id,
              (SELECT COUNT(*)::int FROM lista_estudiantes le
               WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes
       FROM curso c LEFT JOIN persona p ON p.id = c.persona_id
       ORDER BY c.activo DESC, c.nombre`,
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin,
            (SELECT COUNT(*)::int FROM lista_estudiantes le
             WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes
     FROM curso c WHERE c.persona_id = $1 AND c.activo = true ORDER BY c.nombre`,
    [userId],
  );
  return rows;
}

export async function crearCurso({ nombre, codigo, fecha_inicio, fecha_fin, persona_id, activo = true, asignaciones = [] }) {
  if (!nombre?.trim())  throw createError(400, 'El campo nombre es requerido');
  if (!fecha_inicio)    throw createError(400, 'La fecha de inicio es requerida');
  if (!fecha_fin)       throw createError(400, 'La fecha de fin es requerida');
  if (fecha_fin < fecha_inicio) throw createError(400, 'La fecha de fin debe ser posterior al inicio');

  const tx = await getTransaction();
  try {
    await tx.begin();
    const { rows } = await tx.query(
      `INSERT INTO curso (nombre, codigo, fecha_inicio, fecha_fin, persona_id, activo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [nombre.trim(), codigo?.trim().toUpperCase() || null, fecha_inicio, fecha_fin, persona_id || null, activo],
    );
    await insertAsignaciones(rows[0].id, asignaciones, tx);
    await tx.commit();
    return getCursoConHorarios(rows[0].id);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

export async function actualizarCurso(id, campos) {
  const { nombre, codigo, fecha_inicio, fecha_fin, persona_id, activo, asignaciones } = campos;
  const tx = await getTransaction();
  try {
    await tx.begin();
    const check = await tx.query('SELECT id FROM curso WHERE id = $1', [id]);
    if (!check.rows.length) throw createError(404, 'Curso no encontrado');

    const sets = [], params = [];
    const add  = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

    if (nombre      !== undefined) add('nombre',      nombre.trim());
    if (codigo      !== undefined) add('codigo',      codigo?.trim().toUpperCase() || null);
    if (fecha_inicio !== undefined) add('fecha_inicio', fecha_inicio);
    if (fecha_fin   !== undefined) add('fecha_fin',   fecha_fin);
    if (persona_id  !== undefined) add('persona_id',  persona_id || null);
    if (activo      !== undefined) add('activo',      activo);

    if (sets.length) {
      params.push(id);
      await tx.query(`UPDATE curso SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    }

    if (Array.isArray(asignaciones)) {
      await tx.query('DELETE FROM aula_curso_horario WHERE curso_id = $1', [id]);
      await insertAsignaciones(id, asignaciones, tx);
    }

    await tx.commit();
    return getCursoConHorarios(id);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

export async function desactivarCurso(id) {
  const { rows: sesiones } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM sesion_clase
     WHERE aula_curso_horario_id IN (SELECT id FROM aula_curso_horario WHERE curso_id = $1)
     AND estado = 'activa'`,
    [id],
  );
  if (sesiones[0].total > 0) {
    throw createError(409, 'No se puede desactivar: el curso tiene sesiones activas en curso');
  }
  const { rows } = await pool.query(
    'UPDATE curso SET activo = false WHERE id = $1 RETURNING id, nombre', [id],
  );
  if (!rows.length) throw createError(404, 'Curso no encontrado');
  return rows[0];
}