// src/routes/sesiones.routes.js
// Historial de sesiones de clase por curso, con estadísticas de asistencia.

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Sesiones
 *     description: Historial de sesiones de clase (docente + administrador)
 */

/**
 * @openapi
 * /api/sesiones:
 *   get:
 *     tags: [Sesiones]
 *     summary: Listar sesiones de un curso
 *     description: |
 *       Devuelve todas las sesiones de clase de un curso con estadísticas
 *       de asistencia (presentes, ausentes, justificados).
 *       Los docentes solo pueden ver sesiones de sus propios cursos.
 *     parameters:
 *       - in: query
 *         name: curso_id
 *         required: true
 *         schema: { type: integer }
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Lista de sesiones con estadísticas
 *       400:
 *         description: curso_id faltante
 *       403:
 *         description: El docente no tiene acceso a este curso
 */
router.get('/', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const { curso_id } = req.query;
    if (!curso_id) throw createError(400, 'El parámetro curso_id es requerido');

    const cursoIdInt = parseInt(curso_id);

    // Los docentes solo pueden ver sesiones de sus propios cursos
    if (req.user.rol === 'docente') {
      const check = await pool.query(
        'SELECT id FROM curso WHERE id = $1 AND persona_id = $2 AND activo = true',
        [cursoIdInt, req.user.id],
      );
      if (!check.rows.length) {
        throw createError(403, 'No tienes acceso a este curso');
      }
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
         COUNT(ast.id)::int                                              AS total_registros,
         COUNT(CASE WHEN ea.nombre = 'Presente'    THEN 1 END)::int     AS presentes,
         COUNT(CASE WHEN ea.nombre = 'Ausente'     THEN 1 END)::int     AS ausentes,
         COUNT(CASE WHEN ea.nombre = 'Justificado' THEN 1 END)::int     AS justificados
       FROM sesion_clase sc
       JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
       JOIN aula a                 ON a.id   = ach.aula_id
       JOIN horario h              ON h.id   = ach.horario_id
       JOIN dia_semana d           ON d.id   = h.dia_semana_id
       LEFT JOIN asistencia ast        ON ast.sesion_clase_id      = sc.id
       LEFT JOIN estado_asistencia ea  ON ea.id = ast.estado_asistencia_id
       WHERE ach.curso_id = $1
       GROUP BY sc.id, a.numero, a.nombre, h.hora_inicio, h.hora_fin, d.nombre
       ORDER BY sc.fecha DESC, h.hora_inicio DESC`,
      [cursoIdInt],
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/sesiones/{id}:
 *   get:
 *     tags: [Sesiones]
 *     summary: Obtener detalle de una sesión
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
       JOIN curso c ON c.id = ach.curso_id
       JOIN aula a ON a.id = ach.aula_id
       JOIN horario h ON h.id = ach.horario_id
       JOIN dia_semana d ON d.id = h.dia_semana_id
       WHERE sc.id = $1`,
      [parseInt(req.params.id)],
    );
    if (!rows.length) throw createError(404, 'Sesión no encontrada');
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;