// src/api/cursosApi.js

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

// ─── CURSOS ───────────────────────────────────────────────────

export const getCursos = (token) =>
  fetch(`${BASE}/api/cursos`, { headers: h(token) }).then(handleResponse);

export const getCurso = (token, id) =>
  fetch(`${BASE}/api/cursos/${id}`, { headers: h(token) }).then(handleResponse);

export const createCurso = (token, data) =>
  fetch(`${BASE}/api/cursos`, {
    method: 'POST', headers: h(token), body: JSON.stringify(data),
  }).then(handleResponse);

export const updateCurso = (token, id, data) =>
  fetch(`${BASE}/api/cursos/${id}`, {
    method: 'PATCH', headers: h(token), body: JSON.stringify(data),
  }).then(handleResponse);

export const desactivarCurso = (token, id) =>
  fetch(`${BASE}/api/cursos/${id}`, {
    method: 'DELETE', headers: h(token),
  }).then(handleResponse);

// ─── LISTA DE ESTUDIANTES ─────────────────────────────────────

export const getEstudiantes = (token, cursoId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/api/cursos/${cursoId}/estudiantes${qs ? `?${qs}` : ''}`, {
    headers: h(token),
  }).then(handleResponse);
};

export const getEstudiantesDisponibles = (token, cursoId, search = '') =>
  fetch(`${BASE}/api/cursos/${cursoId}/estudiantes/disponibles?search=${encodeURIComponent(search)}`, {
    headers: h(token),
  }).then(handleResponse);

export const inscribirEstudiante = (token, cursoId, persona_id) =>
  fetch(`${BASE}/api/cursos/${cursoId}/estudiantes`, {
    method: 'POST', headers: h(token), body: JSON.stringify({ persona_id }),
  }).then(handleResponse);

export const toggleInscripcion = (token, cursoId, listaId, activo) =>
  fetch(`${BASE}/api/cursos/${cursoId}/estudiantes/${listaId}`, {
    method: 'PATCH', headers: h(token), body: JSON.stringify({ activo }),
  }).then(handleResponse);

export const eliminarInscripcion = (token, cursoId, listaId) =>
  fetch(`${BASE}/api/cursos/${cursoId}/estudiantes/${listaId}`, {
    method: 'DELETE', headers: h(token),
  }).then(handleResponse);

export const importarEstudiantes = (token, cursoId, estudiantes) =>
  fetch(`${BASE}/api/cursos/${cursoId}/estudiantes/importar`, {
    method: 'POST', headers: h(token),
    body: JSON.stringify({ estudiantes }),
  }).then(handleResponse);