// backend/src/services/cursos.service.js
// Lógica de negocio para cursos.
// Genera automáticamente TODAS las sesiones del rango fecha_inicio→fecha_fin
// según los horarios asignados (aula_curso_horario).

import { pool, getTransaction } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

// ── Detalle de curso con horarios ─────────────────────────────────────────────
export async function getCursoConHorarios(id, client = pool) {
  console.log('[getCursoConHorarios] Obteniendo curso', id);
  const { rows } = await client.query(
    `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo, c.persona_id,
            p.nombre || ' ' || p.apellido AS docente,
            (SELECT COUNT(*)::int FROM lista_estudiantes le
             WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes,
            COALESCE(
              json_agg(
                json_build_object(
                  'ach_id',      ach.id,
                  'aula_id',     a.id,
                  'aula',        a.numero,
                  'horario_id',  h.id,
                  'dia',         d.nombre,
                  'hora_inicio', h.hora_inicio,
                  'hora_fin',    h.hora_fin
                ) ORDER BY d.id, h.hora_inicio
              ) FILTER (WHERE ach.id IS NOT NULL),
              '[]'
            ) AS horarios
     FROM curso c
     LEFT JOIN persona p              ON p.id  = c.persona_id
     LEFT JOIN aula_curso_horario ach ON ach.curso_id = c.id
     LEFT JOIN aula a                 ON a.id  = ach.aula_id
     LEFT JOIN horario h              ON h.id  = ach.horario_id
     LEFT JOIN dia_semana d           ON d.id  = h.dia_semana_id
     WHERE c.id = $1
     GROUP BY c.id, p.nombre, p.apellido`,
    [id],
  );
  if (!rows.length) {
    console.log('[getCursoConHorarios] Curso no encontrado:', id);
    throw createError(404, 'Curso no encontrado');
  }
  const resultado = rows[0];
  console.log('[getCursoConHorarios] Curso encontrado:', {
    id: resultado.id,
    nombre: resultado.nombre,
    horariosCount: resultado.horarios?.length || 0,
  });
  return resultado;
}

// ── Insertar asignaciones aula-horario ────────────────────────────────────────
async function insertAsignaciones(cursoId, asignaciones, tx) {
  if (!asignaciones?.length) {
    console.log('[insertAsignaciones] Sin asignaciones para insertar');
    return;
  }

  console.log('[insertAsignaciones] Procesando', asignaciones.length, 'asignaciones para curso', cursoId);

  const aulaIds = [...new Set(asignaciones.map(a => a.aula_id).filter(Boolean))];
  if (!aulaIds.length) {
    console.log('[insertAsignaciones] No hay aulas válidas en las asignaciones');
    return;
  }

  const { rows: aulasExistentes } = await tx.query(
    'SELECT id FROM aula WHERE id = ANY($1)', [aulaIds],
  );
  const aulasValidas = new Set(aulasExistentes.map(a => a.id));
  console.log('[insertAsignaciones] Aulas válidas:', aulasValidas.size, 'de', aulaIds.length);

  let insertadas = 0;
  for (const { aula_id, horario_id } of asignaciones) {
    if (!aula_id || !horario_id) {
      console.log('[insertAsignaciones] Saltando: aula_id=', aula_id, 'horario_id=', horario_id);
      continue;
    }
    if (!aulasValidas.has(aula_id)) {
      console.log('[insertAsignaciones] Aula no válida:', aula_id);
      continue;
    }
    await tx.query(
      `INSERT INTO aula_curso_horario (aula_id, curso_id, horario_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (aula_id, horario_id) DO NOTHING`,
      [aula_id, cursoId, horario_id],
    );
    insertadas++;
  }
  console.log('[insertAsignaciones] Insertadas:', insertadas, 'asignaciones');
}

