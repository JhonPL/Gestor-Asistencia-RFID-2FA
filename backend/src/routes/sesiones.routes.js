// backend/src/routes/sesiones.routes.js
// Historial Y calendario de sesiones de clase.
// Incluye sesiones 'programadas' (futuras) y 'cerradas' (pasadas).

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/sesiones?curso_id=X
 *
 * Devuelve TODAS las sesiones de un curso (programadas + activas + cerradas)
 * con estadísticas de asistencia para las que ya ocurrieron.
 * El frontend usa esto para mostrar el calendario completo del docente.
 */
router.get('/', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const { curso_id } = req.query;
    if (!curso_id) throw createError(400, 'El parámetro curso_id es requerido');

    const cursoIdInt = parseInt(curso_id);

    // Los docentes solo pueden ver sus propios cursos
    if (req.user.rol === 'docente') {
      const check = await pool.query(
        'SELECT id FROM curso WHERE id = $1 AND persona_id = $2 AND activo = true',
        [cursoIdInt, req.user.id],
      );
      if (!check.rows.length) throw createError(403, 'No tienes acceso a este curso');
    }

    const { rows } = await pool.query(
      `SELECT
         sc.id,
         sc.fecha,
         sc.hora_inicio_real,
         sc.hora_fin_real,
         sc.estado,
         a.numero          AS aula,
         a.nombre          AS aula_nombre,
         h.hora_inicio,
         h.hora_fin,
         d.nombre          AS dia,
         -- Estadísticas (solo aplican para sesiones cerradas/activas)
         COUNT(ast.id)::int                                              AS total_registros,
         COUNT(CASE WHEN ea.nombre = 'Presente'    THEN 1 END)::int     AS presentes,
         COUNT(CASE WHEN ea.nombre = 'Ausente'     THEN 1 END)::int     AS ausentes,
         COUNT(CASE WHEN ea.nombre = 'Justificado' THEN 1 END)::int     AS justificados
       FROM sesion_clase sc
       JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
       JOIN aula a                 ON a.id   = ach.aula_id
       JOIN horario h              ON h.id   = ach.horario_id
       JOIN dia_semana d           ON d.id   = h.dia_semana_id
       LEFT JOIN asistencia ast       ON ast.sesion_clase_id     = sc.id
       LEFT JOIN estado_asistencia ea ON ea.id = ast.estado_asistencia_id
       WHERE ach.curso_id = $1
       GROUP BY sc.id, a.numero, a.nombre, h.hora_inicio, h.hora_fin, d.nombre
       ORDER BY sc.fecha ASC, h.hora_inicio ASC`,
      [cursoIdInt],
    );

    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * GET /api/sesiones/:id
 * Detalle de una sesión individual.
 */
router.get('/:id', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         sc.id, sc.fecha, sc.hora_inicio_real, sc.hora_fin_real, sc.estado,
         c.id AS curso_id, c.nombre AS curso_nombre, c.codigo AS curso_codigo,
         a.numero AS aula, a.nombre AS aula_nombre,
         h.hora_inicio, h.hora_fin, d.nombre AS dia
       FROM sesion_clase sc
       JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
       JOIN curso c   ON c.id = ach.curso_id
       JOIN aula a    ON a.id = ach.aula_id
       JOIN horario h ON h.id = ach.horario_id
       JOIN dia_semana d ON d.id = h.dia_semana_id
       WHERE sc.id = $1`,
      [parseInt(req.params.id)],
    );
    if (!rows.length) throw createError(404, 'Sesión no encontrada');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

/**
 * POST /api/sesiones/regenerar/:cursoId  (solo administrador)
 * Regenera manualmente todas las sesiones programadas de un curso.
 * Útil si algo falló al crear/actualizar el curso.
 */
router.post('/regenerar/:cursoId', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const cursoId = parseInt(req.params.cursoId);

    // Verificar que el curso existe y tiene docente
    const { rows: cursoRows } = await pool.query(
      'SELECT id, persona_id, fecha_inicio, fecha_fin FROM curso WHERE id = $1',
      [cursoId],
    );
    if (!cursoRows.length) throw createError(404, 'Curso no encontrado');

    const { persona_id, fecha_inicio, fecha_fin } = cursoRows[0];
    if (!persona_id) throw createError(400, 'El curso no tiene docente asignado');

    // Obtener asignaciones
    const { rows: asignaciones } = await pool.query(
      `SELECT ach.id AS ach_id, h.dia_semana_id
         FROM aula_curso_horario ach
         JOIN horario h ON h.id = ach.horario_id
        WHERE ach.curso_id = $1`,
      [cursoId],
    );
    if (!asignaciones.length) throw createError(400, 'El curso no tiene horarios asignados');

    // Generar sesiones faltantes (ON CONFLICT DO NOTHING = no duplica)
    const start = new Date(fecha_inicio + 'T00:00:00Z');
    const end   = new Date(fecha_fin   + 'T00:00:00Z');
    let count = 0;

    for (const { ach_id, dia_semana_id } of asignaciones) {
      const current = new Date(start);
      while (current <= end) {
        const jsDay  = current.getUTCDay();
        const isoDow = jsDay === 0 ? 7 : jsDay;
        if (isoDow === dia_semana_id) {
          const dateStr = current.toISOString().split('T')[0];
          const { rowCount } = await pool.query(
            `INSERT INTO sesion_clase
               (aula_curso_horario_id, persona_id, fecha, estado)
             VALUES ($1, $2, $3, 'programada')
             ON CONFLICT (aula_curso_horario_id, fecha) DO NOTHING`,
            [ach_id, persona_id, dateStr],
          );
          count += rowCount;
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    res.json({
      ok: true,
      curso_id: cursoId,
      sesiones_nuevas: count,
      mensaje: count > 0
        ? `Se generaron ${count} sesiones nuevas`
        : 'Todas las sesiones ya existían',
    });
  } catch (err) { next(err); }
});

export default router;