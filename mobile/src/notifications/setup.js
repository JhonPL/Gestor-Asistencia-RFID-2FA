// mobile/src/notifications/setup.js
// Módulo para obtener el ExponentPushToken del dispositivo.
// El token se pasa al backend al hacer login para guardarlo en dispositivo_movil.
//
// Notas:
//   - En simulador de iOS getExpoPushTokenAsync() falla — se devuelve token fake
//   - Si el usuario niega permisos se devuelve null (el sistema sigue sin notificaciones)
//   - El canal de Android se configura aquí porque debe existir antes de pedir permisos

import * as Notifications from 'expo-notifications';
import { Platform }       from 'react-native';
import Constants          from 'expo-constants';

/**
 * Solicita permisos de notificación y devuelve el ExponentPushToken del dispositivo.
 *
 * @returns {Promise<string|null>}
 *   - "ExponentPushToken[xxxxxxxx]" si el usuario concedió permisos
 *   - null si negó los permisos
 *   - "SIMULATOR_DEV_TOKEN" si se está corriendo en simulador iOS
 */
export async function getPushToken() {
  // ── Android: crear canal antes de pedir permisos ──────────
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('asistencia', {
      name:             'Confirmación de asistencia',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#000666',
    });
  }

  // ── Pedir permiso al sistema operativo ────────────────────
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // El usuario negó el permiso — continuar sin notificaciones
  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permiso de notificaciones denegado por el usuario.');
    return null;
  }

  // ── Obtener el token de Expo ──────────────────────────────
  try {
    const projectId = Constants.expoConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? '4bb62ef7-86f4-4405-9a07-331b47dca6fb';
    
    // Timeout de 10 segundos para evitar que se quede cargando si la red es lenta
    const tokenPromise = Notifications.getExpoPushTokenAsync({ projectId });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout al obtener Push Token')), 10000)
    );
    
    const tokenData = await Promise.race([tokenPromise, timeoutPromise]);
    
    console.log('[notifications] Push token obtenido:', tokenData.data);
    return tokenData.data; // "ExponentPushToken[xxxxxxxx]"

  } catch (err) {
    console.warn('[notifications] No se pudo obtener token real:', err.message);
    if (__DEV__) return 'SIMULATOR_DEV_TOKEN';
    return null;
  }
}