// ── Generar sesiones para TODO el rango de fechas ────────────────────────────
//
//  Por cada aula_curso_horario del curso:
//    - Obtiene el dia_semana_id del horario asociado
//    - Itera día a día entre fecha_inicio y fecha_fin del curso
//    - Si el ISO day-of-week del día coincide → inserta sesion_clase con estado='programada'
//    - ON CONFLICT DO NOTHING → idempotente (seguro de llamar varias veces)
//
//  ISO day-of-week: 1=Lunes … 7=Domingo  (igual que PostgreSQL ISODOW)
//  JS Date.getUTCDay(): 0=Domingo, 1=Lunes … 6=Sábado
//
async function generarSesionesPorRango(cursoId, personaId, tx) {
  if (!personaId) return; // Sin docente no se pre-generan sesiones

  // Leer fechas del curso dentro de la transacción
  const { rows: cursoRows } = await tx.query(
    'SELECT fecha_inicio, fecha_fin FROM curso WHERE id = $1',
    [cursoId],
  );
  if (!cursoRows.length) return;

  let { fecha_inicio, fecha_fin } = cursoRows[0];

  // Convertir a strings si vienen como objetos Date
  if (fecha_inicio instanceof Date) {
    fecha_inicio = fecha_inicio.toISOString().split('T')[0];
  }
  if (fecha_fin instanceof Date) {
    fecha_fin = fecha_fin.toISOString().split('T')[0];
  }

  console.log(`[sesiones] Curso ${cursoId}: fechas = ${fecha_inicio} a ${fecha_fin}`);

  // Obtener asignaciones con dia_semana_id
  const { rows: asignaciones } = await tx.query(
    `SELECT ach.id AS ach_id, h.dia_semana_id
       FROM aula_curso_horario ach
       JOIN horario h ON h.id = ach.horario_id
      WHERE ach.curso_id = $1`,
    [cursoId],
  );

  console.log(`[sesiones] Asignaciones encontradas: ${asignaciones.length}`, asignaciones);

  if (!asignaciones.length) return;

  // Usar fechas UTC para evitar desplazamientos de zona horaria
  const start = new Date(fecha_inicio + 'T00:00:00Z');
  const end   = new Date(fecha_fin   + 'T00:00:00Z');

  console.log(`[sesiones] Rango UTC: ${start.toISOString()} a ${end.toISOString()}`);

  let count = 0;

  for (const { ach_id, dia_semana_id } of asignaciones) {
    console.log(`[sesiones] Procesando asignación ach_id=${ach_id}, dia_semana_id=${dia_semana_id}`);
    const current = new Date(start);
    let sesionesEstaAsignacion = 0;

    while (current <= end) {
      const jsDay  = current.getUTCDay();        // 0=Dom
      const isoDow = jsDay === 0 ? 7 : jsDay;   // 7=Dom, 1..6=Lun..Sáb

      if (isoDow === dia_semana_id) {
        const dateStr = current.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        console.log(`  [sesiones] Coincide día: ${dateStr} (jsDay=${jsDay}, isoDow=${isoDow})`);

        await tx.query(
          `INSERT INTO sesion_clase
             (aula_curso_horario_id, persona_id, fecha, estado)
           VALUES ($1, $2, $3, 'programada')
           ON CONFLICT (aula_curso_horario_id, fecha) DO NOTHING`,
          [ach_id, personaId, dateStr],
        );
        count++;
        sesionesEstaAsignacion++;
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }
    console.log(`[sesiones] Asignación ach_id=${ach_id}: ${sesionesEstaAsignacion} sesiones`);
  }

  console.log(`[sesiones] curso ${cursoId} → ${count} sesiones generadas/verificadas`);
}

// ── Eliminar sesiones futuras programadas (para regeneración) ─────────────────
async function eliminarSesionesProgramadasFuturas(cursoId, tx) {
  await tx.query(
    `DELETE FROM sesion_clase
      WHERE estado = 'programada'
        AND fecha >= CURRENT_DATE
        AND aula_curso_horario_id IN (
          SELECT id FROM aula_curso_horario WHERE curso_id = $1
        )`,
    [cursoId],
  );
}

// ── CRUD principal ────────────────────────────────────────────────────────────

export async function listarCursos(userId, rol) {
  if (rol === 'administrador') {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo, c.created_at,
              p.nombre || ' ' || p.apellido AS docente, c.persona_id,
              (SELECT COUNT(*)::int FROM lista_estudiantes le
               WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes
         FROM curso c
         LEFT JOIN persona p ON p.id = c.persona_id
        ORDER BY c.activo DESC, c.nombre`,
    );
    return rows;
  }

  // Docente: solo sus cursos activos
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin,
            (SELECT COUNT(*)::int FROM lista_estudiantes le
             WHERE le.curso_id = c.id AND le.activo = true) AS total_estudiantes
       FROM curso c
      WHERE c.persona_id = $1 AND c.activo = true
      ORDER BY c.nombre`,
    [userId],
  );
  return rows;
}

export async function crearCurso({
  nombre, codigo, fecha_inicio, fecha_fin,
  persona_id, activo = true, asignaciones = [],
}) {
  if (!nombre?.trim())          throw createError(400, 'El campo nombre es requerido');
  if (!fecha_inicio)            throw createError(400, 'La fecha de inicio es requerida');
  if (!fecha_fin)               throw createError(400, 'La fecha de fin es requerida');
  if (fecha_fin < fecha_inicio) throw createError(400, 'La fecha de fin debe ser posterior al inicio');

  const tx = await getTransaction();
  try {
    await tx.begin();

    console.log('[CURSO CREATE] persona_id:', persona_id, 'asignaciones:', asignaciones?.length || 0);

    // 1. Insertar el curso
    const { rows } = await tx.query(
      `INSERT INTO curso (nombre, codigo, fecha_inicio, fecha_fin, persona_id, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        nombre.trim(),
        codigo?.trim().toUpperCase() || null,
        fecha_inicio,
        fecha_fin,
        persona_id || null,
        activo,
      ],
    );
    const cursoId = rows[0].id;
    console.log('[CURSO CREATE] Curso creado:', cursoId);

    // 2. Insertar asignaciones aula-horario
    await insertAsignaciones(cursoId, asignaciones, tx);
    console.log('[CURSO CREATE] Asignaciones insertadas');

    // 3. Generar TODAS las sesiones del rango si hay docente + asignaciones
    if (persona_id && asignaciones.length) {
      console.log('[CURSO CREATE] Generando sesiones...');
      await generarSesionesPorRango(cursoId, persona_id, tx);
    } else {
      console.log('[CURSO CREATE] No generar sesiones: persona_id=', persona_id, 'asignaciones.length=', asignaciones?.length);
    }

    await tx.commit();
    return getCursoConHorarios(cursoId);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

export async function actualizarCurso(id, campos) {
  const {
    nombre, codigo, fecha_inicio, fecha_fin,
    persona_id, activo, asignaciones,
  } = campos;

  const tx = await getTransaction();
  try {
    await tx.begin();

    // Leer estado actual del curso
    const { rows: existing } = await tx.query(
      'SELECT id, persona_id, fecha_inicio, fecha_fin FROM curso WHERE id = $1',
      [id],
    );
    if (!existing.length) throw createError(404, 'Curso no encontrado');

    const docenteActual     = existing[0].persona_id;
    const fechaInicioActual = existing[0].fecha_inicio;
    const fechaFinActual    = existing[0].fecha_fin;

    // SET dinámico
    const sets = [], params = [];
    const add  = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

    if (nombre       !== undefined) add('nombre',       nombre.trim());
    if (codigo       !== undefined) add('codigo',       codigo?.trim().toUpperCase() || null);
    if (fecha_inicio !== undefined) add('fecha_inicio', fecha_inicio);
    if (fecha_fin    !== undefined) add('fecha_fin',    fecha_fin);
    if (persona_id   !== undefined) add('persona_id',   persona_id || null);
    if (activo       !== undefined) add('activo',       activo);

    if (sets.length) {
      params.push(id);
      await tx.query(
        `UPDATE curso SET ${sets.join(', ')} WHERE id = $${params.length}`,
        params,
      );
    }

    // Valores finales para lógica de regeneración
    const docenteFinal = persona_id !== undefined ? persona_id : docenteActual;

    const horariosCambiaron  = Array.isArray(asignaciones);
    const fechasCambiaron    = fecha_inicio !== undefined || fecha_fin !== undefined;
    const docenteCambio      = persona_id !== undefined && persona_id !== docenteActual;

    if (horariosCambiaron) {
      // Borrar sesiones futuras programadas y las asignaciones viejas
      await eliminarSesionesProgramadasFuturas(id, tx);
      await tx.query('DELETE FROM aula_curso_horario WHERE curso_id = $1', [id]);

      // Insertar nuevas asignaciones
      await insertAsignaciones(id, asignaciones, tx);

      // Regenerar sesiones con las nuevas asignaciones
      if (docenteFinal && asignaciones.length) {
        await generarSesionesPorRango(id, docenteFinal, tx);
      }

    } else if (fechasCambiaron) {
      // Solo cambió el rango de fechas → regenerar sesiones
      await eliminarSesionesProgramadasFuturas(id, tx);
      if (docenteFinal) {
        await generarSesionesPorRango(id, docenteFinal, tx);
      }

    } else if (docenteCambio && persona_id) {
      // Solo cambió el docente → actualizar persona_id en sesiones futuras programadas
      await tx.query(
        `UPDATE sesion_clase
            SET persona_id = $1
          WHERE estado = 'programada'
            AND fecha >= CURRENT_DATE
            AND aula_curso_horario_id IN (
              SELECT id FROM aula_curso_horario WHERE curso_id = $2
            )`,
        [persona_id, id],
      );
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
    `SELECT COUNT(*)::int AS total
       FROM sesion_clase
      WHERE aula_curso_horario_id IN (
        SELECT id FROM aula_curso_horario WHERE curso_id = $1
      )
      AND estado = 'activa'`,
    [id],
  );
  if (sesiones[0].total > 0) {
    throw createError(409, 'No se puede desactivar: el curso tiene sesiones activas');
  }
  const { rows } = await pool.query(
    'UPDATE curso SET activo = false WHERE id = $1 RETURNING id, nombre',
    [id],
  );
  if (!rows.length) throw createError(404, 'Curso no encontrado');
  return rows[0];
}