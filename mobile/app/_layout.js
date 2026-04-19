import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/tokens';

/**
 * Root layout de expo-router.
 * SafeAreaProvider envuelve toda la app para que cada pantalla
 * use useSafeAreaInsets() en lugar de SafeAreaView deprecated.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }} />
    </SafeAreaProvider>
  );
}