// mobile/src/api/auth.js
// Módulo de API para autenticación.

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
