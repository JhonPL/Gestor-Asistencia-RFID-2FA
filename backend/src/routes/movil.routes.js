// backend/src/routes/movil.routes.js
// Endpoints exclusivos para la app móvil (rol estudiante).
// Cubre: sesión activa del día, registro de dispositivo push y historial.

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { pool } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// A) GET /api/movil/sesiones/activa
//    Devuelve la sesión activa del día para el estudiante autenticado.
//    El mobile usa el campo `estado` para decidir qué pantalla mostrar.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/sesiones/activa',
  verifyJwt,
  requireRole('estudiante'),
  async (req, res, next) => {
    try {
      const personaId = req.user.id;

      // Buscar si hoy hay un registro de asistencia pendiente/completado/fallido
      // en alguna sesión activa a la que el estudiante pertenezca
      const { rows } = await pool.query(
        `SELECT
           a.id                          AS asistencia_id,
           sc.id                         AS sesion_id,
           ev.nombre                     AS estado,
           c.id                          AS curso_id,
           c.codigo                      AS curso_codigo,
           c.nombre                      AS curso_nombre,
           au.numero                     AS aula,
           h.hora_inicio,
           h.hora_fin,
           p.nombre || ' ' || p.apellido AS docente,
           sc.fecha
         FROM asistencia a
         JOIN lista_estudiantes le    ON le.id  = a.lista_estudiantes_id
         JOIN sesion_clase sc         ON sc.id  = a.sesion_clase_id
         JOIN aula_curso_horario ach  ON ach.id = sc.aula_curso_horario_id
         JOIN curso c                 ON c.id   = ach.curso_id
         JOIN aula au                 ON au.id  = ach.aula_id
         JOIN horario h               ON h.id   = ach.horario_id
         JOIN estado_verificacion ev  ON ev.id  = a.estado_verificacion_id
         LEFT JOIN persona p          ON p.id   = sc.persona_id
         WHERE le.persona_id = $1
           AND sc.fecha      = CURRENT_DATE
           AND sc.estado     = 'activa'
           AND ev.nombre    IN ('pendiente', 'completado', 'fallido')
         ORDER BY a.id DESC
         LIMIT 1`,
        [personaId],
      );

      if (!rows.length) {
        return res.json({ estado: 'sin_clase' });
      }

      const row = rows[0];
      return res.json({
        estado:       row.estado,
        asistencia_id: row.asistencia_id,
        sesion_id:    row.sesion_id,
        curso: {
          id:     row.curso_id,
          codigo: row.curso_codigo,
          nombre: row.curso_nombre,
        },
        aula:        row.aula,
        hora_inicio: row.hora_inicio,
        hora_fin:    row.hora_fin,
        docente:     row.docente,
        fecha:       row.fecha,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// B) POST /api/movil/dispositivo
//    Registra o actualiza el dispositivo push del estudiante.
//    Solo un dispositivo puede estar activo por persona.
//    Si el push_token ya existe → actualiza en lugar de duplicar.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/dispositivo',
  verifyJwt,
  requireRole('estudiante'),
  async (req, res, next) => {
    try {
      const personaId = req.user.id;
      const { push_token, plataforma } = req.body;

      // Validaciones básicas
      if (!push_token?.trim()) {
        throw createError(400, 'El campo push_token es requerido');
      }
      if (!plataforma || !['ios', 'android'].includes(plataforma)) {
        throw createError(400, "El campo plataforma debe ser 'ios' o 'android'");
      }

      // Desactivar todos los dispositivos anteriores del usuario
      await pool.query(
        'UPDATE dispositivo_movil SET activo = false WHERE persona_id = $1',
        [personaId],
      );

      // Insertar el nuevo dispositivo.
      // ON CONFLICT en push_token: si el token ya existe (mismo dispositivo,
      // nuevo login) reactivarlo y actualizarlo en lugar de duplicar.
      const { rows } = await pool.query(
        `INSERT INTO dispositivo_movil (persona_id, push_token, plataforma, activo, ultima_sesion)
         VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
         ON CONFLICT (push_token)
           DO UPDATE SET
             persona_id    = EXCLUDED.persona_id,
             plataforma    = EXCLUDED.plataforma,
             activo        = true,
             ultima_sesion = CURRENT_TIMESTAMP
         RETURNING id, persona_id, push_token, plataforma, activo, ultima_sesion`,
        [personaId, push_token.trim(), plataforma],
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// C) GET /api/movil/historial
//    Últimas 50 asistencias del estudiante en sesiones cerradas.
//    Incluye stats agregados al final.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/historial',
  verifyJwt,
  requireRole('estudiante'),
  async (req, res, next) => {
    try {
      const personaId = req.user.id;

      const { rows } = await pool.query(
        `SELECT
           a.id,
           c.codigo                          AS curso_codigo,
           c.nombre                          AS curso_nombre,
           sc.fecha,
           TO_CHAR(a.hora_registro, 'HH12:MI AM') AS hora_registro,
           ea.nombre                         AS estado,
           ev.nombre                         AS estado_verificacion,
           mv.nombre                         AS metodo,
           vb.dentro_campus,
           -- fecha_formateada en español  (ej: "Lunes, 7 de julio")
           TO_CHAR(
             sc.fecha,
             'TMDay, FMDD " de " TMMonth'
           )                                 AS fecha_formateada
         FROM asistencia a
         JOIN lista_estudiantes le   ON le.id  = a.lista_estudiantes_id
         JOIN sesion_clase sc        ON sc.id  = a.sesion_clase_id
         JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
         JOIN curso c                ON c.id   = ach.curso_id
         JOIN estado_asistencia  ea  ON ea.id  = a.estado_asistencia_id
         JOIN estado_verificacion ev ON ev.id  = a.estado_verificacion_id
         LEFT JOIN verificacion_biometrica vb
           ON vb.asistencia_id = a.id
         LEFT JOIN metodo_verificacion mv
           ON mv.id = vb.metodo_verificacion_id
         WHERE le.persona_id = $1
           AND sc.estado     = 'cerrada'
         ORDER BY sc.fecha DESC, a.hora_registro DESC
         LIMIT 50`,
        [personaId],
      );

      // Calcular stats sobre TODA la historia (no solo los 50 del límite)
      const { rows: statsRows } = await pool.query(
        `SELECT
           COUNT(*)::int                                              AS total,
           COUNT(CASE WHEN ea.nombre = 'Presente'    THEN 1 END)::int AS presentes,
           COUNT(CASE WHEN ea.nombre = 'Ausente'     THEN 1 END)::int AS ausentes,
           COUNT(CASE WHEN ea.nombre = 'Justificado' THEN 1 END)::int AS justificados
         FROM asistencia a
         JOIN lista_estudiantes le ON le.id  = a.lista_estudiantes_id
         JOIN sesion_clase sc      ON sc.id  = a.sesion_clase_id
         JOIN estado_asistencia ea ON ea.id  = a.estado_asistencia_id
         WHERE le.persona_id = $1
           AND sc.estado     = 'cerrada'`,
        [personaId],
      );

      const s = statsRows[0];
      const tasa =
        s.total > 0
          ? Math.round(((s.presentes + s.justificados) / s.total) * 100)
          : 0;

      res.json({
        registros: rows,
        stats: {
          total:          s.total,
          presentes:      s.presentes,
          ausentes:       s.ausentes,
          justificados:   s.justificados,
          tasa_asistencia: tasa,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;