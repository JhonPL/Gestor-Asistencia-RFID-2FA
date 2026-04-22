// src/api/dispositivosApi.js
// Capa de acceso a la API para el CRUD de dispositivos RFID.
// No existe eliminación física: el "borrar" es cambiar estado a Inactivo.

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

/** Listar todos los dispositivos (con filtro opcional de estado) */
export async function getDispositivos(token, estado = null) {
  const url = estado
    ? `${BASE}/api/dispositivos?estado=${encodeURIComponent(estado)}`
    : `${BASE}/api/dispositivos`;
  const res = await fetch(url, { headers: authHeaders(token) });
  return handleResponse(res);
}

/** Obtener un dispositivo por ID */
export async function getDispositivoById(token, id) {
  const res = await fetch(`${BASE}/api/dispositivos/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

/** Crear un dispositivo */
export async function createDispositivo(token, { codigo, aula_id, ip_address, mac_address, estado }) {
  const res = await fetch(`${BASE}/api/dispositivos`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      codigo,
      aula_id:     aula_id     || null,
      ip_address:  ip_address  || null,
      mac_address: mac_address || null,
      estado:      estado      || 'Activo',
    }),
  });
  return handleResponse(res);
}

/** Actualizar campos de un dispositivo (PATCH parcial) */
export async function updateDispositivo(token, id, campos) {
  const res = await fetch(`${BASE}/api/dispositivos/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(campos),
  });
  return handleResponse(res);
}

/**
 * Cambiar solo el estado de un dispositivo.
 * Reemplaza el "eliminar": usar estado = 'Inactivo' para desactivar.
 */
export async function cambiarEstadoDispositivo(token, id, estado) {
  const res = await fetch(`${BASE}/api/dispositivos/${id}/estado`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ estado }),
  });
  return handleResponse(res);
}