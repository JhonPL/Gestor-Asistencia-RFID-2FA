// mobile/src/config/env.js
// Carga variables de entorno desde .env

import Constants from 'expo-constants';

// Valores por defecto
const DEFAULT_API_HOST = '192.168.80.60';
const DEFAULT_API_PORT = 3000;
const DEFAULT_GOOGLE_CLIENT_ID = '1027858475506-rnvthesejtmn4usfmvctmsvv7i3s9ug0.apps.googleusercontent.com';
const DEFAULT_GOOGLE_ANDROID_CLIENT_ID = '1027858475506-f5e73v1mhqnilb3vjvfophdlhca2ecmt.apps.googleusercontent.com';

/**
 * Obtiene variables del archivo .env y app.json
 */
export const env = {
  // API Backend
  API_HOST: Constants.expoConfig?.extra?.API_HOST || DEFAULT_API_HOST,
  API_PORT: Constants.expoConfig?.extra?.API_PORT || DEFAULT_API_PORT,
  API_BASE_URL: Constants.expoConfig?.extra?.API_BASE_URL 
    || `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}`,

  // Google OAuth
  GOOGLE_CLIENT_ID: Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID: Constants.expoConfig?.extra?.GOOGLE_ANDROID_CLIENT_ID || DEFAULT_GOOGLE_ANDROID_CLIENT_ID,

  // Expo
  PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId,
};

export default env;
