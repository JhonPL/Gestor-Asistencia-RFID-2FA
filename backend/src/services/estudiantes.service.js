// src/services/estudiantes.service.js
// Gestión de lista de estudiantes por curso.
// Tabla: lista_estudiantes (persona_id, curso_id, activo)

import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

/**
 * Listar estudiantes de un curso (inscritos y su estado activo)
 */
export async function listarEstudiantes(cursoId, activo = undefined) {
  const params = [cursoId];
  const where = activo !== undefined
    ? `AND le.activo = $${params.push(activo)}`
    : '';

  const { rows } = await pool.query(
    `SELECT
       le.id AS lista_id,
       le.persona_id,
       p.nombre,
       p.apellido,
       p.correo,
       pr.nombre AS programa,
       le.activo,
       le.fecha_inscripcion,
       le.created_at,
       COALESCE(COUNT(a.id), 0) AS total_asistencias
     FROM lista_estudiantes le
     JOIN persona p ON p.id = le.persona_id
     LEFT JOIN programa pr ON pr.id = p.programa_id
     LEFT JOIN asistencia a ON a.lista_estudiantes_id = le.id
     WHERE le.curso_id = $1 ${where}
     GROUP BY le.id, le.persona_id, p.nombre, p.apellido, p.correo, pr.nombre, le.activo, le.fecha_inscripcion, le.created_at
     ORDER BY p.nombre, p.apellido`,
    params,
  );
  return rows;
}

/**
 * Listar estudiantes disponibles para inscribir en un curso
 * (que no estén ya inscritos en este curso)
 */
export async function listarDisponibles(cursoId, search = '') {
  const params = [cursoId];
  const searchWhere = search.trim()
    ? `AND (p.nombre ILIKE $${params.push(`%${search.trim()}%`)} 
          OR p.apellido ILIKE $${params.length}
          OR p.correo ILIKE $${params.length})`
    : '';

  const { rows } = await pool.query(
    `SELECT DISTINCT
       p.id,
       p.nombre,
       p.apellido,
       p.correo,
       pr.nombre AS programa
     FROM persona p
     LEFT JOIN programa pr ON pr.id = p.programa_id
     WHERE p.rol_id = (SELECT id FROM rol WHERE nombre = 'estudiante')
       AND p.id NOT IN (
         SELECT persona_id FROM lista_estudiantes WHERE curso_id = $1
       )
       ${searchWhere}
     ORDER BY p.nombre, p.apellido
     LIMIT 50`,
    params,
  );
  return rows;
}

/**
 * Inscribir un estudiante en un curso
 */
export async function inscribir(cursoId, personaId) {
  // Verificar que la persona existe y es estudiante
  const personaCheck = await pool.query(
    `SELECT p.id FROM persona p
     WHERE p.id = $1 AND p.rol_id = (SELECT id FROM rol WHERE nombre = 'estudiante')`,
    [personaId],
  );
  if (!personaCheck.rows.length) {
    throw createError(404, 'Persona no encontrada o no es estudiante');
  }

  // Verificar que el curso existe
  const cursoCheck = await pool.query(
    'SELECT id FROM curso WHERE id = $1',
    [cursoId],
  );
  if (!cursoCheck.rows.length) {
    throw createError(404, 'Curso no encontrado');
  }

  // Verificar que no esté ya inscrito (incluyendo inactivos)
  const existe = await pool.query(
    'SELECT id FROM lista_estudiantes WHERE persona_id = $1 AND curso_id = $2',
    [personaId, cursoId],
  );
  
  if (existe.rows.length) {
    // Si existe pero está inactivo, reactivarlo
    if (!existe.rows[0].activo) {
      await pool.query(
        'UPDATE lista_estudiantes SET activo = true WHERE id = $1',
        [existe.rows[0].id],
      );
      return existe.rows[0].id;
    }
    throw createError(409, 'El estudiante ya está inscrito en este curso');
  }

  // Insertar nueva inscripción
  const { rows } = await pool.query(
    `INSERT INTO lista_estudiantes (persona_id, curso_id, activo)
     VALUES ($1, $2, true)
     RETURNING id`,
    [personaId, cursoId],
  );
  return rows[0].id;
}

