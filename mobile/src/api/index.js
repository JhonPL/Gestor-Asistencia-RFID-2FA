// mobile/src/api/index.js
// Wrapper base para todas las llamadas al backend de SmartClass RFID.
// En dispositivo físico/Android emulado, reemplaza TU_IP_LOCAL por la IP
// de tu máquina (ej: '192.168.1.5'). En simulador iOS puedes usar 'localhost'.

export const BASE_URL = 'http://192.168.80.60:3000';

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

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

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
    throw error;
  }
}
