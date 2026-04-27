// mobile/src/storage/auth.js
// Persistencia del token JWT y datos del usuario con AsyncStorage.
//
// Instalación requerida (si no está ya):
//   npx expo install @react-native-async-storage/async-storage

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN:     'smartclass_token',
  USER:      'smartclass_user',
  DEVICE_ID: 'smartclass_device_id',
};

/**
 * Guarda el token JWT y los datos del usuario tras un login exitoso.
 * @param {string} token
 * @param {object} user - { id, nombre, apellido, correo, rol }
 */
export async function saveAuth(token, user) {
  await AsyncStorage.multiSet([
    [KEYS.TOKEN, token],
    [KEYS.USER,  JSON.stringify(user)],
  ]);
}

/**
 * Devuelve el token JWT guardado, o null si no existe.
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  return AsyncStorage.getItem(KEYS.TOKEN);
}

/**
 * Devuelve el objeto user guardado (parseado), o null si no existe.
 * @returns {Promise<object|null>}
 */
export async function getUser() {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Elimina el token, el user y el device id (cierre de sesión).
 */
export async function clearAuth() {
  await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.DEVICE_ID]);
}

/**
 * Guarda el id del dispositivo móvil registrado en el backend.
 * @param {number} id - dispositivo_movil_id devuelto por /api/movil/dispositivo
 */
export async function saveDeviceId(id) {
  await AsyncStorage.setItem(KEYS.DEVICE_ID, String(id));
}

/**
 * Devuelve el dispositivo_movil_id como número, o null si no existe.
 * @returns {Promise<number|null>}
 */
export async function getDeviceId() {
  const raw = await AsyncStorage.getItem(KEYS.DEVICE_ID);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
