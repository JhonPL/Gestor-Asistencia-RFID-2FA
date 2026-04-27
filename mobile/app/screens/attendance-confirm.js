import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Badge, BodyText } from '../../components/ui';

// ── Capa de API y storage ─────────────────────────────────────
import { verificarAsistencia } from '../../src/api/asistencia';
import { getDeviceId }         from '../../src/storage/auth';

// ── Sesión activa (solo para mostrar info del curso en la card) ─
import { MOCK_SESION_ACTIVA } from '../../mocks';

/**
 * AttendanceConfirmScreen — Tarea 6: verificación real con el backend.
 *
 * Cambios respecto a la versión con mocks:
 *   • Lee asistencia_id de los params de navegación (pasado desde home.js).
 *   • El último paso ('servidor') llama a verificarAsistencia() en lugar
 *     de solo hacer un setTimeout.
 *   • El estado final (completado / fallido) viene de la respuesta del servidor.
 *
 * Coordenadas del campus UCC Villavicencio: -4.142900, -73.626700
 * (en producción se obtendrán con expo-location; aquí son fijas para dev).
 *
 * La UI (StyleSheet y estructura JSX) es idéntica al original.
 */

// ── Coordenadas fijas del campus para desarrollo ──────────────
const CAMPUS_LAT = -4.142900;
const CAMPUS_LNG = -73.626700;

// ── Pasos del flujo (sin cambios) ─────────────────────────────
const PASOS = [
  {
    id: 'biometria',
    iconPending: 'fingerprint',
    iconOk: 'checkmark-circle',
    labelPending: 'Verificando biometría…',
    labelOk: 'Biometría verificada',
  },
  {
    id: 'ubicacion',
    iconPending: 'location',
    iconOk: 'checkmark-circle',
    labelPending: 'Obteniendo ubicación GPS…',
    labelOk: 'Dentro del campus UCC',
  },
  {
    id: 'servidor',
    iconPending: 'cloud-upload',
    iconOk: 'checkmark-done-circle',
    labelPending: 'Registrando asistencia…',
    labelOk: 'Asistencia confirmada',
  },
];

const RESULTADO_CONFIG = {
  completado: {
    icon: 'checkmark-done-circle',
    color: colors.secondary,
    bg: colors.secondaryFixed,
    label: '¡Asistencia registrada!',
    desc: 'Tu presencia fue verificada correctamente.',
  },
  fallido: {
    icon: 'close-circle',
    color: colors.error,
    bg: colors.errorContainer,
    label: 'Verificación fallida',
    desc: 'No se pudo validar. Contacta al docente si crees que es un error.',
  },
};

export default function AttendanceConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Leer asistencia_id enviado desde home.js ─────────────────
  const { asistencia_id } = useLocalSearchParams();

  const [fase,       setFase]    = useState('idle');   // idle | procesando | completado | fallido
  const [pasoActual, setPasoAct] = useState(-1);
  const [pasosOk,    setPasosOk] = useState([]);

  /**
   * handleConfirm — reemplaza el flujo simulado con delays puros.
   *
   * Pasos 1 y 2 (biometría y GPS) siguen siendo simulados con delays
   * porque expo-local-authentication y expo-location aún no están
   * configurados; se integran en la siguiente iteración.
   *
   * Paso 3 (servidor): llama a verificarAsistencia() con datos reales.
   */
  const handleConfirm = async () => {
    setFase('procesando');
    setPasosOk([]);

    try {
      // ── Paso 0: Biometría (simulado) ──────────────────────────
      setPasoAct(0);
      await new Promise(r => setTimeout(r, 1200));
      // En producción: resultado de expo-local-authentication
      const biometriaExitosa = true;
      setPasosOk(prev => [...prev, 'biometria']);

      // ── Paso 1: GPS (simulado con coords del campus) ──────────
      setPasoAct(1);
      await new Promise(r => setTimeout(r, 1400));
      // En producción: expo-location.getCurrentPositionAsync()
      const latitud  = CAMPUS_LAT;
      const longitud = CAMPUS_LNG;
      setPasosOk(prev => [...prev, 'ubicacion']);

      // ── Paso 2: Llamada real al servidor ─────────────────────
      setPasoAct(2);

      const dispositivoId = await getDeviceId();

      if (!asistencia_id || !dispositivoId) {
        // Faltan datos mínimos — informar y marcar como fallido
        throw new Error('Faltan datos de sesión. Vuelve al inicio e intenta de nuevo.');
      }

      // Método de verificación según plataforma
      const metodo = Platform.OS === 'ios' ? 'face_id' : 'fingerprint';

      const respuesta = await verificarAsistencia({
        asistencia_id:      Number(asistencia_id),
        dispositivo_movil_id: dispositivoId,
        metodo,
        exitoso:  biometriaExitosa,
        latitud,
        longitud,
      });

      // Marcar paso final como OK solo si el servidor confirmó
      if (respuesta.estado_verificacion === 'completado') {
        setPasosOk(prev => [...prev, 'servidor']);
      }

      await new Promise(r => setTimeout(r, 500));

      // El estado final lo decide el backend (completado o fallido)
      setFase(respuesta.estado_verificacion === 'completado' ? 'completado' : 'fallido');

    } catch (err) {
      // Error de red u otro inesperado
      await new Promise(r => setTimeout(r, 300));
      setFase('fallido');
      Alert.alert(
        'Error de verificación',
        err.message ?? 'No se pudo conectar con el servidor.',
      );
    }
  };

  const resultado = RESULTADO_CONFIG[fase];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[
        s.container,
        { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[8] },
      ]}
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
        <Badge variant="default" style={{ marginBottom: spacing[3] }}>
          {MOCK_SESION_ACTIVA.curso.codigo}
        </Badge>
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
              <View style={s.stepNum}>
                <Text style={s.stepNumTxt}>{i + 1}</Text>
              </View>
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
                  {current && <ActivityIndicator color={colors.primary} size="small" />}
                  {done    && <Ionicons name={paso.iconOk}      size={22} color={colors.secondary} />}
                  {pending && <Ionicons name={paso.iconPending} size={22} color={colors.outline} />}
                </View>
                <Text style={[s.pasoLabel, done && s.pasoLabelDone, current && s.pasoLabelActive]}>
                  {done    ? paso.labelOk :
                   current ? paso.labelPending :
                   paso.labelPending.replace('…', '')}
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

