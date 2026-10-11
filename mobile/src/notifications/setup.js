// mobile/src/notifications/setup.js
// Módulo para obtener el ExponentPushToken del dispositivo y sincronizarlo con el backend.
//
// Notas:
//   - En Expo SDK 53+, las notificaciones push remotas requieren una build de desarrollo
//     (dev-client) o APK preview; no funcionan en Expo Go para Android/iOS.
//   - El canal de Android 'asistencia' debe crearse antes de mostrar notificaciones.

import * as Notifications from 'expo-notifications';
import { Platform }       from 'react-native';
import Constants          from 'expo-constants';
import env                from '../config/env';
import { getInstallationId, saveDeviceId } from '../storage/auth';
import { registrarDispositivo } from '../api/movil';

/**
 * Configura el canal de notificaciones en Android con prioridad máxima.
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('asistencia', {
      name:             'Confirmación de asistencia',
      description:      'Alertas para confirmación biométrica y GPS al pasar tarjeta RFID',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#080E8C',
      enableLights:     true,
      enableVibrate:    true,
      showBadge:        true,
    });
  }
}

/**
 * Solicita permisos de notificación y devuelve el ExponentPushToken del dispositivo.
 *
 * @param {string|null} installationId - Identificador persistente de esta instalación.
 * @returns {Promise<string|null>}
 *   - "ExponentPushToken[xxxxxxxx]" si el usuario concedió permisos
 *   - null si negó los permisos o si ocurrió un error
 */
export async function getPushToken(installationId = null) {
  // ── Android: crear canal antes de pedir permisos ──────────
  await setupNotificationChannel();

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
    const projectId =
      env.PROJECT_ID ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      '4bb62ef7-86f4-4405-9a07-331b47dca6fb';

    if (!projectId) {
      throw new Error('No se encontró el projectId de EAS');
    }

    // Timeout de 10 segundos para evitar que se quede cargando si la red es lenta
    const tokenPromise = Notifications.getExpoPushTokenAsync({ projectId });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout al obtener Push Token')), 10000)
    );

    const tokenData = await Promise.race([tokenPromise, timeoutPromise]);

    console.log('[notifications] ✓ Push token obtenido:', tokenData.data);
    return tokenData.data; // "ExponentPushToken[xxxxxxxx]"
  } catch (err) {
    console.warn('[notifications] ⚠️ No se pudo obtener token real:', err.message);
    if (err.message?.includes('Expo Go') || err.message?.includes('not supported')) {
      console.warn(
        '[notifications] ℹ️ En Expo Go no están disponibles las notificaciones push remotas. Usa un APK preview o Development Build.'
      );
    }
    return null;
  }
}

/**
 * Sincroniza el push token actual con el backend para el usuario autenticado.
 * Puede ser llamado de fondo (fire-and-forget) al iniciar la pantalla Home.
 *
 * @param {string} authToken - Token JWT del estudiante
 * @returns {Promise<string|null>} El push token sincronizado o null
 */
export async function syncPushTokenWithBackend(authToken) {
  if (!authToken) return null;

  try {
    const installationId = await getInstallationId();
    const pushToken = await getPushToken(installationId);

    if (!pushToken) {
      console.log('[notifications] No hay push token disponible para sincronizar en este momento');
      return null;
    }

    const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';
    const dispositivo = await registrarDispositivo(authToken, {
      push_token: pushToken,
      plataforma,
      installation_id: installationId,
    });

    if (dispositivo?.id) {
      await saveDeviceId(dispositivo.id);
      console.log(`[notifications] ✓ Dispositivo ${dispositivo.id} sincronizado con push token real`);
    }

    return pushToken;
  } catch (err) {
    console.warn('[notifications] Error sincronizando push token con el backend:', err.message);
    return null;
  }
}