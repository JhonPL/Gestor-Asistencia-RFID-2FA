// src/api/academicoApi.js
// Capa de acceso a la API para la estructura académica (facultades y programas).
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

// ─── FACULTADES ───────────────────────────────────────────────

export async function getFacultades(token) {
  const res = await fetch(`${BASE}/api/facultades`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function createFacultad(token, { nombre }) {
  const res = await fetch(`${BASE}/api/facultades`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ nombre }),
  });
  return handleResponse(res);
}

export async function updateFacultad(token, id, { nombre }) {
  const res = await fetch(`${BASE}/api/facultades/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ nombre }),
  });
  return handleResponse(res);
}

export async function deleteFacultad(token, id) {
  const res = await fetch(`${BASE}/api/facultades/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ─── PROGRAMAS ────────────────────────────────────────────────

export async function getProgramas(token, facultadId = null) {
  const url = facultadId
    ? `${BASE}/api/programas?facultad_id=${facultadId}`
    : `${BASE}/api/programas`;
  const res = await fetch(url, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function createPrograma(token, { nombre, codigo, facultad_id }) {
  const res = await fetch(`${BASE}/api/programas`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ nombre, codigo: codigo || null, facultad_id }),
  });
  return handleResponse(res);
}

export async function updatePrograma(token, id, campos) {
  const res = await fetch(`${BASE}/api/programas/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(campos),
  });
  return handleResponse(res);
}

export async function deletePrograma(token, id) {
  const res = await fetch(`${BASE}/api/programas/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}