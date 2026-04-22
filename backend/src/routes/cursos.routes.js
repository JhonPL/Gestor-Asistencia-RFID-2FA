// src/routes/cursos.routes.js
// CRUD completo de cursos + gestión de lista_estudiantes anidada.
// Reemplaza la versión anterior que solo tenía GET.

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool, getTransaction } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CURSOS — CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * tags:
 *   - name: Cursos
 *     description: Gestión de cursos académicos
 */

/** GET /api/cursos — Lista de cursos (docente ve los suyos, admin ve todos) */
router.get('/', verifyJwt, async (req, res, next) => {
  try {
    const { rol, id: userId } = req.user;
    let query, params;

    if (rol === 'administrador') {
      query = `
        SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo, c.created_at,
               p.nombre || ' ' || p.apellido AS docente,
               c.persona_id,
               (SELECT COUNT(*)::int FROM lista_estudiantes le
                WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes
        FROM curso c
        LEFT JOIN persona p ON p.id = c.persona_id
        ORDER BY c.activo DESC, c.nombre`;
      params = [];
    } else {
      query = `
        SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin,
               (SELECT COUNT(*)::int FROM lista_estudiantes le
                WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes
        FROM curso c
        WHERE c.persona_id = $1 AND c.activo = true
        ORDER BY c.nombre`;
      params = [userId];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

/** GET /api/cursos/:id — Detalle con horarios y conteo de estudiantes */
router.get('/:id', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
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
      [parseInt(req.params.id)],
    );
    if (!rows.length) throw createError(404, 'Curso no encontrado');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/** POST /api/cursos — Crear curso + asignaciones aula-horario */
router.post('/', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  const tx = await getTransaction();
  try {
    await tx.begin();

    const { nombre, codigo, fecha_inicio, fecha_fin, persona_id, activo = true, asignaciones = [] } = req.body;

    if (!nombre?.trim())  throw createError(400, 'El campo nombre es requerido');
    if (!fecha_inicio)    throw createError(400, 'La fecha de inicio es requerida');
    if (!fecha_fin)       throw createError(400, 'La fecha de fin es requerida');
    if (fecha_fin < fecha_inicio) throw createError(400, 'La fecha de fin debe ser posterior al inicio');

    const { rows: cursoRows } = await tx.query(
      `INSERT INTO curso (nombre, codigo, fecha_inicio, fecha_fin, persona_id, activo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        nombre.trim(),
        codigo?.trim().toUpperCase() || null,
        fecha_inicio, fecha_fin,
        persona_id || null,
        activo,
      ],
    );
    const cursoId = cursoRows[0].id;

    // Validar y insertar asignaciones aula-horario
    if (asignaciones && asignaciones.length > 0) {
      // Obtener IDs de aulas y horarios válidos
      const aulaIds = [...new Set(asignaciones.map(a => a.aula_id).filter(Boolean))];
      const horarioIds = [...new Set(asignaciones.map(a => a.horario_id).filter(Boolean))];

      if (aulaIds.length > 0) {
        const { rows: aulasExistentes } = await tx.query(
          'SELECT id FROM aula WHERE id = ANY($1)',
          [aulaIds],
        );
        const aulasValidas = new Set(aulasExistentes.map(a => a.id));

        for (const { aula_id, horario_id } of asignaciones) {
          if (!aula_id || !horario_id || !aulasValidas.has(aula_id)) continue;
          await tx.query(
            `INSERT INTO aula_curso_horario (aula_id, curso_id, horario_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (aula_id, horario_id) DO NOTHING`,
            [aula_id, cursoId, horario_id],
          );
        }
      }
    }

    await tx.commit();

    // Devolver curso completo
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo, c.persona_id,
              p.nombre || ' ' || p.apellido AS docente, 0 AS total_estudiantes
       FROM curso c LEFT JOIN persona p ON p.id = c.persona_id
       WHERE c.id = $1`,
      [cursoId],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    await tx.rollback();
    next(err);
  }
});

/** PATCH /api/cursos/:id — Actualizar curso y re-sincronizar asignaciones */
router.patch('/:id', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  const tx = await getTransaction();
  try {
    await tx.begin();

    const id = parseInt(req.params.id);
    const { nombre, codigo, fecha_inicio, fecha_fin, persona_id, activo, asignaciones } = req.body;

    // Verificar que existe
    const check = await tx.query('SELECT id FROM curso WHERE id = $1', [id]);
    if (!check.rows.length) throw createError(404, 'Curso no encontrado');

    // Construir SET dinámico
    const sets   = [];
    const params = [];

    const addField = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

    if (nombre     !== undefined) addField('nombre',      nombre.trim());
    if (codigo     !== undefined) addField('codigo',      codigo?.trim().toUpperCase() || null);
    if (fecha_inicio !== undefined) addField('fecha_inicio', fecha_inicio);
    if (fecha_fin  !== undefined) addField('fecha_fin',   fecha_fin);
    if (persona_id !== undefined) addField('persona_id',  persona_id || null);
    if (activo     !== undefined) addField('activo',      activo);

    if (sets.length) {
      params.push(id);
      await tx.query(
        `UPDATE curso SET ${sets.join(', ')} WHERE id = $${params.length}`,
        params,
      );
    }

    // Re-sincronizar asignaciones si se enviaron
    if (Array.isArray(asignaciones)) {
      // Borrar las actuales del curso
      await tx.query(`DELETE FROM aula_curso_horario WHERE curso_id = $1`, [id]);
      
      // Validar y insertar las nuevas
      if (asignaciones.length > 0) {
        const aulaIds = [...new Set(asignaciones.map(a => a.aula_id).filter(Boolean))];
        
        if (aulaIds.length > 0) {
          const { rows: aulasExistentes } = await tx.query(
            'SELECT id FROM aula WHERE id = ANY($1)',
            [aulaIds],
          );
          const aulasValidas = new Set(aulasExistentes.map(a => a.id));

          for (const { aula_id, horario_id } of asignaciones) {
            if (!aula_id || !horario_id || !aulasValidas.has(aula_id)) continue;
            await tx.query(
              `INSERT INTO aula_curso_horario (aula_id, curso_id, horario_id)
               VALUES ($1, $2, $3)
               ON CONFLICT (aula_id, horario_id) DO NOTHING`,
              [aula_id, id, horario_id],
            );
          }
        }
      }
    }

    await tx.commit();

    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo, c.persona_id,
              p.nombre || ' ' || p.apellido AS docente,
              (SELECT COUNT(*)::int FROM lista_estudiantes le
               WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes
       FROM curso c LEFT JOIN persona p ON p.id = c.persona_id
       WHERE c.id = $1`,
      [id],
    );
    res.json(rows[0]);
  } catch (err) {
    await tx.rollback();
    next(err);
  }
});

/** DELETE /api/cursos/:id — Desactiva el curso (soft delete para preservar historial) */
router.delete('/:id', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Verificar si tiene sesiones activas
    const { rows: sesiones } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM sesion_clase WHERE aula_curso_horario_id IN
       (SELECT id FROM aula_curso_horario WHERE curso_id = $1) AND estado = 'activa'`,
      [id],
    );
    if (sesiones[0].total > 0) {
      throw createError(409, 'No se puede desactivar: el curso tiene sesiones activas en curso');
    }

    const { rows } = await pool.query(
      `UPDATE curso SET activo = false WHERE id = $1 RETURNING id, nombre`,
      [id],
    );
    if (!rows.length) throw createError(404, 'Curso no encontrado');
    res.json({ ok: true, desactivado: rows[0] });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// LISTA DE ESTUDIANTES — rutas anidadas /api/cursos/:id/estudiantes
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/cursos/:id/estudiantes — Estudiantes inscritos en el curso */
router.get('/:id/estudiantes', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const cursoId = parseInt(req.params.id);
    const { activo } = req.query; // ?activo=true|false (sin filtro devuelve todos)

    let where = 'le.curso_id = $1';
    const params = [cursoId];
    if (activo !== undefined) {
      params.push(activo === 'true');
      where += ` AND le.activo = $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT le.id AS lista_id,
              le.activo, le.fecha_inscripcion,
              p.id AS persona_id, p.nombre, p.apellido, p.correo, p.codigo_tarjeta,
              pr.nombre AS programa,
              (SELECT COUNT(*)::int FROM asistencia a WHERE a.lista_estudiantes_id = le.id) AS total_asistencias
       FROM lista_estudiantes le
       JOIN persona p ON p.id = le.persona_id
       LEFT JOIN programa pr ON pr.id = p.programa_id
       WHERE ${where}
       ORDER BY le.activo DESC, p.apellido, p.nombre`,
      params,
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/** POST /api/cursos/:id/estudiantes — Inscribir un estudiante */
router.post('/:id/estudiantes', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const cursoId   = parseInt(req.params.id);
    const { persona_id } = req.body;
    if (!persona_id) throw createError(400, 'persona_id es requerido');

    // Verificar que el curso existe y está activo
    const { rows: curso } = await pool.query('SELECT id, activo FROM curso WHERE id = $1', [cursoId]);
    if (!curso.length)       throw createError(404, 'Curso no encontrado');
    if (!curso[0].activo)    throw createError(400, 'No se puede inscribir en un curso inactivo');

    // Verificar que la persona existe y es estudiante
    const { rows: persona } = await pool.query(
      `SELECT p.id FROM persona p JOIN rol r ON r.id = p.rol_id
       WHERE p.id = $1 AND r.nombre = 'estudiante' AND p.activo = true`,
      [parseInt(persona_id)],
    );
    if (!persona.length) throw createError(404, 'Estudiante no encontrado o inactivo');

    // Upsert: si ya existía inactivo → reactivar
    const { rows } = await pool.query(
      `INSERT INTO lista_estudiantes (persona_id, curso_id, activo)
       VALUES ($1, $2, true)
       ON CONFLICT (persona_id, curso_id)
       DO UPDATE SET activo = true, fecha_inscripcion = CURRENT_TIMESTAMP
       RETURNING id`,
      [parseInt(persona_id), cursoId],
    );

    // Devolver el registro completo
    const { rows: full } = await pool.query(
      `SELECT le.id AS lista_id, le.activo, le.fecha_inscripcion,
              p.id AS persona_id, p.nombre, p.apellido, p.correo, p.codigo_tarjeta,
              pr.nombre AS programa, 0 AS total_asistencias
       FROM lista_estudiantes le
       JOIN persona p ON p.id = le.persona_id
       LEFT JOIN programa pr ON pr.id = p.programa_id
       WHERE le.id = $1`,
      [rows[0].id],
    );
    res.status(201).json(full[0]);
  } catch (err) { next(err); }
});

/** PATCH /api/cursos/:id/estudiantes/:listaId — Activar/desactivar inscripción */
router.patch('/:id/estudiantes/:listaId', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const listaId = parseInt(req.params.listaId);
    const cursoId = parseInt(req.params.id);
    const { activo } = req.body;
    if (activo === undefined) throw createError(400, 'El campo activo es requerido');

    const { rows } = await pool.query(
      `UPDATE lista_estudiantes SET activo = $1
       WHERE id = $2 AND curso_id = $3
       RETURNING id, activo`,
      [activo, listaId, cursoId],
    );
    if (!rows.length) throw createError(404, 'Inscripción no encontrada');
    res.json({ ok: true, ...rows[0] });
  } catch (err) { next(err); }
});

/** DELETE /api/cursos/:id/estudiantes/:listaId — Eliminar inscripción (solo si sin asistencias) */
router.delete('/:id/estudiantes/:listaId', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const listaId = parseInt(req.params.listaId);
    const cursoId = parseInt(req.params.id);

    // Si ya tiene asistencias registradas → solo desactivar, no borrar
    const { rows: asist } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM asistencia WHERE lista_estudiantes_id = $1`,
      [listaId],
    );
    if (asist[0].total > 0) {
      const { rows } = await pool.query(
        `UPDATE lista_estudiantes SET activo = false WHERE id = $1 AND curso_id = $2 RETURNING id`,
        [listaId, cursoId],
      );
      if (!rows.length) throw createError(404, 'Inscripción no encontrada');
      return res.json({ ok: true, accion: 'desactivado', motivo: 'Tiene registros de asistencia' });
    }

    const { rows } = await pool.query(
      `DELETE FROM lista_estudiantes WHERE id = $1 AND curso_id = $2 RETURNING id`,
      [listaId, cursoId],
    );
    if (!rows.length) throw createError(404, 'Inscripción no encontrada');
    res.json({ ok: true, accion: 'eliminado' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTACIÓN MASIVA DESDE EXCEL
// POST /api/cursos/:id/estudiantes/importar
// Body: { estudiantes: [{correo, nombre, apellido, codigo_tarjeta?}] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/estudiantes/importar', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  const tx = await getTransaction();
  try {
    const cursoId = parseInt(req.params.id);
    const { estudiantes } = req.body;

    if (!Array.isArray(estudiantes) || !estudiantes.length) {
      throw createError(400, 'Se requiere un array de estudiantes no vacío');
    }

    // Verificar que el curso existe y está activo
    const { rows: curso } = await pool.query(
      'SELECT id, activo FROM curso WHERE id = $1', [cursoId],
    );
    if (!curso.length)    throw createError(404, 'Curso no encontrado');
    if (!curso[0].activo) throw createError(400, 'No se puede importar en un curso inactivo');

    await tx.begin();

    const rolRes = await tx.query(`SELECT id FROM rol WHERE nombre = 'estudiante'`);
    const rolEstudianteId = rolRes.rows[0].id;

    const resultado = {
      procesados: 0,
      creados:      0,  // personas nuevas creadas
      inscritos:    0,  // inscritos en este proceso
      ya_inscritos: 0,  // ya estaban inscritos y activos
      reactivados:  0,  // estaban inscritos pero inactivos → reactivados
      errores:      [],
    };

    for (const est of estudiantes) {
      resultado.procesados++;
      const correo = est.correo?.trim().toLowerCase();
      if (!correo) {
        resultado.errores.push({ fila: resultado.procesados, correo: est.correo, motivo: 'Correo vacío' });
        continue;
      }

      try {
        // 1. Buscar persona por correo
        let personaId;
        const { rows: personaRows } = await tx.query(
          `SELECT p.id, p.activo, r.nombre AS rol FROM persona p
           JOIN rol r ON r.id = p.rol_id
           WHERE p.correo = $1`,
          [correo],
        );

        if (personaRows.length) {
          const p = personaRows[0];
          // Si existe pero no es estudiante → error
          if (p.rol !== 'estudiante') {
            resultado.errores.push({ fila: resultado.procesados, correo, motivo: `Ya existe con rol "${p.rol}"` });
            continue;
          }
          personaId = p.id;
        } else {
          // 2. Crear persona nueva como estudiante
          const nombre   = est.nombre?.trim();
          const apellido = est.apellido?.trim();
          if (!nombre || !apellido) {
            resultado.errores.push({ fila: resultado.procesados, correo, motivo: 'Nombre y apellido requeridos para crear persona nueva' });
            continue;
          }

          const { rows: nuevaPersona } = await tx.query(
            `INSERT INTO persona (correo, nombre, apellido, rol_id, codigo_tarjeta, activo)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id`,
            [
              correo,
              nombre,
              apellido,
              rolEstudianteId,
              est.codigo_tarjeta?.trim() || null,
            ],
          );
          personaId = nuevaPersona[0].id;
          resultado.creados++;
        }

        // 3. Inscribir en el curso
        const { rows: listaRows } = await tx.query(
          `SELECT id, activo FROM lista_estudiantes
           WHERE persona_id = $1 AND curso_id = $2`,
          [personaId, cursoId],
        );

        if (listaRows.length) {
          if (listaRows[0].activo) {
            resultado.ya_inscritos++;
          } else {
            // Reactivar inscripción
            await tx.query(
              `UPDATE lista_estudiantes SET activo = true, fecha_inscripcion = CURRENT_TIMESTAMP
               WHERE id = $1`,
              [listaRows[0].id],
            );
            resultado.reactivados++;
            resultado.inscritos++;
          }
        } else {
          // Nueva inscripción
          await tx.query(
            `INSERT INTO lista_estudiantes (persona_id, curso_id, activo)
             VALUES ($1, $2, true)`,
            [personaId, cursoId],
          );
          resultado.inscritos++;
        }
      } catch (rowErr) {
        resultado.errores.push({
          fila: resultado.procesados,
          correo,
          motivo: rowErr.code === '23505'
            ? 'Código de tarjeta duplicado'
            : rowErr.message,
        });
      }
    }

    await tx.commit();
    res.json(resultado);
  } catch (err) {
    await tx.rollback();
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Estudiantes NO inscritos — para el selector al agregar uno
// GET /api/cursos/:id/estudiantes/disponibles
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/estudiantes/disponibles', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const cursoId = parseInt(req.params.id);
    const { search = '' } = req.query;

    const params = [cursoId];
    let searchWhere = '';
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      searchWhere = `AND (p.nombre ILIKE $${params.length} OR p.apellido ILIKE $${params.length} OR p.correo ILIKE $${params.length})`;
    }

    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.apellido, p.correo, pr.nombre AS programa
       FROM persona p
       JOIN rol r ON r.id = p.rol_id
       LEFT JOIN programa pr ON pr.id = p.programa_id
       WHERE r.nombre = 'estudiante'
         AND p.activo = true
         AND p.id NOT IN (
           SELECT persona_id FROM lista_estudiantes
           WHERE curso_id = $1 AND activo = true
         )
         ${searchWhere}
       ORDER BY p.apellido, p.nombre
       LIMIT 20`,
      params,
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;