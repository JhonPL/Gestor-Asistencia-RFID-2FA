import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Badge, BodyText } from '../../components/ui';
import { MOCK_SESION_ACTIVA } from '../../mocks';

/**
 * AttendanceConfirmScreen — confirmar asistencia con biometría + GPS.
 * Flujo simulado: muestra los 3 pasos con delays y el resultado final.
 * Para ver el estado 'fallido', cambia SIMULAR_FALLO a true.
 */
const SIMULAR_FALLO = false; // ← cambia a true para probar el estado fallido

const PASOS = [
  { id: 'biometria', iconPending: 'fingerprint',   iconOk: 'checkmark-circle', labelPending: 'Verificando biometría…',  labelOk: 'Biometría verificada' },
  { id: 'ubicacion', iconPending: 'location',       iconOk: 'checkmark-circle', labelPending: 'Obteniendo ubicación GPS…', labelOk: 'Dentro del campus UCC' },
  { id: 'servidor',  iconPending: 'cloud-upload',   iconOk: 'checkmark-done-circle', labelPending: 'Registrando asistencia…', labelOk: 'Asistencia confirmada' },
];

const RESULTADO_CONFIG = {
  completado: { icon: 'checkmark-done-circle', color: colors.secondary, bg: colors.secondaryFixed, label: '¡Asistencia registrada!', desc: 'Tu presencia fue verificada correctamente.' },
  fallido:    { icon: 'close-circle',          color: colors.error,     bg: colors.errorContainer,  label: 'Verificación fallida',   desc: 'No se pudo validar. Contacta al docente.' },
};

