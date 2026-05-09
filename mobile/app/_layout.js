import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { colors } from '../constants/tokens';

/**
 * Configuración global del handler de notificaciones push.
 * Controla qué pasa cuando llega una notificación con la app en primer plano.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Root layout de expo-router.
 * SafeAreaProvider envuelve toda la app para que cada pantalla
 * use useSafeAreaInsets() en lugar de SafeAreaView deprecated.
 * 
 * También configura los listeners globales para notificaciones push.
 */
export default function RootLayout() {
  const router = useRouter();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    // ── Listener 1: Notificación recibida con app en primer plano ──
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        console.log('[notifications] Notificación recibida en primer plano:', data);
      },
    );

    // ── Listener 2: Usuario tocó una notificación (app en fondo o primer plano) ──
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('[notifications] Usuario tocó notificación:', data);
        handleNotificationTap(data);
      },
    );

    // ── Caso especial: app abierta desde notificación (estaba cerrada) ──
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data;
      console.log('[notifications] App abierta desde notificación cerrada:', data);
      setTimeout(() => handleNotificationTap(data), 500);
    });

    // Limpiar listeners al desmontar
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ── Navegar según el contenido de la notificación ─────────
  const handleNotificationTap = (data) => {
    const asistenciaId = data?.asistencia_id;
    const accion = data?.accion;

    if (accion === 'confirmar_asistencia' && asistenciaId) {
      // Navegar a la pantalla de confirmación con los parámetros disponibles
      // Nota: Los datos del curso se completarán en home.js, aquí solo pasamos asistencia_id
      // Para una mejor UX, el backend debería enviar todos los datos en la notificación
      router.push({
        pathname: '/screens/attendance-confirm',
        params: {
          asistencia_id: String(asistenciaId),
          curso_codigo: data?.curso_codigo ?? '',
          curso_nombre: data?.curso_nombre ?? '',
          aula: data?.aula ?? '',
          hora_inicio: data?.hora_inicio ?? '',
          hora_fin: data?.hora_fin ?? '',
          docente: data?.docente ?? '',
        },
      });
    } else {
      // Si no hay asistencia_id reconocible, ir al home
      router.push('/screens/home');
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }} />
    </SafeAreaProvider>
  );
}