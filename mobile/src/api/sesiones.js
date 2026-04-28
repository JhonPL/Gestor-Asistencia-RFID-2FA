// mobile/src/api/sesiones.js
// Módulo de API para la sesión activa del estudiante.
// NOTA: este endpoint lo está construyendo Persona A.
// Una vez disponible, conectarlo en home.js.

import { apiFetch } from './index.js';

/**
 * Obtiene la sesión activa del día para el estudiante autenticado.
 * @param {string} token - JWT del estudiante
 * @returns {Promise<object>} - { estado: 'sin_clase' } o el objeto completo de sesión
 */
export async function getSesionActiva(token) {
  return apiFetch('/api/movil/sesiones/activa', {}, token);
}

/**
 * Obtiene TODAS las clases del estudiante para hoy, ordenadas por hora.
 * @param {string} token - JWT del estudiante
 * @returns {Promise<array>} - Array de sesiones del día, o [] si no hay clases
 */
export async function getClasesHoy(token) {
  return apiFetch('/api/movil/sesiones/hoy', {}, token);
}
