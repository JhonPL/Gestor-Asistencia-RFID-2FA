// src/routes/cursos.routes.js

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Cursos
 *     description: Gestión de cursos académicos
 */

/**
 * @openapi
 * /api/cursos:
 *   get:
 *     tags: [Cursos]
 *     summary: Listar cursos
 *     description: |
 *       - **Docente**: devuelve solo sus cursos activos.
 *       - **Administrador**: devuelve todos los cursos con el nombre del docente asignado.
 *     responses:
 *       200:
 *         description: Lista de cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Curso'
 *       401:
 *         description: Token faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', verifyJwt, async (req, res, next) => {
  try {
    const { rol, id: userId } = req.user;
    let query, params;

    if (rol === 'administrador') {
      query = `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo,
                      p.nombre || ' ' || p.apellido AS docente
               FROM curso c LEFT JOIN persona p ON p.id = c.persona_id
               ORDER BY c.nombre`;
      params = [];
    } else {
      query = `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin
               FROM curso c
               WHERE c.persona_id = $1 AND c.activo = true
               ORDER BY c.nombre`;
      params = [userId];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /api/cursos/{id}:
 *   get:
 *     tags: [Cursos]
 *     summary: Detalle de un curso
 *     description: Devuelve el curso con sus aulas y franjas horarias asignadas.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Detalle del curso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoDetalle'
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.codigo, c.fecha_inicio, c.fecha_fin, c.activo,
              json_agg(
                json_build_object(
                  'aula', a.numero,
                  'dia',  d.nombre,
                  'hora_inicio', h.hora_inicio,
                  'hora_fin',    h.hora_fin
                )
              ) AS horarios
       FROM curso c
       JOIN aula_curso_horario ach ON ach.curso_id = c.id
       JOIN aula       a ON a.id = ach.aula_id
       JOIN horario    h ON h.id = ach.horario_id
       JOIN dia_semana d ON d.id = h.dia_semana_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
