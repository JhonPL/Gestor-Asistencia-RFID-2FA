// mobile/src/api/index.js
// Wrapper base para todas las llamadas al backend de SmartClass RFID.

import env from '../config/env.js';

export const BASE_URL = env.API_BASE_URL;

/**
 * Función central de fetch con manejo de errores y headers automáticos.
 * @param {string} path       - ruta relativa, ej: '/api/auth/login-dev'
 * @param {object} options    - opciones de fetch (method, body, etc.)
 * @param {string|null} token - JWT para el header Authorization (opcional)
 * @returns {Promise<any>}    - JSON parseado de la respuesta
 */
export async function apiFetch(path, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error ?? `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('🔴 API Error:', {
      url: `${BASE_URL}${path}`,
      message: error.message,
      errorName: error.name,
    });
    
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado. Verifica tu conexión a internet y asegúrate de que el backend esté accesible (IP y Firewall).');
    }
    
    throw error;
  }
}
