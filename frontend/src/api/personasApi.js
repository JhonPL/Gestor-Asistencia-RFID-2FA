// src/api/personasApi.js
// Capa de acceso a la API para el CRUD de personas.
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

// ─── PERSONAS ─────────────────────────────────────────────────

/** Obtiene listado de personas con filtros opcionales */
export async function getPersonas(token, { rol, activo, search } = {}) {
  const params = new URLSearchParams();
  if (rol) params.set('rol', rol);
  if (activo !== undefined) params.set('activo', activo);
  if (search) params.set('search', search);

  const url = `${BASE}/api/personas${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  return handleResponse(res);
}

/** Obtiene una persona por ID */
export async function getPersonaById(token, id) {
  const res = await fetch(`${BASE}/api/personas/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

/** Crea una nueva persona */
export async function createPersona(token, { nombre, apellido, correo, rol, programa_id }) {
  const res = await fetch(`${BASE}/api/personas`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ nombre, apellido, correo, rol, programa_id: programa_id || null }),
  });
  return handleResponse(res);
}

/** Actualiza campos de una persona (PATCH parcial) */
export async function updatePersona(token, id, campos) {
  const res = await fetch(`${BASE}/api/personas/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(campos),
  });
  return handleResponse(res);
}

/** Cambia el estado activo/inactivo de una persona */
export async function toggleActivoPersona(token, id, activo) {
  const res = await fetch(`${BASE}/api/personas/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ activo }),
  });
  return handleResponse(res);
}

/** Vincula o desvincula una tarjeta RFID a una persona.
 *  Pasar codigoTarjeta = null para desvincular. */
export async function linkTarjetaPersona(token, id, codigoTarjeta) {
  const res = await fetch(`${BASE}/api/personas/${id}/tarjeta`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ codigo_tarjeta: codigoTarjeta }),
  });
  return handleResponse(res);
}