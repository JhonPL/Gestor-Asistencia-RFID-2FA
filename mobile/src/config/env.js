// mobile/src/config/env.js
// Carga variables de entorno desde .env
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function required(name) {
  const value = extra[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno móvil: ${name}`);
  }
  return value;
}

/**
 * Obtiene variables del archivo .env y app.json
 */
export const env = {
  // API Backend
  API_HOST: required('API_HOST'),
  API_PORT: Number(required('API_PORT')),
  API_BASE_URL: required('API_BASE_URL'),

  // Google OAuth
  GOOGLE_CLIENT_ID: required('GOOGLE_CLIENT_ID'),
  GOOGLE_ANDROID_CLIENT_ID: required('GOOGLE_ANDROID_CLIENT_ID'),

  // Expo
  PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId,
};

export default env;