/**
 * Cambiar estado activo/inactivo de una inscripción
 */
export async function toggleInscripcion(listaId, cursoId, activo) {
  // Verificar que existe la inscripción
  const check = await pool.query(
    'SELECT id, activo FROM lista_estudiantes WHERE id = $1 AND curso_id = $2',
    [listaId, cursoId],
  );
  if (!check.rows.length) {
    throw createError(404, 'Inscripción no encontrada');
  }

  const resultadoAnterior = check.rows[0].activo;
  
  // Actualizar
  const { rows } = await pool.query(
    'UPDATE lista_estudiantes SET activo = $1 WHERE id = $2 RETURNING activo',
    [activo, listaId],
  );

  return {
    listaId,
    anterior: resultadoAnterior,
    nuevo: rows[0].activo,
  };
}

/**
 * Eliminar inscripción (DELETE físico, no soft-delete)
 */
export async function eliminarInscripcion(listaId, cursoId) {
  // Verificar que existe
  const check = await pool.query(
    'SELECT persona_id FROM lista_estudiantes WHERE id = $1 AND curso_id = $2',
    [listaId, cursoId],
  );
  if (!check.rows.length) {
    throw createError(404, 'Inscripción no encontrada');
  }

  // Eliminar (las asistencias se eliminan en cascada por FK)
  await pool.query(
    'DELETE FROM lista_estudiantes WHERE id = $1',
    [listaId],
  );

  return { listaId, eliminado: true };
}

/**
 * Inscribir múltiples estudiantes a la vez
 */
export async function importarMasivo(cursoId, estudiantes) {
  // estudiantes = [{ persona_id }, { persona_id }, ...]

  if (!Array.isArray(estudiantes) || !estudiantes.length) {
    throw createError(400, 'Se requiere un array de estudiantes no vacío');
  }

  // Verificar que el curso existe
  const cursoCheck = await pool.query(
    'SELECT id FROM curso WHERE id = $1',
    [cursoId],
  );
  if (!cursoCheck.rows.length) {
    throw createError(404, 'Curso no encontrado');
  }

  let inscritos = 0;
  let duplicados = 0;
  let errores = 0;
  const idsInscritos = [];

  for (const { persona_id } of estudiantes) {
    try {
      // Saltamos si está vacío o no es número
      if (!persona_id) continue;

      // Verificar que la persona existe y es estudiante
      const personaCheck = await pool.query(
        `SELECT p.id FROM persona p
         WHERE p.id = $1 AND p.rol_id = (SELECT id FROM rol WHERE nombre = 'estudiante')`,
        [persona_id],
      );
      if (!personaCheck.rows.length) {
        errores++;
        continue;
      }

      // Verificar que no esté ya inscrito
      const existe = await pool.query(
        'SELECT id, activo FROM lista_estudiantes WHERE persona_id = $1 AND curso_id = $2',
        [persona_id, cursoId],
      );

      if (existe.rows.length) {
        if (!existe.rows[0].activo) {
          // Reactivar
          await pool.query(
            'UPDATE lista_estudiantes SET activo = true WHERE id = $1',
            [existe.rows[0].id],
          );
          inscritos++;
          idsInscritos.push(existe.rows[0].id);
        } else {
          duplicados++;
        }
      } else {
        // Insertar nuevo
        const { rows } = await pool.query(
          `INSERT INTO lista_estudiantes (persona_id, curso_id, activo)
           VALUES ($1, $2, true)
           RETURNING id`,
          [persona_id, cursoId],
        );
        inscritos++;
        idsInscritos.push(rows[0].id);
      }
    } catch (err) {
      console.error(`Error inscribiendo persona ${persona_id}:`, err.message);
      errores++;
    }
  }

  return {
    total: estudiantes.length,
    inscritos,
    duplicados,
    errores,
    idsInscritos,
  };
}
