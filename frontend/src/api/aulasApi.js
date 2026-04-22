// src/api/aulasApi.js
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

export async function getAulas(token) {
  const res = await fetch(`${BASE}/api/aulas`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function getAulaById(token, id) {
  const res = await fetch(`${BASE}/api/aulas/${id}`, { headers: authHeaders(token) });
  return handleResponse(res);
}

export async function createAula(token, { numero, nombre, edificio, piso, capacidad }) {
  const res = await fetch(`${BASE}/api/aulas`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ numero, nombre: nombre || null, edificio: edificio || null, piso: piso || null, capacidad: capacidad || null }),
  });
  return handleResponse(res);
}

export async function updateAula(token, id, campos) {
  const res = await fetch(`${BASE}/api/aulas/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(campos),
  });
  return handleResponse(res);
}

export async function deleteAula(token, id) {
  const res = await fetch(`${BASE}/api/aulas/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}