// src/api/sesionesApi.js
// Capa de acceso a la API para sesiones de clase.

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

/** Listar sesiones de un curso (con stats de asistencia) */
export const getSesionesByCurso = (token, cursoId) =>
  fetch(`${BASE}/api/sesiones?curso_id=${cursoId}`, { headers: h(token) }).then(handleResponse);

/** Obtener detalle de una sesión */
export const getSesionById = (token, sesionId) =>
  fetch(`${BASE}/api/sesiones/${sesionId}`, { headers: h(token) }).then(handleResponse);