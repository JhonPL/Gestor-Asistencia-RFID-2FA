// backend/src/services/notifications.service.js
// Servicio de notificaciones push usando la Expo Push API.
// Usa fetch nativo de Node 18+ — sin dependencias extra.
//
// Documentación Expo: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envía una notificación push al dispositivo del estudiante pidiendo
 * que confirme su asistencia en la app móvil.
 *
 * Es fire-and-forget: se llama sin await desde rfid.routes.js para no
 * bloquear la respuesta al ESP32. Nunca lanza excepción hacia afuera.
 *
 * @param {string} pushToken   - ExponentPushToken[xxx] guardado en dispositivo_movil
 * @param {number} asistenciaId - ID del registro de asistencia recién creado
 */
export async function sendPushNotification(pushToken, asistenciaId) {
  try {
    const body = {
      to:    pushToken,
      title: 'SmartClass — Confirma tu asistencia',
      body:  'Acercaste tu tarjeta. Abre la app para verificar.',
      data:  {
        asistencia_id: asistenciaId,
        accion:        'confirmar_asistencia',
      },
      sound: 'default',
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    // Registrar la respuesta de Expo (sin lanzar excepción si falla)
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.data?.status === 'error') {
      console.error(
        `[notifications] Error Expo Push para asistencia ${asistenciaId}:`,
        data,
      );
    } else {
      console.log(
        `[notifications] Push enviado — asistencia ${asistenciaId}, token: ${pushToken.slice(0, 30)}…`,
      );
    }
  } catch (err) {
    // Nunca dejar que un error de red bloquee el flujo principal
    console.error(
      `[notifications] Excepción al enviar push para asistencia ${asistenciaId}:`,
      err.message,
    );
  }
}