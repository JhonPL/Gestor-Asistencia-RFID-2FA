// src/routes/index.js
import { Router } from 'express';
import authRoutes        from './auth.routes.js';
import personasRoutes    from './personas.routes.js';
import cursosRoutes      from './cursos.routes.js';
import asistenciaRoutes  from './asistencia.routes.js';
import rfidRoutes        from './rfid.routes.js';
import facultadesRoutes  from './facultades.routes.js';
import programasRoutes   from './programas.routes.js';
import horariosRoutes    from './horarios.routes.js';   // ← NUEVO

const router = Router();

router.use('/auth',       authRoutes);
router.use('/personas',   personasRoutes);
router.use('/cursos',     cursosRoutes);
router.use('/asistencia', asistenciaRoutes);
router.use('/rfid',       rfidRoutes);
router.use('/facultades', facultadesRoutes);
router.use('/programas',  programasRoutes);
router.use('/horarios',   horariosRoutes);             // ← NUEVO

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;