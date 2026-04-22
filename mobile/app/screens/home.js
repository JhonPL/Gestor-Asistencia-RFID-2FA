import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Badge, Card, BodyText, Label } from '../../components/ui';
import { MOCK_STUDENT, MOCK_SESION_ACTIVA, MOCK_CLASES_HOY } from '../../mocks';

/**
 * HomeScreen — pantalla principal del estudiante.
 * Cambia MOCK_SESION_ACTIVA.estado en mocks/index.js para probar cada estado:
 *   'sin_clase' | 'pendiente' | 'completado' | 'fallido'
 */

const STATUS_CONFIG = {
  sin_clase:  { icon: 'calendar-blank-outline', color: colors.outline,   bg: colors.surfaceContainerLow, label: 'Sin clase activa',       desc: 'No hay sesiones activas ahora.',              showBtn: false },
  pendiente:  { icon: 'timer-sand',             color: colors.primary,   bg: colors.primaryFixed,        label: 'Asistencia pendiente',   desc: 'Pasa tu tarjeta RFID y confirma desde la app.', showBtn: true  },
  completado: { icon: 'check-circle-outline',   color: colors.secondary, bg: colors.secondaryFixed,      label: 'Asistencia confirmada ✓', desc: 'Tu biometría y ubicación fueron validadas.',    showBtn: false },
  fallido:    { icon: 'alert-circle-outline',   color: colors.error,     bg: colors.errorContainer,      label: 'Verificación fallida',   desc: 'Biometría o ubicación incorrectas.',            showBtn: false },
};

const CLASE_BADGE = {
  completado:    { label: 'Confirmada', variant: 'success'  },
  pendiente:     { label: 'Pendiente',  variant: 'default'  },
  sin_registrar: { label: 'Sin clase',  variant: 'warning'  },
};

export default function HomeScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const status  = STATUS_CONFIG[MOCK_SESION_ACTIVA.estado] ?? STATUS_CONFIG.sin_clase;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[10] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Label>Bienvenido de nuevo</Label>
          <Text style={s.greeting}>{MOCK_STUDENT.nombre} {MOCK_STUDENT.apellido}</Text>
          <BodyText muted style={{ fontSize: fontSizes.sm, marginTop: 2 }}>{MOCK_STUDENT.programa}</BodyText>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{MOCK_STUDENT.iniciales}</Text>
        </View>
      </View>

      {/* Card de estado de sesión */}
      <View style={[s.statusCard, { backgroundColor: status.bg }]}>
        <View style={s.statusTop}>
          <MaterialCommunityIcons name={status.icon} size={40} color={status.color} />
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: status.color }]}>{status.label}</Text>
            <BodyText muted style={{ fontSize: fontSizes.sm, marginTop: 2 }}>{status.desc}</BodyText>
          </View>
        </View>

        {/* Detalles de la sesión */}
        {MOCK_SESION_ACTIVA.estado !== 'sin_clase' && (
          <View style={s.sessionDetails}>
            <View style={s.detailRow}>
              <Ionicons name="book-outline" size={13} color={colors.onSurfaceVariant} />
              <Text style={s.detailTxt}>{MOCK_SESION_ACTIVA.curso.nombre}</Text>
            </View>
            <View style={s.detailRow}>
              <Ionicons name="location-outline" size={13} color={colors.onSurfaceVariant} />
              <Text style={s.detailTxt}>{MOCK_SESION_ACTIVA.aula} · {MOCK_SESION_ACTIVA.horaInicio}</Text>
            </View>
            <View style={s.detailRow}>
              <Ionicons name="person-outline" size={13} color={colors.onSurfaceVariant} />
              <Text style={s.detailTxt}>{MOCK_SESION_ACTIVA.docente}</Text>
            </View>
          </View>
        )}

        {status.showBtn && (
          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: status.color }]}
            onPress={() => router.push('/screens/attendance-confirm')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="fingerprint" size={22} color="white" />
            <Text style={s.confirmBtnTxt}>Confirmar asistencia</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Clases de hoy */}
      <Text style={s.sectionTitle}>Clases de hoy</Text>
      {MOCK_CLASES_HOY.map(curso => {
        const badge = CLASE_BADGE[curso.estado] ?? CLASE_BADGE.sin_registrar;
        return (
          <Card key={curso.id} style={{ marginBottom: spacing[3] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: spacing[3] }}>
                <Badge variant="default" style={{ marginBottom: spacing[2] }}>{curso.codigo}</Badge>
                <Text style={s.courseName}>{curso.nombre}</Text>
                <View style={s.courseMeta}>
                  <Ionicons name="location-outline" size={12} color={colors.onSurfaceVariant} />
                  <Text style={s.metaTxt}>{curso.aula}</Text>
                  <Ionicons name="time-outline" size={12} color={colors.onSurfaceVariant} style={{ marginLeft: spacing[3] }} />
                  <Text style={s.metaTxt}>{curso.horaInicio} – {curso.horaFin}</Text>
                </View>
              </View>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </View>
          </Card>
        );
      })}

      {/* Acceso al historial */}
      <TouchableOpacity
        style={s.histBtn}
        onPress={() => router.push('/screens/history')}
        activeOpacity={0.8}
      >
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text style={s.histBtnTxt}>Ver mi historial de asistencia</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:         { paddingHorizontal: spacing[6] },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[6] },
  greeting:       { fontSize: fontSizes['2xl'], fontWeight: '800', color: colors.primary, letterSpacing: -0.5, marginTop: spacing[1] },
  avatar:         { width: 48, height: 48, borderRadius: radii.full, backgroundColor: colors.primaryFixedDim, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:      { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primary },

  statusCard:     { borderRadius: radii['2xl'], padding: spacing[5], marginBottom: spacing[6] },
  statusTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[4], marginBottom: spacing[3] },
  statusLabel:    { fontSize: fontSizes.lg, fontWeight: '800', letterSpacing: -0.3 },
  sessionDetails: { backgroundColor: 'rgba(255,255,255,.55)', borderRadius: radii.lg, padding: spacing[3], gap: spacing[2], marginBottom: spacing[4] },
  detailRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  detailTxt:      { fontSize: fontSizes.sm, color: colors.onSurfaceVariant, fontWeight: '500' },
  confirmBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], height: 52, borderRadius: radii.xl, ...shadows.md },
  confirmBtnTxt:  { color: 'white', fontWeight: '700', fontSize: fontSizes.base },

  sectionTitle:   { fontSize: fontSizes.xl, fontWeight: '800', color: colors.primary, letterSpacing: -0.4, marginBottom: spacing[4] },
  courseName:     { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface, marginBottom: spacing[2] },
  courseMeta:     { flexDirection: 'row', alignItems: 'center', gap: spacing[1], flexWrap: 'wrap' },
  metaTxt:        { fontSize: fontSizes.xs, color: colors.onSurfaceVariant },

  histBtn:        { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, ...shadows.sm, marginTop: spacing[2] },
  histBtnTxt:     { flex: 1, fontSize: fontSizes.base, fontWeight: '600', color: colors.primary },
});