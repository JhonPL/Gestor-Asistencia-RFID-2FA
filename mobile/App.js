// mobile/App.js
// Raíz de la app SmartClass móvil.
// Incluye los listeners de notificaciones push para navegar a la pantalla
// de confirmación de asistencia cuando el estudiante toca una notificación.

import { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import { colors } from './constants/tokens';

import LoginScreen             from './app/screens/login';
import HomeScreen              from './app/screens/home';
import AttendanceConfirmScreen from './app/screens/attendance-confirm';
import HistoryScreen           from './app/screens/history';

// ── Configuración global del handler de notificaciones ────────
// Controla qué pasa cuando llega una notificación con la app en primer plano.
// shouldShowAlert: true  → muestra el banner del sistema aunque la app esté abierta
// shouldPlaySound: true  → reproduce el sonido de la notificación
// shouldSetBadge: false  → no muestra el número en el ícono de la app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {
  // Ref del NavigationContainer para navegar desde fuera de una pantalla
  const navigationRef = useRef(null);

  // Ref para guardar el listener y poder limpiarlo al desmontar
  const notificationListener = useRef(null);
  const responseListener     = useRef(null);

  useEffect(() => {
    // ── Listener 1: notificación recibida con la app en primer plano ──
    // Solo la registramos — el setNotificationHandler de arriba ya se encarga
    // de mostrarla. Este listener es útil si quisieras hacer algo extra
    // (actualizar un contador, refrescar datos, etc.).
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        const data = notification.request.content.data;
        console.log('[notifications] Notificación recibida en primer plano:', data);
        // Aquí podrías disparar un estado global si fuera necesario
      },
    );

    // ── Listener 2: usuario tocó una notificación (app en fondo o primer plano) ──
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        console.log('[notifications] Usuario tocó notificación:', data);
        handleNotificationTap(data);
      },
    );

    // ── Caso especial: app abierta desde notificación (estaba cerrada) ──
    // getLastNotificationResponseAsync() devuelve la última notificación
    // tocada, útil cuando el SO mató la app y el usuario la abre desde la
    // bandeja de notificaciones.
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const data = response.notification.request.content.data;
      console.log('[notifications] App abierta desde notificación:', data);
      // Pequeño delay para que la navegación esté lista
      setTimeout(() => handleNotificationTap(data), 500);
    });

    // Limpiar listeners al desmontar el componente
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ── Navegar según el contenido de la notificación ─────────
  const handleNotificationTap = (data) => {
    if (!navigationRef.current) return;

    const asistenciaId = data?.asistencia_id;
    const accion       = data?.accion;

    if (accion === 'confirmar_asistencia' && asistenciaId) {
      // Navegar a la pantalla de confirmación con el asistencia_id
      navigationRef.current.navigate('AttendanceConfirm', {
        asistencia_id: asistenciaId,
      });
    } else {
      // Si no hay asistencia_id reconocible, ir al home
      navigationRef.current.navigate('Home');
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
      >
        <Stack.Screen name="Login"             component={LoginScreen} />
        <Stack.Screen name="Home"              component={HomeScreen} />
        <Stack.Screen name="AttendanceConfirm" component={AttendanceConfirmScreen} />
        <Stack.Screen name="History"           component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}