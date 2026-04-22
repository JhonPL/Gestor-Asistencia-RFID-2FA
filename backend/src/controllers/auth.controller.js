// src/controllers/auth.controller.js
// Controladores delgados: solo reciben el request,
// llaman al servicio y devuelven la respuesta.

import { loginWithAzure, loginSimulado } from '../services/auth.service.js';
import { env } from '../config/env.js';

// POST /api/auth/login
// Recibe el token de Azure AD y devuelve nuestro JWT
export async function login(req, res, next) {
  try {
    // req.azureClaims fue adjuntado por el middleware verifyAzureToken
    const correo     = req.azureClaims?.preferred_username || req.azureClaims?.email;
    const microsoftId = req.azureClaims?.oid;

    if (!correo) {
      return res.status(400).json({ error: 'El token no contiene un correo válido' });
    }

    const result = await loginWithAzure({ correo, microsoftId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login-dev
// Solo disponible en desarrollo (sin Azure AD configurado)
export async function loginDev(req, res, next) {
  if (env.nodeEnv !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ error: 'correo requerido' });
    const result = await loginSimulado({ correo });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
// Devuelve los datos del usuario autenticado (desde el JWT)
export function me(req, res) {
  res.json({ user: req.user });
}
