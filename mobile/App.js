import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { colors } from './constants/tokens';

import LoginScreen            from './app/screens/login';
import HomeScreen             from './app/screens/home';
import AttendanceConfirmScreen from './app/screens/attendance-confirm';
import HistoryScreen          from './app/screens/history';

/**
 * App.js — Raíz de la app SmartClass móvil.
 *
 * Usa @react-navigation/native en lugar de expo-router
 * para evitar conflictos de versiones con React 19.
 *
 * Instalar:
 *   npx expo install @react-navigation/native @react-navigation/native-stack
 *   npx expo install react-native-screens react-native-safe-area-context
 */

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
      >
        <Stack.Screen name="Login"              component={LoginScreen} />
        <Stack.Screen name="Home"               component={HomeScreen} />
        <Stack.Screen name="AttendanceConfirm"  component={AttendanceConfirmScreen} />
        <Stack.Screen name="History"            component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}