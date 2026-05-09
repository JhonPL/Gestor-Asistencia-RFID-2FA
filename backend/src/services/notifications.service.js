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
 * @param {object} cursoInfo - { codigo, nombre, aula, docente, hora_inicio, hora_fin } (opcional)
 */
export async function sendPushNotification(pushToken, asistenciaId, cursoInfo = null) {
  if (!pushToken || pushToken.startsWith('OFFLINE_') || pushToken === 'SIMULATOR_DEV_TOKEN') {
    console.warn(
      `[notifications] Omitiendo push para dispositivo offline/simulador: ${pushToken} (asistencia_id: ${asistenciaId})`
    );
    return;
  }

  // Validar que el token tenga el formato correcto de ExponentPushToken
  if (!pushToken.startsWith('ExponentPushToken[')) {
    console.error(
      `[notifications] Token inválido para asistencia ${asistenciaId}: ${pushToken.slice(0, 40)}...`
    );
    return;
  }

  try {
    const body = {
      to:    pushToken,
      title: 'SmartClass — Confirma tu asistencia',
      body:  'Acercaste tu tarjeta. Abre la app para verificar.',
      data:  {
        asistencia_id: String(asistenciaId),
        accion:        'confirmar_asistencia',
        // Incluir datos del curso si están disponibles
        curso_codigo: cursoInfo?.codigo || '',
        curso_nombre: cursoInfo?.nombre || '',
        aula: cursoInfo?.aula || '',
        docente: cursoInfo?.docente || '',
        hora_inicio: cursoInfo?.hora_inicio || '',
        hora_fin: cursoInfo?.hora_fin || '',
      },
      sound: 'default',
    };

    console.log(
      `[notifications] Enviando push para asistencia ${asistenciaId}, token: ${pushToken.slice(0, 30)}...`
    );

    const response = await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.data?.status === 'error') {
      console.error(
        `[notifications] Error Expo Push para asistencia ${asistenciaId}:`,
        JSON.stringify(data || response.status),
      );
      // Registrar error pero no fallar — es fire-and-forget
      return;
    }

    console.log(
      `[notifications] ✓ Push enviado exitosamente — asistencia ${asistenciaId}`
    );
  } catch (err) {
    // Nunca dejar que un error de red bloquee el flujo principal
    console.error(
      `[notifications] Excepción al enviar push para asistencia ${asistenciaId}:`,
      err.message,
    );
  }
}