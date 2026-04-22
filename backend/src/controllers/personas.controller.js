// src/controllers/personas.controller.js

import * as personasService from '../services/personas.service.js';

export async function getAll(req, res, next) {
  try {
    const { rol, activo, search } = req.query;
    const data = await personasService.getPersonas({
      rol,
      activo: activo !== undefined ? activo === 'true' : undefined,
      search,
    });
    res.json(data);
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const data = await personasService.getPersonaById(parseInt(req.params.id));
    res.json(data);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const { nombre, apellido, correo, rol, programa_id } = req.body;
    if (!nombre || !apellido || !correo || !rol) {
      return res.status(400).json({ error: 'nombre, apellido, correo y rol son requeridos' });
    }
    const data = await personasService.createPersona({ nombre, apellido, correo, rolNombre: rol, programaId: programa_id });
    res.status(201).json(data);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const data = await personasService.updatePersona(parseInt(req.params.id), req.body);
    res.json(data);
  } catch (err) { next(err); }
}

export async function linkCard(req, res, next) {
  try {
    const { codigo_tarjeta } = req.body;
    const data = await personasService.linkTarjeta(parseInt(req.params.id), codigo_tarjeta || null);
    res.json(data);
  } catch (err) { next(err); }
}
