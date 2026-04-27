// mobile/src/api/asistencia.js
// Módulo de API para verificación biométrica e historial de asistencia.
// NOTA: getHistorial depende del endpoint de Persona A.

import { apiFetch } from './index.js';

/**
 * Envía el resultado del segundo factor (biometría + GPS) al backend.
 * Este endpoint es público — no requiere JWT.
 * @param {{ asistencia_id: number, dispositivo_movil_id: number, metodo: string, exitoso: boolean, latitud: number, longitud: number }} body
 * @returns {Promise<{ ok: boolean, estado_verificacion: 'completado'|'fallido', dentro_campus: boolean }>}
 */
export async function verificarAsistencia({
  asistencia_id,
  dispositivo_movil_id,
  metodo,
  exitoso,
  latitud,
  longitud,
}) {
  return apiFetch('/api/rfid/verificar', {
    method: 'POST',
    body: JSON.stringify({
      asistencia_id,
      dispositivo_movil_id,
      metodo,
      exitoso,
      latitud,
      longitud,
    }),
  });
  // Sin token — tercer argumento omitido intencionalmente
}

/**
 * Obtiene el historial de asistencia del estudiante autenticado.
 * NOTA: endpoint pendiente de Persona A.
 * @param {string} token - JWT del estudiante
 * @returns {Promise<{ historial: object[], stats: object }>}
 */
export async function getHistorial(token) {
  return apiFetch('/api/movil/historial', {}, token);
}
