// backend/src/routes/stats.routes.js
// Endpoint de métricas para las cards del panel admin.

import { Router } from 'express';
import { verifyJwt }    from '../middlewares/auth.js';
import { requireRole }  from '../middlewares/roles.js';
import { pool }         from '../config/db.js';

const router = Router();
router.use(verifyJwt, requireRole('administrador'));

/**
 * @openapi
 * /api/stats/admin:
 *   get:
 *     tags: [Stats]
 *     summary: Métricas del panel de administración
 *     responses:
 *       200:
 *         description: Objeto con los 4 KPIs de las cards
 */
router.get('/admin', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        -- Personas registradas (activas)
        (SELECT COUNT(*)::int FROM persona WHERE activo = true)
          AS personas_total,

        -- Personas nuevas este mes
        (SELECT COUNT(*)::int FROM persona
          WHERE activo = true
            AND created_at >= date_trunc('month', CURRENT_DATE))
          AS personas_este_mes,

        -- Cursos activos
        (SELECT COUNT(*)::int FROM curso WHERE activo = true)
          AS cursos_activos,

        -- Dispositivos totales y activos
        (SELECT COUNT(*)::int FROM dispositivo_rfid)
          AS dispositivos_total,

        (SELECT COUNT(*)::int
           FROM dispositivo_rfid d
           JOIN estado_dispositivo ed ON ed.id = d.estado_dispositivo_id
          WHERE ed.nombre = 'Activo')
          AS dispositivos_activos,

        -- Sesiones de hoy (total y en curso / activas)
        (SELECT COUNT(*)::int
           FROM sesion_clase
          WHERE fecha = CURRENT_DATE)
          AS sesiones_hoy,

        (SELECT COUNT(*)::int
           FROM sesion_clase
          WHERE fecha = CURRENT_DATE
            AND estado = 'activa')
          AS sesiones_activas_hoy
    `);

    const d = rows[0];

    res.json({
      personas: {
        value: d.personas_total,
        delta: `+${d.personas_este_mes} este mes`,
      },
      cursos: {
        value: d.cursos_activos,
        delta: 'Semestre actual',
      },
      dispositivos: {
        value: d.dispositivos_total,
        delta: `${d.dispositivos_activos} activos`,
      },
      sesiones: {
        value: d.sesiones_hoy,
        delta: `${d.sesiones_activas_hoy} en curso`,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;