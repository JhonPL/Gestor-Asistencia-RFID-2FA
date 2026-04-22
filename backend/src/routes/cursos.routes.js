// src/routes/cursos.routes.js
// Rutas delgadas: parsean req/res y delegan al servicio correspondiente.
// La lógica de negocio vive en cursos.service.js y estudiantes.service.js.
// Reducido de ~400 líneas a ~130.

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { createError } from '../middlewares/errorHandler.js';
import * as cursosService     from '../services/cursos.service.js';
import * as estudiantesService from '../services/estudiantes.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', verifyJwt, async (req, res, next) => {
  try {
    const rows = await cursosService.listarCursos(req.user.id, req.user.rol);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    res.json(await cursosService.getCursoConHorarios(parseInt(req.params.id)));
  } catch (err) { next(err); }
});

router.post('/', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const curso = await cursosService.crearCurso(req.body);
    res.status(201).json(curso);
  } catch (err) { next(err); }
});

router.patch('/:id', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const curso = await cursosService.actualizarCurso(parseInt(req.params.id), req.body);
    res.json(curso);
  } catch (err) { next(err); }
});

router.delete('/:id', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await cursosService.desactivarCurso(parseInt(req.params.id));
    res.json({ ok: true, desactivado: result });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// LISTA DE ESTUDIANTES  /api/cursos/:id/estudiantes
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:id/estudiantes', verifyJwt, requireRole('docente', 'administrador'), async (req, res, next) => {
  try {
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
    res.json(await estudiantesService.listarEstudiantes(parseInt(req.params.id), activo));
  } catch (err) { next(err); }
});

router.get('/:id/estudiantes/disponibles', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    res.json(await estudiantesService.listarDisponibles(parseInt(req.params.id), req.query.search || ''));
  } catch (err) { next(err); }
});

router.post('/:id/estudiantes', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const { persona_id } = req.body;
    if (!persona_id) throw createError(400, 'persona_id es requerido');
    const listaId = await estudiantesService.inscribir(parseInt(req.params.id), parseInt(persona_id));
    const rows = await estudiantesService.listarEstudiantes(parseInt(req.params.id));
    res.status(201).json(rows.find(e => e.lista_id === listaId));
  } catch (err) { next(err); }
});

router.patch('/:id/estudiantes/:listaId', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    if (req.body.activo === undefined) throw createError(400, 'El campo activo es requerido');
    const result = await estudiantesService.toggleInscripcion(
      parseInt(req.params.listaId), parseInt(req.params.id), req.body.activo
    );
    res.json({ ok: true, ...result });
  } catch (err) { next(err); }
});

router.delete('/:id/estudiantes/:listaId', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await estudiantesService.eliminarInscripcion(
      parseInt(req.params.listaId), parseInt(req.params.id)
    );
    res.json({ ok: true, ...result });
  } catch (err) { next(err); }
});

router.post('/:id/estudiantes/importar', verifyJwt, requireRole('administrador'), async (req, res, next) => {
  try {
    const { estudiantes } = req.body;
    if (!Array.isArray(estudiantes) || !estudiantes.length)
      throw createError(400, 'Se requiere un array de estudiantes no vacío');
    const resultado = await estudiantesService.importarMasivo(parseInt(req.params.id), estudiantes);
    res.json(resultado);
  } catch (err) { next(err); }
});

export default router;