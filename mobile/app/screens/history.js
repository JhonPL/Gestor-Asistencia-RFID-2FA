import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Card, BodyText, Label, Badge } from '../../components/ui';

// ── Capa de API y storage ─────────────────────────────────────
import { getHistorial }  from '../../src/api/asistencia';
import { getToken }      from '../../src/storage/auth';

/**
 * HistoryScreen — Tarea 7: datos reales desde la API.
 *
 * Cambios respecto a la versión con mocks:
 *   • useEffect carga el token del storage y llama a getHistorial().
 *   • MOCK_HISTORIAL → estado local `historial` (array mapeado)
 *   • MOCK_STATS     → estado local `stats`    (objeto mapeado)
 *   • Se manejan estados de carga y error.
 *
 * La UI (StyleSheet y estructura JSX) es idéntica al original.
 *
 * Mapeo necesario porque el backend devuelve campos flat/snake_case:
 *   curso_codigo     → item.curso.codigo
 *   curso_nombre     → item.curso.nombre
 *   fecha_formateada → item.fechaFormateada
 *   hora_registro    → item.horaRegistro
 *   estado_verificacion → item.estadoVerificacion
 *   dentro_campus    → item.dentroCampus
 *   tasa_asistencia  → stats.tasaAsistencia
 *
 * Nota: el backend puede responder con la clave "registros" o "historial"
 * según la versión. Se maneja con fallback: data.historial ?? data.registros.
 */

// ── Configuraciones de badges (sin cambios) ──────────────────
const VERIF_CONFIG = {
  verificado:  { icon: 'checkmark-circle', color: colors.secondary, label: 'Verificado' },
  registrado:  { icon: 'phone-portrait',   color: colors.primary,   label: 'Registrado' },
  pendiente:   { icon: 'time',             color: colors.primary,   label: 'Pendiente'  },
  rechazado:   { icon: 'close-circle',     color: colors.error,     label: 'Rechazado'  },
  sin_app:     { icon: 'phone-portrait',   color: colors.outline,   label: 'Sin app'    },
};

const METODO_ICON  = { fingerprint: 'finger-print', face_id: 'scan-circle', ubicacion: 'location' };
const ESTADO_BADGE = { Presente: 'success', Ausente: 'error', Justificado: 'warning' };

// ── Helper: normaliza un item del backend al shape que usa la UI ─
function mapItem(raw) {
  return {
    id:                raw.id,
    curso: {
      codigo: raw.curso_codigo ?? raw.curso?.codigo ?? '',
      nombre: raw.curso_nombre ?? raw.curso?.nombre ?? '',
    },
    fecha:             raw.fecha,
    fechaFormateada:   raw.fecha_formateada ?? raw.fechaFormateada ?? '',
    horaRegistro:      raw.hora_registro    ?? raw.horaRegistro    ?? null,
    estado:            raw.estado,
    estadoVerificacion: raw.estado_verificacion ?? raw.estadoVerificacion ?? 'sin_app',
    metodo:            raw.metodo ?? null,
    dentroCampus:      raw.dentro_campus      ?? raw.dentroCampus  ?? null,
    biometriaExitosa:  raw.biometria_exitosa  ?? raw.biometriaExitosa ?? null,
    motivo:            raw.motivo             ?? null,
  };
}