export default function AttendanceConfirmScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [fase,       setFase]     = useState('idle');       // idle | procesando | completado | fallido
  const [pasoActual, setPasoAct]  = useState(-1);
  const [pasosOk,    setPasosOk]  = useState([]);

  const handleConfirm = async () => {
    setFase('procesando');
    setPasosOk([]);

    for (let i = 0; i < PASOS.length; i++) {
      setPasoAct(i);
      await new Promise(r => setTimeout(r, 1200 + i * 200));
      // En el último paso, si SIMULAR_FALLO, no lo marca como ok
      if (i === PASOS.length - 1 && SIMULAR_FALLO) break;
      setPasosOk(prev => [...prev, PASOS[i].id]);
    }

    await new Promise(r => setTimeout(r, 500));
    setFase(SIMULAR_FALLO ? 'fallido' : 'completado');
  };

  const resultado = RESULTADO_CONFIG[fase];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[s.container, { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[8] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header con back */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Confirmar asistencia</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Info del curso */}
      <View style={s.courseCard}>
        <Badge variant="default" style={{ marginBottom: spacing[3] }}>{MOCK_SESION_ACTIVA.curso.codigo}</Badge>
        <Text style={s.courseName}>{MOCK_SESION_ACTIVA.curso.nombre}</Text>
        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={s.metaTxt}>{MOCK_SESION_ACTIVA.aula}</Text>
          <Ionicons name="time-outline" size={13} color={colors.onSurfaceVariant} style={{ marginLeft: spacing[4] }} />
          <Text style={s.metaTxt}>{MOCK_SESION_ACTIVA.horaInicio} – {MOCK_SESION_ACTIVA.horaFin}</Text>
        </View>
        <View style={[s.metaRow, { marginTop: spacing[1] }]}>
          <Ionicons name="person-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={s.metaTxt}>{MOCK_SESION_ACTIVA.docente}</Text>
        </View>
      </View>

      {/* ── IDLE ── */}
      {fase === 'idle' && (
        <View style={s.idleSection}>
          <View style={s.bigIconBox}>
            <MaterialCommunityIcons name="fingerprint" size={68} color={colors.primary} />
          </View>
          <Text style={s.idleTitle}>Confirma tu presencia</Text>
          <BodyText muted style={{ textAlign: 'center', marginTop: spacing[2], marginBottom: spacing[6] }}>
            Se verificará tu biometría y tu ubicación dentro del campus UCC.
          </BodyText>

          {PASOS.map((p, i) => (
            <View key={p.id} style={s.stepRow}>
              <View style={s.stepNum}><Text style={s.stepNumTxt}>{i + 1}</Text></View>
              <Text style={s.stepLabel}>
                {p.id === 'biometria' ? 'Huella digital o Face ID' :
                 p.id === 'ubicacion' ? 'Validación GPS campus UCC' :
                 'Registro en el sistema'}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <MaterialCommunityIcons name="fingerprint" size={22} color="white" />
            <Text style={s.confirmBtnTxt}>Confirmar ahora</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── PROCESANDO ── */}
      {fase === 'procesando' && (
        <View style={s.processingSection}>
          {PASOS.map((paso, i) => {
            const done    = pasosOk.includes(paso.id);
            const current = pasoActual === i && !done;
            const pending = i > pasoActual;
            return (
              <View key={paso.id} style={[s.pasoCard, done && s.pasoCardDone, current && s.pasoCardActive]}>
                <View style={[s.pasoIconBox, done && s.pasoIconDone, current && s.pasoIconActive]}>
                  {current  && <ActivityIndicator color={colors.primary} size="small" />}
                  {done     && <Ionicons name={paso.iconOk}      size={22} color={colors.secondary} />}
                  {pending  && <Ionicons name={paso.iconPending} size={22} color={colors.outline} />}
                </View>
                <Text style={[s.pasoLabel, done && s.pasoLabelDone, current && s.pasoLabelActive]}>
                  {done ? paso.labelOk : current ? paso.labelPending : paso.labelPending.replace('…', '')}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── RESULTADO ── */}
      {(fase === 'completado' || fase === 'fallido') && resultado && (
        <View style={[s.resultCard, { backgroundColor: resultado.bg }]}>
          <Ionicons name={resultado.icon} size={64} color={resultado.color} style={{ marginBottom: spacing[4] }} />
          <Text style={[s.resultTitle, { color: resultado.color }]}>{resultado.label}</Text>
          <BodyText muted style={{ textAlign: 'center', marginTop: spacing[2], marginBottom: spacing[8] }}>
            {resultado.desc}
          </BodyText>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: resultado.color }]}
            onPress={() => router.replace('/screens/home')}
            activeOpacity={0.85}
          >
            <Text style={s.doneBtnTxt}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:        { paddingHorizontal: spacing[6], flexGrow: 1 },
  topBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[6] },
  backBtn:          { width: 36, height: 36, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  topTitle:         { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface },

  courseCard:       { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing[5], marginBottom: spacing[6], ...shadows.sm },
  courseName:       { fontSize: fontSizes.xl, fontWeight: '800', color: colors.primary, letterSpacing: -0.4, marginBottom: spacing[3] },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  metaTxt:          { fontSize: fontSizes.xs, color: colors.onSurfaceVariant },

  idleSection:      { alignItems: 'center' },
  bigIconBox:       { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryFixed, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[5], ...shadows.md },
  idleTitle:        { fontSize: fontSizes['2xl'], fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  stepRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing[4], alignSelf: 'stretch', marginBottom: spacing[3] },
  stepNum:          { width: 32, height: 32, borderRadius: radii.full, backgroundColor: colors.primaryFixed, justifyContent: 'center', alignItems: 'center' },
  stepNumTxt:       { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primary },
  stepLabel:        { fontSize: fontSizes.sm, fontWeight: '600', color: colors.onSurface, flex: 1 },
  confirmBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], height: 56, width: '100%', backgroundColor: colors.primary, borderRadius: radii.full, marginTop: spacing[6], ...shadows.lg },
  confirmBtnTxt:    { color: 'white', fontSize: fontSizes.lg, fontWeight: '700' },

  processingSection:{ gap: spacing[4], marginTop: spacing[2] },
  pasoCard:         { flexDirection: 'row', alignItems: 'center', gap: spacing[4], padding: spacing[4], backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, ...shadows.sm },
  pasoCardDone:     { backgroundColor: colors.secondaryFixed + '88' },
  pasoCardActive:   { backgroundColor: colors.primaryFixed, ...shadows.md },
  pasoIconBox:      { width: 44, height: 44, borderRadius: radii.full, backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  pasoIconDone:     { backgroundColor: colors.secondaryFixed },
  pasoIconActive:   { backgroundColor: colors.primaryFixed },
  pasoLabel:        { fontSize: fontSizes.base, fontWeight: '500', color: colors.onSurfaceVariant, flex: 1 },
  pasoLabelDone:    { color: colors.secondary, fontWeight: '700' },
  pasoLabelActive:  { color: colors.primary, fontWeight: '700' },

  resultCard:       { alignItems: 'center', borderRadius: radii['2xl'], padding: spacing[8], marginTop: spacing[4] },
  resultTitle:      { fontSize: fontSizes['3xl'], fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  doneBtn:          { height: 52, width: '100%', borderRadius: radii.full, justifyContent: 'center', alignItems: 'center', ...shadows.md },
  doneBtnTxt:       { color: 'white', fontSize: fontSizes.base, fontWeight: '700' },
});