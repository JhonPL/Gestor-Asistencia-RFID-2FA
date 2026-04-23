// backend/src/services/sesiones.service.js
import { pool } from '../config/db.js';

/**
 * Convierte ISO day (1=Lunes...7=Domingo) a JS day (0=Dom...6=Sab)
 */
function isoToJsDay(isoDow) {
  return isoDow === 7 ? 0 : isoDow;
}

/**
 * Calcula todas las fechas de un día de semana específico
 * dentro de un rango de fechas.
 * @param {string} fechaInicio - 'YYYY-MM-DD'
 * @param {string} fechaFin    - 'YYYY-MM-DD'
 * @param {number} diaSemanaId - 1=Lunes...7=Domingo
 * @returns {Date[]}
 */
export function calcularFechasSesiones(fechaInicio, fechaFin, diaSemanaId) {
  const fechas = [];
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin    = new Date(fechaFin   + 'T00:00:00');
  const targetJsDay = isoToJsDay(diaSemanaId);

  // Avanzar hasta el primer día que coincida
  const current = new Date(inicio);
  const currentJsDay = current.getDay();
  const diff = (targetJsDay - currentJsDay + 7) % 7;
  current.setDate(current.getDate() + diff);

  // Iterar semana a semana
  while (current <= fin) {
    fechas.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return fechas;
}

/**
 * Genera y persiste en BD todas las sesiones de un curso
 * basándose en sus aula_curso_horario.
 * Usa ON CONFLICT DO NOTHING para ser idempotente.
 * @param {number} cursoId
 * @param {number} docenteId - persona_id del docente asignado
 * @param {object} client    - cliente de transacción (pool o tx)
 */
export async function generarSesionesCurso(cursoId, docenteId, client = pool) {
  // 1. Obtener datos del curso
  const { rows: [curso] } = await client.query(
    `SELECT fecha_inicio, fecha_fin, persona_id
     FROM curso WHERE id = $1`,
    [cursoId],
  );

  if (!curso) throw new Error(`Curso ${cursoId} no encontrado`);

  const personaId = docenteId ?? curso.persona_id;
  if (!personaId) {
    // Sin docente asignado aún → no generar sesiones todavía
    return { generadas: 0, mensaje: 'Sin docente asignado, sesiones no generadas' };
  }

  // 2. Obtener todas las asignaciones aula-horario del curso
  const { rows: asignaciones } = await client.query(
    `SELECT ach.id  AS ach_id,
            h.dia_semana_id
     FROM aula_curso_horario ach
     JOIN horario h ON h.id = ach.horario_id
     WHERE ach.curso_id = $1`,
    [cursoId],
  );

  if (!asignaciones.length) {
    return { generadas: 0, mensaje: 'Sin asignaciones de horario' };
  }

  // 3. Por cada asignación, calcular y crear las fechas
  let totalGeneradas = 0;

  for (const { ach_id, dia_semana_id } of asignaciones) {
    const fechas = calcularFechasSesiones(
      curso.fecha_inicio,
      curso.fecha_fin,
      dia_semana_id,
    );

    for (const fecha of fechas) {
      const fechaStr = fecha.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      const { rowCount } = await client.query(
        `INSERT INTO sesion_clase
           (aula_curso_horario_id, persona_id, fecha, estado)
         VALUES ($1, $2, $3, 'programada')
         ON CONFLICT (aula_curso_horario_id, fecha) DO NOTHING`,
        [ach_id, personaId, fechaStr],
      );

      totalGeneradas += rowCount;
    }
  }

  return { generadas: totalGeneradas };
}

/**
 * Elimina las sesiones 'programadas' futuras de un curso.
 * Útil cuando se actualiza el horario o se desactiva el curso.
 */
export async function eliminarSesionesProgramadas(cursoId, client = pool) {
  const { rowCount } = await client.query(
    `DELETE FROM sesion_clase
     WHERE estado = 'programada'
       AND fecha >= CURRENT_DATE
       AND aula_curso_horario_id IN (
         SELECT id FROM aula_curso_horario WHERE curso_id = $1
       )`,
    [cursoId],
  );
  return { eliminadas: rowCount };
}