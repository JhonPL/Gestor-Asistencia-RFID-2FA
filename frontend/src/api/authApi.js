// src/api/authApi.js
// Capa de comunicación con el backend para autenticación.
// Todos los fetch de auth pasan por aquí — fácil de cambiar a MSAL en producción.

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

/** Login real con token de Azure AD (producción) */
export async function loginConAzure(azureToken) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${azureToken}`,
    },
  });
  return handleResponse(res); // { token, user }
}

/** Login con OAuth 2.0 de Google usando el token JWT */
export async function loginWithGoogle(credential) {
  const res = await fetch(`${BASE}/api/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  return handleResponse(res); // { token, user }
}

/** Verifica que el JWT almacenado sigue siendo válido y devuelve el usuario */
export async function getMe(token) {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res); // { user }
}