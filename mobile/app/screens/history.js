import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Card, BodyText, Label, Badge } from '../../components/ui';
import { MOCK_HISTORIAL, MOCK_STATS } from '../../mocks';

/**
 * HistoryScreen — historial de asistencia del estudiante.
 */

const VERIF_CONFIG = {
  completado: { icon: 'checkmark-circle', color: colors.secondary,  label: 'Verificado'  },
  pendiente:  { icon: 'time',             color: colors.primary,    label: 'Pendiente'   },
  fallido:    { icon: 'close-circle',     color: colors.error,      label: 'Fallido'     },
  sin_app:    { icon: 'phone-portrait',   color: colors.outline,    label: 'Sin app'     },
};

const METODO_ICON = { fingerprint: 'finger-print', face_id: 'scan-circle', ubicacion: 'location' };
const ESTADO_BADGE = { Presente: 'success', Ausente: 'error', Justificado: 'warning' };

export default function HistoryScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[10] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Mi historial</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stats card */}
      <View style={s.statsCard}>
        <View style={s.bigStat}>
          <Text style={s.bigStatValue}>{MOCK_STATS.tasaAsistencia}%</Text>
          <Label style={{ color: colors.onPrimaryContainer }}>Tasa de asistencia</Label>
        </View>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.secondaryFixed }]}>{MOCK_STATS.presentes}</Text>
            <Label style={{ color: colors.onPrimaryContainer }}>Presentes</Label>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.errorContainer }]}>{MOCK_STATS.ausentes}</Text>
            <Label style={{ color: colors.onPrimaryContainer }}>Ausentes</Label>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.tertiaryFixed }]}>{MOCK_STATS.justificados}</Text>
            <Label style={{ color: colors.onPrimaryContainer }}>Justificados</Label>
          </View>
        </View>

        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: `${MOCK_STATS.tasaAsistencia}%` }]} />
        </View>
      </View>

      {/* Lista */}
      <Text style={s.sectionTitle}>Sesiones registradas</Text>

      {MOCK_HISTORIAL.map(item => {
        const verif   = VERIF_CONFIG[item.estadoVerificacion] ?? VERIF_CONFIG.pendiente;
        const metIcon = METODO_ICON[item.metodo];
        return (
          <Card key={item.id} style={{ marginBottom: spacing[3] }}>
            {/* Top: curso + badge estado */}
            <View style={s.sessionTop}>
              <View style={{ flex: 1, marginRight: spacing[3] }}>
                <Badge variant="default" style={{ marginBottom: spacing[2] }}>{item.curso.codigo}</Badge>
                <Text style={s.sessionCourse}>{item.curso.nombre}</Text>
                <Text style={s.sessionDate}>{item.fechaFormateada}</Text>
              </View>
              <Badge variant={ESTADO_BADGE[item.estado] ?? 'default'}>{item.estado}</Badge>
            </View>

            {/* Chips de detalles */}
            <View style={s.chips}>
              {item.horaRegistro && (
                <View style={s.chip}>
                  <Ionicons name="time-outline" size={11} color={colors.onSurfaceVariant} />
                  <Text style={s.chipTxt}>{item.horaRegistro}</Text>
                </View>
              )}
              {metIcon && (
                <View style={s.chip}>
                  <Ionicons name={metIcon} size={11} color={colors.onSurfaceVariant} />
                  <Text style={s.chipTxt}>{item.metodo?.replace('_', ' ')}</Text>
                </View>
              )}
              {item.dentroCampus !== null && (
                <View style={s.chip}>
                  <Ionicons
                    name={item.dentroCampus ? 'checkmark-circle' : 'close-circle'}
                    size={11}
                    color={item.dentroCampus ? colors.secondary : colors.error}
                  />
                  <Text style={[s.chipTxt, { color: item.dentroCampus ? colors.secondary : colors.error }]}>
                    {item.dentroCampus ? 'En campus' : 'Fuera campus'}
                  </Text>
                </View>
              )}
              <View style={s.chip}>
                <Ionicons name={verif.icon} size={11} color={verif.color} />
                <Text style={[s.chipTxt, { color: verif.color }]}>{verif.label}</Text>
              </View>
            </View>

            {/* Motivo */}
            {item.motivo && (
              <View style={s.motivoRow}>
                <Ionicons name="document-text-outline" size={12} color={colors.outline} />
                <Text style={s.motivoTxt}>"{item.motivo}"</Text>
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { paddingHorizontal: spacing[6] },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[6] },
  backBtn:      { width: 36, height: 36, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  topTitle:     { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface },

  statsCard:    { backgroundColor: colors.primaryContainer, borderRadius: radii['2xl'], padding: spacing[6], marginBottom: spacing[6] },
  bigStat:      { alignItems: 'center', marginBottom: spacing[5] },
  bigStatValue: { fontSize: fontSizes['4xl'], fontWeight: '800', color: 'white', letterSpacing: -1 },
  statsRow:     { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing[5] },
  statItem:     { alignItems: 'center' },
  statValue:    { fontSize: fontSizes['2xl'], fontWeight: '800' },
  statDiv:      { width: 1, backgroundColor: 'rgba(255,255,255,.2)' },
  progressTrack:{ height: 6, backgroundColor: 'rgba(255,255,255,.2)', borderRadius: radii.full, overflow: 'hidden' },
  progressBar:  { height: '100%', backgroundColor: colors.secondaryFixed, borderRadius: radii.full },

  sectionTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.primary, letterSpacing: -0.4, marginBottom: spacing[4] },
  sessionTop:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[3] },
  sessionCourse:{ fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface, lineHeight: fontSizes.base * 1.3 },
  sessionDate:  { fontSize: fontSizes.xs, color: colors.onSurfaceVariant, marginTop: spacing[1] },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.surfaceContainerLow, borderRadius: radii.full, paddingHorizontal: spacing[2], paddingVertical: 3 },
  chipTxt:      { fontSize: fontSizes.xs, color: colors.onSurfaceVariant, fontWeight: '500', textTransform: 'capitalize' },
  motivoRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.outlineVariant + '26' },
  motivoTxt:    { fontSize: fontSizes.xs, color: colors.outline, fontStyle: 'italic' },
});