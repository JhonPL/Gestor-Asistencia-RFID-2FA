// mobile/src/config/env.js
// Carga variables de entorno desde .env y desde expo.extra
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function readValue(name, aliases = []) {
  const keys = [name, ...aliases];
  for (const key of keys) {
    const value = extra[key] ?? process.env[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return '';
}

function required(name, aliases = []) {
  const value = readValue(name, aliases);
  if (!value) {
    throw new Error(`Falta la variable de entorno móvil: ${name}`);
  }
  return value;
}

/**
 * Obtiene variables del archivo .env y app.json
 */
const googleIosClientId = required('GOOGLE_IOS_CLIENT_ID');
const googleIosUrlScheme = `com.googleusercontent.apps.${googleIosClientId.split('.apps.googleusercontent.com')[0]}`;

export const env = {
  // API Backend
  API_HOST: required('API_HOST', ['EXPO_PUBLIC_API_HOST', 'REACT_APP_API_HOST']),
  API_PORT: Number(required('API_PORT', ['EXPO_PUBLIC_API_PORT', 'REACT_APP_API_PORT'])),
  API_BASE_URL: required('API_BASE_URL', ['EXPO_PUBLIC_API_BASE_URL', 'REACT_APP_API_URL', 'REACT_APP_API_BASE_URL']),

  // Google OAuth
  GOOGLE_CLIENT_ID: required('GOOGLE_CLIENT_ID', ['EXPO_PUBLIC_GOOGLE_CLIENT_ID', 'REACT_APP_GOOGLE_CLIENT_ID']),
  GOOGLE_ANDROID_CLIENT_ID: required('GOOGLE_ANDROID_CLIENT_ID', ['EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'REACT_APP_GOOGLE_ANDROID_CLIENT_ID']),
  GOOGLE_IOS_CLIENT_ID: googleIosClientId,
  GOOGLE_IOS_URL_SCHEME: googleIosUrlScheme,

  // Expo
  PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId,
};

export default env;
