// frontend/src/api/rfidApi.js
// Capa de acceso a los endpoints RFID del panel admin.

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

/**
 * Consulta si el ESP32 indicado envió un UID en los últimos 30 segundos.
 * Devuelve { uid: "A3 2F 1B 09" } o { uid: null }.
 * El backend borra el UID tras devolverlo (one-time read).
 *
 * @param {string} token
 * @param {string} codigoDispositivo - ej: "ESP32-01"
 */
export async function getUltimoScan(token, codigoDispositivo) {
  const res = await fetch(
    `${BASE}/api/rfid/ultimo-scan/${encodeURIComponent(codigoDispositivo)}`,
    { 
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    },
  );
  return handleResponse(res); // { uid: string | null }
}