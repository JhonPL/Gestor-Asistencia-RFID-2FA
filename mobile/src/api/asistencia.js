// mobile/src/api/asistencia.js
// Módulo de API para verificación biométrica e historial de asistencia.
// NOTA: getHistorial depende del endpoint de Persona A.

import { apiFetch } from './index.js';

/**
 * Envía el resultado del segundo factor (biometría + GPS) al backend.
 * Este endpoint es público — no requiere JWT.
 * @param {{ asistencia_id: number, dispositivo_movil_id: number, metodo: string, exitoso: boolean, ubicacion_valida: boolean, latitud: number, longitud: number, motivo_rechazo?: string }} body
 * @returns {Promise<{ ok: boolean, estado_verificacion: string, dentro_campus: boolean, metodo: string, motivo_rechazo?: string }>}
 */
export async function verificarAsistencia({
  asistencia_id,
  dispositivo_movil_id,
  metodo,
  exitoso,
  ubicacion_valida,
  latitud,
  longitud,
  motivo_rechazo,
}) {
  return apiFetch('/api/rfid/verificar', {
    method: 'POST',
    body: JSON.stringify({
      asistencia_id,
      dispositivo_movil_id,
      metodo,
      exitoso,
      ubicacion_valida,
      latitud,
      longitud,
      motivo_rechazo,
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
