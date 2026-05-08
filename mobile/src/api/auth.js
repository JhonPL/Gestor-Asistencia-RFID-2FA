// mobile/src/api/auth.js
// Módulo de API para autenticación con Google

import { apiFetch } from './index.js';

/**
 * Login simulado (solo NODE_ENV=development en el backend).
 * @param {string} correo - correo institucional del estudiante
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginDev(correo) {
  return apiFetch('/api/auth/login-dev', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  });
}

/**
 * Enviar el token de identidad de Google al backend para validación
 *
 * @param {object} response - respuesta con la estructura { type: 'success', authentication: { idToken } }
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginWithGoogle(response) {
  if (response.type !== 'success') {
    throw new Error('Autenticación de Google cancelada o fallida');
  }

  if (!response.authentication?.idToken) {
    throw new Error('No se recibió el ID token de Google');
  }

  // Enviar el ID token al backend para validación
  const result = await apiFetch('/api/auth/google/callback', {
    method: 'POST',
    body: JSON.stringify({ credential: response.authentication.idToken }),
  });

  return result;
}
