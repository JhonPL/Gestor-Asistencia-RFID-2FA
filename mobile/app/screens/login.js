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

// ── Helper: mensaje de acceso denegado según el rol ───────────
function mensajeAccesoDenegado(rol) {
  const roles = {
    docente: 'Los docentes deben acceder desde el portal web SmartClass.',
    administrador: 'Los administradores deben acceder desde el portal web SmartClass.',
  };
  return roles[rol] ?? 'Tu cuenta no tiene permiso para acceder a esta aplicación.';
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(null); // { rol, nombre }

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: env.GOOGLE_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  // ── Verificar que el usuario tenga rol estudiante ──────────
  const verificarRolEstudiante = (user) => {
    if (user.rol !== 'estudiante') {
      setAccessDenied({ rol: user.rol, nombre: user.nombre });
      return false;
    }
    return true;
  };

  const handleNativeGoogleLogin = async () => {
    setLoading(true);
    setAccessDenied(null);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;

      if (!idToken) throw new Error('No se recibió el token de autenticación de Google');

      await handleGoogleLoginResponse({ type: 'success', authentication: { idToken } });
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // usuario canceló, no hacer nada
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services no está disponible');
      } else {
        Alert.alert('Error', error.message || 'Error en la autenticación con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginResponse = async (googleResponse) => {
    setLoading(true);
    try {
      // 1. Enviar el token de Google al backend
      const { token, user } = await loginWithGoogle(googleResponse);

      // 2. Verificar que sea estudiante — si no, bloquear acceso
      if (!verificarRolEstudiante(user)) {
        setLoading(false);
        return;
      }

      // 3. Persistir sesión en AsyncStorage
      await saveAuth(token, user);

      // 4. Obtener el push token real de Expo
      const expoPushToken = await getPushToken();
      const pushToken = expoPushToken ?? ('OFFLINE_' + Date.now());

      // 5. Registrar el dispositivo móvil en el backend con el token real
      const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';
      const dispositivo = await registrarDispositivo(token, {
        push_token: pushToken,
        plataforma,
      });

      // 6. Guardar el dispositivo_movil_id para usarlo en verificarAsistencia
      await saveDeviceId(dispositivo.id);

      // 7. Navegar a la pantalla principal
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

  // ── Render: pantalla de acceso denegado ───────────────────
  if (accessDenied) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={[
          s.container,
          { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.blobTL} pointerEvents="none" />
        <View style={s.blobBR} pointerEvents="none" />

        <View style={s.logoSection}>
          <View style={[s.logoBox, { backgroundColor: colors.error }]}>
            <Ionicons name="lock-closed" size={34} color="white" />
          </View>
          <Text style={[s.appName, { color: colors.error }]}>Acceso denegado</Text>
          <Label>SmartClass · UCC Villavicencio</Label>
        </View>

        <View style={[s.card, { borderColor: colors.errorContainer }]}>
          <View style={s.deniedHeader}>
            <Ionicons name="person-circle-outline" size={48} color={colors.error} />
            <View style={{ flex: 1, marginLeft: spacing[4] }}>
              <Text style={s.deniedName}>{accessDenied.nombre}</Text>
              <View style={s.deniedRolBadge}>
                <Ionicons name="shield-outline" size={12} color={colors.error} />
                <Text style={s.deniedRolText}>
                  {accessDenied.rol.charAt(0).toUpperCase() + accessDenied.rol.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.deniedBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginBottom: spacing[2] }} />
            <Text style={s.deniedTitle}>Esta app es solo para estudiantes</Text>
            <Text style={s.deniedDesc}>{mensajeAccesoDenegado(accessDenied.rol)}</Text>
          </View>

          <View style={s.deniedSteps}>
            <Text style={s.deniedStepsTitle}>¿Qué debes hacer?</Text>
            {[
              { icon: 'globe-outline', text: 'Accede a smartclass.ucc.edu.co desde tu navegador.' },
              { icon: 'logo-google',   text: 'Inicia sesión con tu correo @ucc.edu.co' },
              { icon: 'grid-outline',  text: 'Usa el panel correspondiente a tu rol.' },
            ].map((item, i) => (
              <View key={i} style={s.deniedStep}>
                <View style={s.deniedStepIcon}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} />
                </View>
                <Text style={s.deniedStepText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => setAccessDenied(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
            <Text style={s.retryBtnText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>
          © {new Date().getFullYear()} SmartClass RFID · Universidad Cooperativa de Colombia
        </Text>
      </ScrollView>
    );
  }

  // ── Render: pantalla de login normal ──────────────────────
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
        <BodyText muted style={{ marginBottom: spacing[3] }}>
          Usa tu correo{' '}
          <Text style={{ fontWeight: '700', color: colors.onSurface }}>@ucc.edu.co</Text>
          {' '}para acceder al sistema de asistencia.
        </BodyText>

        {/* Aviso exclusivo para estudiantes */}
        <View style={s.studentOnlyBanner}>
          <Ionicons name="people-outline" size={14} color={colors.secondary} />
          <Text style={s.studentOnlyText}>
            App exclusiva para <Text style={{ fontWeight: '700' }}>estudiantes</Text>.
            Docentes y administradores usan el portal web.
          </Text>
        </View>

        <TouchableOpacity
          style={[s.googleBtn, loading && { opacity: 0.7 }]}
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
          Solo cuentas <Text style={{ fontWeight: '700' }}>@ucc.edu.co</Text> con rol de estudiante
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

  studentOnlyBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2],
    backgroundColor: colors.secondaryFixed, borderRadius: radii.lg,
    padding: spacing[3], marginBottom: spacing[5],
  },
  studentOnlyText: { fontSize: fontSizes.xs, color: colors.secondary, flex: 1, lineHeight: 18 },

  googleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], height: 54, backgroundColor: colors.primary, borderRadius: radii.full, ...shadows.md },
  googleBtnTxt: { color: 'white', fontSize: fontSizes.base, fontWeight: '700' },

  note:         { textAlign: 'center', fontSize: fontSizes.xs, color: colors.outline, marginTop: spacing[4] },
  footer:       { textAlign: 'center', fontSize: fontSizes.xs, color: colors.outline, marginTop: spacing[6] },

  // ── Acceso denegado ────────────────────────────────────────
  deniedHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.errorContainer + '55',
    borderRadius: radii.xl, padding: spacing[4], marginBottom: spacing[5],
  },
  deniedName:   { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface, marginBottom: spacing[1] },
  deniedRolBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deniedRolText: { fontSize: fontSizes.xs, color: colors.error, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  deniedBox:    {
    alignItems: 'center', backgroundColor: colors.primaryFixed,
    borderRadius: radii.xl, padding: spacing[5], marginBottom: spacing[4],
  },
  deniedTitle:  { fontSize: fontSizes.base, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: spacing[2] },
  deniedDesc:   { fontSize: fontSizes.sm, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },

  deniedSteps:  { marginBottom: spacing[5] },
  deniedStepsTitle: { fontSize: fontSizes.xs, fontWeight: '700', color: colors.outline, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[3] },
  deniedStep:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], marginBottom: spacing[3] },
  deniedStepIcon: { width: 28, height: 28, borderRadius: radii.full, backgroundColor: colors.primaryFixed, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  deniedStepText: { fontSize: fontSizes.sm, color: colors.onSurfaceVariant, flex: 1, lineHeight: 20 },

  retryBtn:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], height: 48, borderRadius: radii.full,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  retryBtnText: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.primary },
});