// src/api/asistenciaApi.js
// Capa de acceso a la API para consulta y edición de asistencia.

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

const h = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

/** Obtiene la lista de asistencia de una sesión */
export const getAsistenciaBySesion = (token, sesionId) =>
  fetch(`${BASE}/api/asistencia/sesion/${sesionId}`, { headers: h(token) }).then(handleResponse);

/** Actualiza el estado de un registro de asistencia (Presente | Ausente | Justificado) */
export const updateEstadoAsistencia = (token, asistenciaId, estado) =>
  fetch(`${BASE}/api/asistencia/${asistenciaId}`, {
    method: 'PATCH',
    headers: h(token),
    body: JSON.stringify({ estado }),
  }).then(handleResponse);