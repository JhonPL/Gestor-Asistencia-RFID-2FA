// backend/src/services/notifications.service.js
// Servicio de notificaciones push usando la Expo Push API.
// Usa fetch nativo de Node 18+ — sin dependencias extra.
//
// Documentación Expo: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Valida si un string tiene el formato de token push de Expo.
 * Soporta tanto 'ExponentPushToken[...]' como 'ExpoPushToken[...]'.
 */
export function isExpoPushToken(token) {
  return typeof token === 'string' && /^(ExponentPushToken|ExpoPushToken)\[.*\]$/.test(token.trim());
}

/**
 * Envía una notificación push al dispositivo del estudiante pidiendo
 * que confirme su asistencia en la app móvil.
 *
 * Es fire-and-forget: se puede llamar sin await desde rfid.routes.js para no
 * bloquear la respuesta al ESP32. Nunca lanza excepción hacia afuera.
 *
 * @param {string} pushToken   - ExponentPushToken[xxx] guardado en dispositivo_movil
 * @param {number} asistenciaId - ID del registro de asistencia recién creado
 * @param {object} cursoInfo - { codigo, nombre, aula, docente, hora_inicio, hora_fin } (opcional)
 * @returns {Promise<{ ok: boolean, ticket?: any, error?: string }>}
 */
export async function sendPushNotification(pushToken, asistenciaId, cursoInfo = null) {
  if (!pushToken || pushToken.startsWith('OFFLINE_') || pushToken.startsWith('SIMULATOR_') || pushToken.startsWith('DEV_')) {
    console.warn(
      `[notifications] ⚠️ Omitiendo push para dispositivo offline/simulador/dev: ${pushToken} (asistencia_id: ${asistenciaId})`
    );
    return { ok: false, error: 'Dispositivo offline o simulador' };
  }

  // Validar que el token tenga el formato correcto de ExponentPushToken o ExpoPushToken
  if (!isExpoPushToken(pushToken)) {
    console.error(
      `[notifications] ❌ Token inválido para asistencia ${asistenciaId}: ${pushToken.slice(0, 40)}...`
    );
    return { ok: false, error: 'Token con formato inválido' };
  }

  try {
    const body = {
      to:       pushToken.trim(),
      title:    'LUXA',
      body:     'Tienes una asistencia pendiente de verificar. Abre la app para confirmarla.',
      data:  {
        asistencia_id: String(asistenciaId),
        accion:        'confirmar_asistencia',
        // Incluir datos del curso si están disponibles
        curso_codigo:  cursoInfo?.codigo || '',
        curso_nombre:  cursoInfo?.nombre || '',
        aula:          cursoInfo?.aula || '',
        docente:       cursoInfo?.docente || '',
        hora_inicio:   cursoInfo?.hora_inicio || '',
        hora_fin:      cursoInfo?.hora_fin || '',
      },
      sound:      'default',
      priority:   'high', // Crucial en Android para entrega inmediata fuera de primer plano
      channelId:  'asistencia',
      _displayInForeground: true,
    };

    console.log(
      `[notifications] 📤 Enviando push para asistencia ${asistenciaId}, token: ${pushToken.slice(0, 30)}...`
    );

    const response = await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    const ticket = Array.isArray(data?.data) ? data.data[0] : data?.data;

    if (!response.ok || ticket?.status === 'error') {
      const errorMsg = ticket?.message || JSON.stringify(data || { status: response.status });
      console.error(
        `[notifications] ❌ Error Expo Push para asistencia ${asistenciaId}:`,
        errorMsg,
      );

      // Diagnóstico específico para el error más común: falta de FCM Server Key / Service Account
      if (
        ticket?.details?.error === 'InvalidCredentials' ||
        errorMsg.includes('FCM server key') ||
        errorMsg.includes('credentials')
      ) {
        console.error(
          `[notifications] ⚠️ CREDENCIALES FCM NO CONFIGURADAS EN EXPO:
          Expo no puede despachar la notificación a Android porque falta la clave privada
          de servicio de Firebase (FCM V1). Debes subir el archivo JSON de la cuenta de
          servicio de Google en https://expo.dev/accounts/jhonl/projects/mobile/credentials`
        );
      }

      return { ok: false, error: errorMsg, ticket };
    }

    console.log(
      `[notifications] ✓ Ticket Expo creado con éxito — asistencia ${asistenciaId}: ${ticket?.id ?? 'sin id'}`
    );
    return { ok: true, ticket };
  } catch (err) {
    // Nunca dejar que un error de red bloquee el flujo principal
    console.error(
      `[notifications] ❌ Excepción de red al enviar push para asistencia ${asistenciaId}:`,
      err.message,
    );
    return { ok: false, error: err.message };
  }
}