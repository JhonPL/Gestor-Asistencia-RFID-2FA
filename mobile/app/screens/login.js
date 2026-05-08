import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Button, Divider, BodyText, Label } from '../../components/ui';

import { loginWithGoogle } from '../../src/api/auth';
import { registrarDispositivo } from '../../src/api/movil';
import { saveAuth, saveDeviceId } from '../../src/storage/auth';
import { getPushToken } from '../../src/notifications/setup';
import env from '../../src/config/env';


const GoogleIcon = () => (
  <Ionicons name="logo-google" size={20} color="white" />
);

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  const handleNativeGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;

      if (!idToken) {
        throw new Error("No se recibió el token de autenticación de Google");
      }

      console.log('✅ Token nativo recibido, iniciando login...');
      await handleGoogleLoginResponse({
        type: 'success',
        authentication: { idToken }
      });

    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services no está disponible');
      } else {
        console.log('Google Auth Error:', error);
        Alert.alert('Error', error.message || 'Error en la autenticación nativa');
      }
      setLoading(false);
    }
  };

  const handleGoogleLoginResponse = async (googleResponse) => {
    setLoading(true);
    try {
      // 1. Enviar el token de Google al backend
      const { token, user } = await loginWithGoogle(googleResponse);

      // 2. Persistir sesión en AsyncStorage
      await saveAuth(token, user);

      // 3. Obtener el push token real de Expo
      const expoPushToken = await getPushToken();
      const pushToken = expoPushToken ?? ('OFFLINE_' + Date.now());

      // 4. Registrar el dispositivo móvil en el backend con el token real
      const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';
      const dispositivo = await registrarDispositivo(token, {
        push_token: pushToken,
        plataforma,
      });

      // 5. Guardar el dispositivo_movil_id para usarlo en verificarAsistencia
      await saveDeviceId(dispositivo.id);

      // 6. Navegar a la pantalla principal
      router.replace('/screens/home');
    } catch (err) {
      Alert.alert(
        'Error al iniciar sesión',
        err.message ?? 'No se pudo conectar con el servidor. Verifica que el backend esté activo.',
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[
        s.container,
        { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[6] },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.blobTL} pointerEvents="none" />
      <View style={s.blobBR} pointerEvents="none" />

      <View style={s.logoSection}>
        <View style={s.logoBox}>
          <Ionicons name="school" size={34} color="white" />
        </View>
        <Text style={s.appName}>SmartClass</Text>
        <Label>Acceso Institucional · UCC Villavicencio</Label>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Bienvenido</Text>
        <BodyText muted style={{ marginBottom: spacing[6] }}>
          Usa tu correo{' '}
          <Text style={{ fontWeight: '700', color: colors.onSurface }}>@ucc.edu.co</Text>
          {' '}para acceder al sistema de asistencia.
        </BodyText>

        <TouchableOpacity
          style={[
            s.googleBtn,
            loading && { opacity: 0.7 },
          ]}
          onPress={handleNativeGoogleLogin}
          disabled={loading}
          activeOpacity={0.82}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <GoogleIcon />
              <Text style={s.googleBtnTxt}>Iniciar con Google</Text>
            </>
          )}
        </TouchableOpacity>


        <Text style={s.note}>
          Producción: solo cuentas{' '}
          <Text style={{ fontWeight: '700' }}>@ucc.edu.co</Text>
        </Text>
      </View>

      <Text style={s.footer}>
        © {new Date().getFullYear()} SmartClass RFID · Universidad Cooperativa de Colombia
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flexGrow: 1, paddingHorizontal: spacing[6], justifyContent: 'center' },
  blobTL:       { position: 'absolute', top: -50, left: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.primaryContainer, opacity: 0.05 },
  blobBR:       { position: 'absolute', bottom: -70, right: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.secondaryContainer, opacity: 0.08 },

  logoSection:  { alignItems: 'center', marginBottom: spacing[8] },
  logoBox:      { width: 72, height: 72, borderRadius: radii.xl, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[4], ...shadows.lg },
  appName:      { fontSize: fontSizes['3xl'], fontWeight: '800', color: colors.primary, letterSpacing: -1, marginBottom: spacing[1] },

  card:         { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii['2xl'], padding: spacing[6], ...shadows.md, borderWidth: 1, borderColor: colors.outlineVariant + '26' },
  cardTitle:    { fontSize: fontSizes['2xl'], fontWeight: '800', color: colors.primary, letterSpacing: -0.5, marginBottom: spacing[2] },

  // Google OAuth Button
  googleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], height: 54, backgroundColor: colors.primary, borderRadius: radii.full, ...shadows.md },
  googleBtnTxt: { color: 'white', fontSize: fontSizes.base, fontWeight: '700' },


  note:         { textAlign: 'center', fontSize: fontSizes.xs, color: colors.outline, marginTop: spacing[4] },
  footer:       { textAlign: 'center', fontSize: fontSizes.xs, color: colors.outline, marginTop: spacing[6] },
});