// ── Estilos (idénticos al original) ──────────────────────────
const s = StyleSheet.create({
  container:         { paddingHorizontal: spacing[6], flexGrow: 1 },
  topBar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[6] },
  backBtn:           { width: 36, height: 36, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  topTitle:          { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface },

  courseCard:        { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing[5], marginBottom: spacing[6], ...shadows.sm },
  courseName:        { fontSize: fontSizes.xl, fontWeight: '800', color: colors.primary, letterSpacing: -0.4, marginBottom: spacing[3] },
  metaRow:           { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  metaTxt:           { fontSize: fontSizes.xs, color: colors.onSurfaceVariant },

  idleSection:       { alignItems: 'center' },
  bigIconBox:        { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryFixed, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[5], ...shadows.md },
  idleTitle:         { fontSize: fontSizes['2xl'], fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  stepRow:           { flexDirection: 'row', alignItems: 'center', gap: spacing[4], alignSelf: 'stretch', marginBottom: spacing[3] },
  stepNum:           { width: 32, height: 32, borderRadius: radii.full, backgroundColor: colors.primaryFixed, justifyContent: 'center', alignItems: 'center' },
  stepNumTxt:        { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primary },
  stepLabel:         { fontSize: fontSizes.sm, fontWeight: '600', color: colors.onSurface, flex: 1 },
  confirmBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], height: 56, width: '100%', backgroundColor: colors.primary, borderRadius: radii.full, marginTop: spacing[6], ...shadows.lg },
  confirmBtnTxt:     { color: 'white', fontSize: fontSizes.lg, fontWeight: '700' },

  processingSection: { gap: spacing[4], marginTop: spacing[2] },
  pasoCard:          { flexDirection: 'row', alignItems: 'center', gap: spacing[4], padding: spacing[4], backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, ...shadows.sm },
  pasoCardDone:      { backgroundColor: colors.secondaryFixed + '88' },
  pasoCardActive:    { backgroundColor: colors.primaryFixed, ...shadows.md },
  pasoIconBox:       { width: 44, height: 44, borderRadius: radii.full, backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  pasoIconDone:      { backgroundColor: colors.secondaryFixed },
  pasoIconActive:    { backgroundColor: colors.primaryFixed },
  pasoLabel:         { fontSize: fontSizes.base, fontWeight: '500', color: colors.onSurfaceVariant, flex: 1 },
  pasoLabelDone:     { color: colors.secondary, fontWeight: '700' },
  pasoLabelActive:   { color: colors.primary, fontWeight: '700' },

  resultCard:        { alignItems: 'center', borderRadius: radii['2xl'], padding: spacing[8], marginTop: spacing[4] },
  resultTitle:       { fontSize: fontSizes['3xl'], fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  doneBtn:           { height: 52, width: '100%', borderRadius: radii.full, justifyContent: 'center', alignItems: 'center', ...shadows.md },
  doneBtnTxt:        { color: 'white', fontSize: fontSizes.base, fontWeight: '700' },
});