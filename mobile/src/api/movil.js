// mobile/src/api/movil.js
// Módulo de API para operaciones del dispositivo móvil.

import { apiFetch } from './index.js';

/**
 * Registra o actualiza el dispositivo push del estudiante.
 * Solo un dispositivo puede estar activo por persona.
 * @param {string} token                    - JWT del estudiante
 * @param {{ push_token: string, plataforma: 'ios'|'android' }} body
 * @returns {Promise<{ id: number, persona_id: number, push_token: string, plataforma: string, activo: boolean }>}
 */
export async function registrarDispositivo(token, { push_token, plataforma }) {
  return apiFetch(
    '/api/movil/dispositivo',
    {
      method: 'POST',
      body: JSON.stringify({ push_token, plataforma }),
    },
    token,
  );
}
