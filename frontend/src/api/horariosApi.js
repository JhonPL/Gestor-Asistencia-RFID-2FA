// src/api/horariosApi.js
// Capa de acceso a la API para horarios y días de la semana.
// Todos los endpoints requieren rol administrador (JWT en header).

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ─── DÍAS DE LA SEMANA ────────────────────────────────────────

export async function getDias(token) {
  const res = await fetch(`${BASE}/api/horarios/dias`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ─── HORARIOS ─────────────────────────────────────────────────

export async function getHorarios(token, diaSemanaId = null) {
  const url = diaSemanaId
    ? `${BASE}/api/horarios?dia_semana_id=${diaSemanaId}`
    : `${BASE}/api/horarios`;
  const res = await fetch(url, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function getHorarioById(token, id) {
  const res = await fetch(`${BASE}/api/horarios/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function createHorario(token, { dia_semana_id, hora_inicio, hora_fin }) {
  const res = await fetch(`${BASE}/api/horarios`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ dia_semana_id, hora_inicio, hora_fin }),
  });
  return handleResponse(res);
}

export async function updateHorario(token, id, campos) {
  const res = await fetch(`${BASE}/api/horarios/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(campos),
  });
  return handleResponse(res);
}

export async function deleteHorario(token, id) {
  const res = await fetch(`${BASE}/api/horarios/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}