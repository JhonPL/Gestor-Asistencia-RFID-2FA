import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Button, Divider, BodyText, Label } from '../../components/ui';

/**
 * LoginScreen — autenticación institucional.
 * Navegación con expo-router (useRouter).
 * Modo actual: simulación → navega directo a /screens/home.
 * Modo producción: reemplazar handleSimulated() por expo-auth-session + Azure AD.
 */

const MicrosoftIcon = () => (
  <View style={{ width: 20, height: 20, flexWrap: 'wrap', flexDirection: 'row', gap: 1 }}>
    <View style={{ width: 9, height: 9, backgroundColor: '#f25022' }} />
    <View style={{ width: 9, height: 9, backgroundColor: '#7fba00' }} />
    <View style={{ width: 9, height: 9, backgroundColor: '#00a4ef' }} />
    <View style={{ width: 9, height: 9, backgroundColor: '#ffb900' }} />
  </View>
);

export default function LoginScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleSimulated = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    router.replace('/screens/home');   // ← expo-router, no navigation.replace
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
      {/* Blobs decorativos */}
      <View style={s.blobTL} pointerEvents="none" />
      <View style={s.blobBR} pointerEvents="none" />

      {/* Logo */}
      <View style={s.logoSection}>
        <View style={s.logoBox}>
          <Ionicons name="school" size={34} color="white" />
        </View>
        <Text style={s.appName}>SmartClass</Text>
        <Label>Acceso Institucional · UCC Villavicencio</Label>
      </View>

      {/* Card */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Bienvenido</Text>
        <BodyText muted style={{ marginBottom: spacing[6] }}>
          Usa tu correo{' '}
          <Text style={{ fontWeight: '700', color: colors.onSurface }}>@ucc.edu.co</Text>
          {' '}para acceder al sistema de asistencia.
        </BodyText>

        {/* Botón Microsoft (deshabilitado — pendiente Azure AD) */}
        <View style={s.msRow}>
          <MicrosoftIcon />
          <Text style={s.msTxt}>Iniciar con Microsoft</Text>
        </View>
        <Text style={s.msPending}>Pendiente: configuración Azure AD UCC</Text>

        <Divider label="o simular acceso" style={{ marginVertical: spacing[5] }} />

        {/* Banner simulación */}
        <View style={s.simBanner}>
          <Ionicons name="flask-outline" size={14} color={colors.primary} />
          <Text style={s.simTxt}>Modo simulación — rol estudiante</Text>
        </View>

        {/* Botón simulado */}
        <TouchableOpacity
          style={[s.simBtn, loading && { opacity: 0.7 }]}
          onPress={handleSimulated}
          disabled={loading}
          activeOpacity={0.82}
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : (
              <>
                <Ionicons name="person-circle-outline" size={22} color="white" />
                <Text style={s.simBtnTxt}>Entrar como estudiante</Text>
              </>
            )
          }
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

  msRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[3], height: 52, backgroundColor: colors.surfaceContainerHigh, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.outlineVariant + '4D', opacity: 0.55 },
  msTxt:        { fontSize: fontSizes.base, fontWeight: '600', color: colors.onSurfaceVariant },
  msPending:    { textAlign: 'center', fontSize: fontSizes.xs, color: colors.outline, marginTop: spacing[2] },

  simBanner:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.primaryFixed, borderRadius: radii.lg, padding: spacing[3], marginBottom: spacing[3] },
  simTxt:       { fontSize: fontSizes.xs, color: colors.primary, fontWeight: '500' },

  simBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], height: 54, backgroundColor: colors.primary, borderRadius: radii.full, ...shadows.md },
  simBtnTxt:    { color: 'white', fontSize: fontSizes.base, fontWeight: '700' },

  note:         { textAlign: 'center', fontSize: fontSizes.xs, color: colors.outline, marginTop: spacing[4] },
  footer:       { textAlign: 'center', fontSize: fontSizes.xs, color: colors.outline, marginTop: spacing[6] },
});