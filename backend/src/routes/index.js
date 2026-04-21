// src/routes/index.js
// Punto central que registra todos los routers bajo /api

import { Router } from 'express';
import authRoutes       from './auth.routes.js';
import personasRoutes   from './personas.routes.js';
import cursosRoutes     from './cursos.routes.js';
import asistenciaRoutes from './asistencia.routes.js';
import rfidRoutes       from './rfid.routes.js';

const router = Router();

router.use('/auth',       authRoutes);
router.use('/personas',   personasRoutes);
router.use('/cursos',     cursosRoutes);
router.use('/asistencia', asistenciaRoutes);
router.use('/rfid',       rfidRoutes);

// Ruta de salud — útil para verificar que el servidor está en pie
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
