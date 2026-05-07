// mobile/src/api/auth.js
// Módulo de API para autenticación con Google OAuth 2.0

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { apiFetch } from './index.js';

// Cerrar automáticamente el WebBrowser cuando sea necesario
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client ID (debe coincidir con el configurado en Google Cloud Console)
const GOOGLE_CLIENT_ID = '1027858475506-rnvthesejtmn4usfmvctmsvv7i3s9ug0.apps.googleusercontent.com';

/**
 * Request para Google OAuth 2.0 usando Expo Auth Session
 */
let googleRequest;

function getGoogleRequest() {
  if (!googleRequest) {
    const [request] = Google.useAuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      iosClientId: GOOGLE_CLIENT_ID, // Mismo para iOS
      androidClientId: GOOGLE_CLIENT_ID, // Mismo para Android
      scopes: ['openid', 'email', 'profile'],
      useProxy: true, // Expo proxy para OAuth redirects
    });
    googleRequest = request;
  }
  return googleRequest;
}

/**
 * Login simulado (solo NODE_ENV=development en el backend).
 * @deprecated Usar loginWithGoogle en su lugar
 * @param {string} correo - correo institucional del estudiante
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginDev(correo) {
  return apiFetch('/api/auth/login-dev', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  });
}

/**
 * Login con Google OAuth 2.0
 * Usa expo-auth-session para obtener el token de identidad de Google,
 * luego lo envía al backend para validación y emisión de JWT propio.
 *
 * @param {object} response - respuesta de expo-auth-session
 * @returns {Promise<{ token: string, user: object }>}
 * @throws {Error} Si el token de Google es inválido o no se puede conectar al backend
 */
export async function loginWithGoogle(response) {
  if (response.type !== 'success') {
    throw new Error('Autenticación de Google cancelada');
  }

  if (!response.authentication?.idToken) {
    throw new Error('No se recibió el ID token de Google');
  }

  // Enviar el ID token al backend para validación
  const result = await apiFetch('/api/auth/google/callback', {
    method: 'POST',
    body: JSON.stringify({ credential: response.authentication.idToken }),
  });

  return result;
}

/**
 * Prompts el flujo OAuth de Google
 * Debe ser llamado dentro de un handlePress en un TouchableOpacity
 */
export function promptGoogleAsync() {
  const request = getGoogleRequest();
  if (!request) {
    throw new Error('Google Auth no está configurado');
  }
  return Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'email', 'profile'],
    useProxy: true, // Expo proxy para OAuth redirects
  });
}