// ── Helper: normaliza el objeto stats del backend ─────────────
function mapStats(raw) {
  return {
    totalClases:     raw.total           ?? 0,
    presentes:       raw.presentes       ?? 0,
    ausentes:        raw.ausentes        ?? 0,
    justificados:    raw.justificados    ?? 0,
    tasaAsistencia:  raw.tasa_asistencia ?? raw.tasaAsistencia ?? 0,
  };
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Estado local ─────────────────────────────────────────────
  const [historial, setHistorial] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // ── Cargar datos al montar ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();

        if (!token) {
          router.replace('/screens/login');
          return;
        }

        const data = await getHistorial(token);

        if (!cancelled) {
          // El backend puede devolver la lista con clave "historial" o "registros"
          const rawList = data.historial ?? data.registros ?? [];
          setHistorial(rawList.map(mapItem));
          setStats(mapStats(data.stats ?? {}));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // ── Spinner ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={s.loadingTxt}>Cargando historial…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.outline} />
        <Text style={[s.loadingTxt, { color: colors.error, marginTop: spacing[3] }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[s.retryBtn]}
          onPress={() => { setError(null); setLoading(true); }}
        >
          <Text style={s.retryTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render principal (estructura idéntica al original) ────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[
        s.scroll,
        { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[10] },
      ]}
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
          <Text style={s.bigStatValue}>{stats?.tasaAsistencia ?? 0}%</Text>
          <Label style={{ color: colors.onPrimaryContainer }}>Tasa de asistencia</Label>
        </View>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.secondaryFixed }]}>
              {stats?.presentes ?? 0}
            </Text>
            <Label style={{ color: colors.onPrimaryContainer }}>Presentes</Label>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.errorContainer }]}>
              {stats?.ausentes ?? 0}
            </Text>
            <Label style={{ color: colors.onPrimaryContainer }}>Ausentes</Label>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.tertiaryFixed }]}>
              {stats?.justificados ?? 0}
            </Text>
            <Label style={{ color: colors.onPrimaryContainer }}>Justificados</Label>
          </View>
        </View>

        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: `${stats?.tasaAsistencia ?? 0}%` }]} />
        </View>
      </View>

      {/* Lista vacía */}
      {historial.length === 0 && (
        <View style={s.emptyBox}>
          <Ionicons name="time-outline" size={40} color={colors.outline} />
          <BodyText muted style={{ marginTop: spacing[3], textAlign: 'center' }}>
            Aún no tienes sesiones en tu historial.{'\n'}
            Aparecerán aquí cuando el docente cierre una clase.
          </BodyText>
        </View>
      )}

      {/* Lista de sesiones */}
      {historial.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Sesiones registradas</Text>

          {historial.map(item => {
            const verif   = VERIF_CONFIG[item.estadoVerificacion] ?? VERIF_CONFIG.pendiente;
            const metIcon = METODO_ICON[item.metodo];
            return (
              <Card key={item.id} style={{ marginBottom: spacing[3] }}>
                {/* Top: curso + badge estado */}
                <View style={s.sessionTop}>
                  <View style={{ flex: 1, marginRight: spacing[3] }}>
                    <Badge variant="default" style={{ marginBottom: spacing[2] }}>
                      {item.curso.codigo}
                    </Badge>
                    <Text style={s.sessionCourse}>{item.curso.nombre}</Text>
                    <Text style={s.sessionDate}>{item.fechaFormateada}</Text>
                  </View>
                  <Badge variant={ESTADO_BADGE[item.estado] ?? 'default'}>
                    {item.estado}
                  </Badge>
                </View>

                {/* Chips de detalles */}
                <View style={s.chips}>
                  {item.horaRegistro && (
                    <View style={s.chip}>
                      <Ionicons name="time-outline" size={11} color={colors.onSurfaceVariant} />
                      <Text style={s.chipTxt}>{item.horaRegistro}</Text>
                    </View>
                  )}
                  {item.metodo && item.biometriaExitosa !== null && (
                    <View style={s.chip}>
                      <Ionicons 
                        name={item.biometriaExitosa ? metIcon : 'warning'} 
                        size={11} 
                        color={item.biometriaExitosa ? colors.secondary : colors.error} 
                      />
                      <Text style={[
                        s.chipTxt, 
                        { color: item.biometriaExitosa ? colors.secondary : colors.error }
                      ]}>
                        {item.biometriaExitosa ? item.metodo?.replace('_', ' ') : 'Fallo biométrico'}
                      </Text>
                    </View>
                  )}
                  {item.dentroCampus !== null && (
                    <View style={s.chip}>
                      <Ionicons
                        name={item.dentroCampus ? 'location' : 'location-outline'}
                        size={11}
                        color={item.dentroCampus ? colors.secondary : colors.error}
                      />
                      <Text style={[
                        s.chipTxt,
                        { color: item.dentroCampus ? colors.secondary : colors.error },
                      ]}>
                        {item.dentroCampus ? 'En campus' : 'Fuera de rango GPS'}
                      </Text>
                    </View>
                  )}
                  {item.estadoVerificacion === 'rechazado' && !item.metodo && (
                    <View style={s.chip}>
                      <Ionicons name="help-circle-outline" size={11} color={colors.error} />
                      <Text style={[s.chipTxt, { color: colors.error }]}>No verificó en app</Text>
                    </View>
                  )}
                  <View style={s.chip}>
                    <Ionicons name={verif.icon} size={11} color={verif.color} />
                    <Text style={[s.chipTxt, { color: verif.color }]}>{verif.label}</Text>
                  </View>
                </View>

                {/* Motivo (opcional) */}
                {item.motivo && (
                  <View style={s.motivoRow}>
                    <Ionicons name="document-text-outline" size={12} color={colors.outline} />
                    <Text style={s.motivoTxt}>"{item.motivo}"</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

// ── Estilos (idénticos al original + loadingContainer, emptyBox, retryBtn) ──
const s = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  loadingTxt:       { marginTop: spacing[3], fontSize: fontSizes.sm, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing[6] },
  retryBtn:         { marginTop: spacing[5], paddingHorizontal: spacing[6], paddingVertical: spacing[3], backgroundColor: colors.primary, borderRadius: radii.full },
  retryTxt:         { color: 'white', fontWeight: '700', fontSize: fontSizes.base },

  scroll:           { paddingHorizontal: spacing[6] },
  topBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[6] },
  backBtn:          { width: 36, height: 36, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  topTitle:         { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface },

  statsCard:        { backgroundColor: colors.primaryContainer, borderRadius: radii['2xl'], padding: spacing[6], marginBottom: spacing[6] },
  bigStat:          { alignItems: 'center', marginBottom: spacing[5] },
  bigStatValue:     { fontSize: fontSizes['4xl'], fontWeight: '800', color: 'white', letterSpacing: -1 },
  statsRow:         { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing[5] },
  statItem:         { alignItems: 'center' },
  statValue:        { fontSize: fontSizes['2xl'], fontWeight: '800' },
  statDiv:          { width: 1, backgroundColor: 'rgba(255,255,255,.2)' },
  progressTrack:    { height: 6, backgroundColor: 'rgba(255,255,255,.2)', borderRadius: radii.full, overflow: 'hidden' },
  progressBar:      { height: '100%', backgroundColor: colors.secondaryFixed, borderRadius: radii.full },

  emptyBox:         { alignItems: 'center', paddingVertical: spacing[10], backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, marginBottom: spacing[4] },
  sectionTitle:     { fontSize: fontSizes.xl, fontWeight: '800', color: colors.primary, letterSpacing: -0.4, marginBottom: spacing[4] },
  sessionTop:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[3] },
  sessionCourse:    { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface, lineHeight: fontSizes.base * 1.3 },
  sessionDate:      { fontSize: fontSizes.xs, color: colors.onSurfaceVariant, marginTop: spacing[1] },
  chips:            { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.surfaceContainerLow, borderRadius: radii.full, paddingHorizontal: spacing[2], paddingVertical: 3 },
  chipTxt:          { fontSize: fontSizes.xs, color: colors.onSurfaceVariant, fontWeight: '500', textTransform: 'capitalize' },
  motivoRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.outlineVariant + '26' },
  motivoTxt:        { fontSize: fontSizes.xs, color: colors.outline, fontStyle: 'italic' },
});