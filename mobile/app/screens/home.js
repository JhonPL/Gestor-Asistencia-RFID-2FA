import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  colors,
  spacing,
  radii,
  fontSizes,
  shadows,
} from "../../constants/tokens";
import { Badge, Card, BodyText, Label } from "../../components/ui";

// ── Capa de API y storage ─────────────────────────────────────
import { getSesionActiva, getClasesHoy } from "../../src/api/sesiones";
import { getToken, getUser } from "../../src/storage/auth";
import { clearAuth } from '../../src/storage/auth';


// ── Helper: formatea 'HH:MM:SS' → '8:00 AM' ──────────────────
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ── Helper: obtiene las iniciales de nombre + apellido ─────────
function getIniciales(nombre = "", apellido = "") {
  return `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();
}

// ── Config de estados (sin cambios) ──────────────────────────
const STATUS_CONFIG = {
  sin_clase: {
    icon: "calendar-blank-outline",
    color: colors.outline,
    bg: colors.surfaceContainerLow,
    label: "Sin clase activa",
    desc: "No hay sesiones activas ahora.",
    showBtn: false,
  },
  pendiente: {
    icon: "timer-sand",
    color: colors.primary,
    bg: colors.primaryFixed,
    label: "Asistencia pendiente",
    desc: "Pasa tu tarjeta RFID y confirma desde la app.",
    showBtn: true,
  },
  completado: {
    icon: "check-circle-outline",
    color: colors.secondary,
    bg: colors.secondaryFixed,
    label: "Asistencia confirmada ✓",
    desc: "Tu biometría y ubicación fueron validadas.",
    showBtn: false,
  },
  fallido: {
    icon: "alert-circle-outline",
    color: colors.error,
    bg: colors.errorContainer,
    label: "Verificación fallida",
    desc: "Biometría o ubicación incorrectas.",
    showBtn: false,
  },
};

const CLASE_BADGE = {
  completado: { label: "Confirmada", variant: "success" },
  pendiente: { label: "Pendiente", variant: "default" },
  sin_registrar: { label: "Sin clase", variant: "warning" },
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Estado local ─────────────────────────────────────────────
  const [student, setStudent] = useState(null);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [clasesDelDia, setClasesDelDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            router.replace('/screens/login');
          },
        },
      ]
    );
  };

  // ── Cargar datos al montar ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Recuperar sesión guardada (no hace fetch al backend)
        const [token, savedUser] = await Promise.all([getToken(), getUser()]);

        if (!token || !savedUser) {
          // No hay sesión — redirigir al login
          router.replace("/screens/login");
          return;
        }

        if (!cancelled) {
          setStudent({
            nombre: savedUser.nombre,
            apellido: savedUser.apellido,
            iniciales: getIniciales(savedUser.nombre, savedUser.apellido),
            correo: savedUser.correo,
            // programa no viene en el JWT; se muestra el rol como fallback
            programa: savedUser.programa ?? savedUser.rol ?? "",
          });
        }

        // 2. Obtener sesión activa del día desde el backend
        const [sesion, clases] = await Promise.all([
          getSesionActiva(token),
          getClasesHoy(token),
        ]);

        if (!cancelled) {
          setSesionActiva(sesion);
          setClasesDelDia(Array.isArray(clases) ? clases : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          // Si el token expiró, mostrar estado sin_clase en lugar de bloquear
          setSesionActiva({ estado: "sin_clase" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Valores derivados ─────────────────────────────────────────
  const estadoActual = sesionActiva?.estado ?? "sin_clase";
  const status = STATUS_CONFIG[estadoActual] ?? STATUS_CONFIG.sin_clase;

  // Adaptar la respuesta de la API al shape que usa la UI
  const sesionParaUI =
    sesionActiva && estadoActual !== "sin_clase"
      ? {
          estado: sesionActiva.estado,
          curso: {
            codigo: sesionActiva.curso?.codigo ?? "",
            nombre: sesionActiva.curso?.nombre ?? "",
          },
          aula: sesionActiva.aula ?? "",
          horaInicio: formatTime(sesionActiva.hora_inicio),
          horaFin: formatTime(sesionActiva.hora_fin),
          docente: sesionActiva.docente ?? "",
        }
      : null;

  // Clases de hoy: mapear desde clasesDelDia del backend
  const clasesHoy = (clasesDelDia || []).map((clase) => {
    // Determinar el estado de la clase
    let estado = "sin_registrar";
    if (clase.estado_verificacion === "completado") {
      estado = "completado";
    } else if (clase.estado_verificacion === "pendiente") {
      estado = "pendiente";
    }

    return {
      id: clase.sesion_id,
      codigo: clase.curso.codigo,
      nombre: clase.curso.nombre,
      aula: clase.aula,
      horaInicio: formatTime(clase.hora_inicio),
      horaFin: formatTime(clase.hora_fin),
      estado: estado,
    };
  });

  // ── Spinner mientras carga ────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={s.loadingTxt}>Cargando…</Text>
      </View>
    );
  }

  // ── Render principal (estructura idéntica al original) ────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[
        s.scroll,
        {
          paddingTop: insets.top + spacing[4],
          paddingBottom: insets.bottom + spacing[10],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Label>Bienvenido de nuevo</Label>
          <Text style={s.greeting}>
            {student?.nombre ?? ''} {student?.apellido ?? ''}
          </Text>
          <BodyText muted style={{ fontSize: fontSizes.sm, marginTop: 2 }}>
            {student?.programa ?? ''}
          </BodyText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{student?.iniciales ?? '?'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View> 

      {/* Card de estado de sesión */}
      <View style={[s.statusCard, { backgroundColor: status.bg }]}>
        <View style={s.statusTop}>
          <MaterialCommunityIcons
            name={status.icon}
            size={40}
            color={status.color}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: status.color }]}>
              {status.label}
            </Text>
            <BodyText muted style={{ fontSize: fontSizes.sm, marginTop: 2 }}>
              {status.desc}
            </BodyText>
          </View>
        </View>

        {/* Detalles de la sesión */}
        {sesionParaUI && (
          <View style={s.sessionDetails}>
            <View style={s.detailRow}>
              <Ionicons
                name="book-outline"
                size={13}
                color={colors.onSurfaceVariant}
              />
              <Text style={s.detailTxt}>{sesionParaUI.curso.nombre}</Text>
            </View>
            <View style={s.detailRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color={colors.onSurfaceVariant}
              />
              <Text style={s.detailTxt}>
                {sesionParaUI.aula} · {sesionParaUI.horaInicio}
              </Text>
            </View>
            <View style={s.detailRow}>
              <Ionicons
                name="person-outline"
                size={13}
                color={colors.onSurfaceVariant}
              />
              <Text style={s.detailTxt}>{sesionParaUI.docente}</Text>
            </View>
          </View>
        )}

        {/* Botón confirmar — pasa asistencia_id como param */}
        {status.showBtn && (
          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: status.color }]}
            onPress={() =>
              router.push({
                pathname: "/screens/attendance-confirm",
                params: {
                  asistencia_id: sesionActiva?.asistencia_id,
                  curso_codigo: sesionActiva?.curso?.codigo ?? "",
                  curso_nombre: sesionActiva?.curso?.nombre ?? "",
                  aula: sesionActiva?.aula ?? "",
                  hora_inicio: sesionActiva?.hora_inicio ?? "",
                  hora_fin: sesionActiva?.hora_fin ?? "",
                  docente: sesionActiva?.docente ?? "",
                },
              })
            }
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="fingerprint"
              size={22}
              color="white"
            />
            <Text style={s.confirmBtnTxt}>Confirmar asistencia</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Clases de hoy */}
      <Text style={s.sectionTitle}>Clases de hoy</Text>

      {clasesHoy.length === 0 ? (
        <View style={s.emptyClases}>
          <Ionicons name="calendar-outline" size={32} color={colors.outline} />
          <BodyText
            muted
            style={{ marginTop: spacing[2], textAlign: "center" }}
          >
            No hay sesiones activas registradas hoy.
          </BodyText>
        </View>
      ) : (
        clasesHoy.map((curso) => {
          const badge = CLASE_BADGE[curso.estado] ?? CLASE_BADGE.sin_registrar;
          return (
            <Card key={curso.id} style={{ marginBottom: spacing[3] }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, marginRight: spacing[3] }}>
                  <Badge variant="default" style={{ marginBottom: spacing[2] }}>
                    {curso.codigo}
                  </Badge>
                  <Text style={s.courseName}>{curso.nombre}</Text>
                  <View style={s.courseMeta}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={colors.onSurfaceVariant}
                    />
                    <Text style={s.metaTxt}>{curso.aula}</Text>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={colors.onSurfaceVariant}
                      style={{ marginLeft: spacing[3] }}
                    />
                    <Text style={s.metaTxt}>
                      {curso.horaInicio} – {curso.horaFin}
                    </Text>
                  </View>
                </View>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </View>
            </Card>
          );
        })
      )}

      {/* Acceso al historial */}
      <TouchableOpacity
        style={s.histBtn}
        onPress={() => router.push("/screens/history")}
        activeOpacity={0.8}
      >
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text style={s.histBtnTxt}>Ver mi historial de asistencia</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Estilos (idénticos al original + loadingContainer) ─────────
const s = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  loadingTxt: {
    marginTop: spacing[3],
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
  },

  scroll: { paddingHorizontal: spacing[6] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[6],
  },
  greeting: {
    fontSize: fontSizes["2xl"],
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
    marginTop: spacing[1],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primaryFixedDim,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
  },

  statusCard: {
    borderRadius: radii["2xl"],
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  statusTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  statusLabel: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sessionDetails: {
    backgroundColor: "rgba(255,255,255,.55)",
    borderRadius: radii.lg,
    padding: spacing[3],
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  detailTxt: {
    fontSize: fontSizes.sm,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 52,
    borderRadius: radii.xl,
    ...shadows.md,
  },
  confirmBtnTxt: {
    color: "white",
    fontWeight: "700",
    fontSize: fontSizes.base,
  },

  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.4,
    marginBottom: spacing[4],
  },
  emptyClases: {
    alignItems: "center",
    paddingVertical: spacing[8],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    marginBottom: spacing[4],
  },
  courseName: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: spacing[2],
  },
  courseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    flexWrap: "wrap",
  },
  metaTxt: { fontSize: fontSizes.xs, color: colors.onSurfaceVariant },

  histBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    ...shadows.sm,
    marginTop: spacing[2],
  },
  histBtnTxt: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.primary,
  },
  logoutBtn: {
  width: 36,
  height: 36,
  borderRadius: radii.full,
  backgroundColor: colors.errorContainer,
  justifyContent: 'center',
  alignItems: 'center',
},
});
