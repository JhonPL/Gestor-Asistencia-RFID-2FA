// frontend/src/api/statsApi.js
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

export async function getAdminStats(token) {
  const res = await fetch(`${BASE}/api/stats/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}