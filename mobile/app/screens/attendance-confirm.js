import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";

import {
  colors,
  spacing,
  radii,
  fontSizes,
  shadows,
} from "../../constants/tokens";
import { Badge, BodyText } from "../../components/ui";

import { verificarAsistencia } from "../../src/api/asistencia";
import { getToken, getDeviceId } from "../../src/storage/auth";

// ── Coordenadas fijas del campus para desarrollo ──────────────
const CAMPUS_LAT = -4.1429;
const CAMPUS_LNG = -73.6267;

// ── Helper: formatea 'HH:MM:SS' → '8:00 AM' ──────────────────
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ── Pasos del flujo (sin cambios) ─────────────────────────────
const PASOS = [
  {
    id: "biometria",
    iconPending: "fingerprint",
    iconOk: "checkmark-circle",
    labelPending: "Verificando biometría…",
    labelOk: "Biometría verificada",
  },
  {
    id: "ubicacion",
    iconPending: "location",
    iconOk: "checkmark-circle",
    labelPending: "Obteniendo ubicación GPS…",
    labelOk: "Dentro del campus UCC",
  },
  {
    id: "servidor",
    iconPending: "cloud-upload",
    iconOk: "checkmark-done-circle",
    labelPending: "Registrando asistencia…",
    labelOk: "Asistencia confirmada",
  },
];

const RESULTADO_CONFIG = {
  completado: {
    icon: "checkmark-done-circle",
    color: colors.secondary,
    bg: colors.secondaryFixed,
    label: "¡Asistencia registrada!",
    desc: "Tu presencia fue verificada correctamente.",
  },
  fallido: {
    icon: "close-circle",
    color: colors.error,
    bg: colors.errorContainer,
    label: "Verificación fallida",
    desc: "No se pudo validar. Contacta al docente si crees que es un error.",
  },
};

// ── Helper: determina el método según los tipos soportados ────
async function detectarMetodo() {
  try {
    const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (
      tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return "face_id";
    }
    if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
  } catch {
    // si falla la detección, inferir por plataforma
  }
  return Platform.OS === "ios" ? "face_id" : "fingerprint";
}

export default function AttendanceConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    asistencia_id,
    curso_codigo,
    curso_nombre,
    aula,
    hora_inicio,
    hora_fin,
    docente,
  } = useLocalSearchParams();

  const [fase, setFase] = useState("idle");
  const [pasoActual, setPasoAct] = useState(-1);
  const [pasosOk, setPasosOk] = useState([]);

  // ── handleConfirm con biometría real ─────────────────────────
  const handleConfirm = async () => {
    setFase("procesando");
    setPasosOk([]);

    try {
      // ── Paso 0: Biometría real ────────────────────────────────
      setPasoAct(0);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const metodo = await detectarMetodo();
      let biometriaExitosa = false;

      if (!hasHardware) {
        // Sin sensor biométrico — continuar con exitoso: false
        Alert.alert(
          "Sin sensor biométrico",
          "Tu dispositivo no tiene sensor biométrico. Tu asistencia quedará registrada pero sin verificación biométrica.",
          [{ text: "Entendido" }],
        );
      } else if (!isEnrolled) {
        // Tiene hardware pero sin biometría configurada
        Alert.alert(
          "Biometría no configurada",
          "No tienes huella dactilar o Face ID configurado en tu teléfono. Ve a Configuración del dispositivo para activarlo.",
          [{ text: "Entendido" }],
        );
      } else {
        // Tiene hardware y biometría enrolada → solicitar autenticación
        const resultado = await LocalAuthentication.authenticateAsync({
          promptMessage: "Confirma tu identidad para registrar asistencia",
          fallbackLabel: "Usar PIN del dispositivo",
          cancelLabel: "Cancelar",
          disableDeviceFallback: false,
        });

        if (resultado.success) {
          biometriaExitosa = true;
        } else if (resultado.error === "user_cancel") {
          // El estudiante canceló — volver al estado idle para reintentar
          setFase("idle");
          setPasoAct(-1);
          return;
        } else if (
          resultado.error === "lockout" ||
          resultado.error === "lockout_permanent"
        ) {
          Alert.alert(
            "Demasiados intentos",
            "Demasiados intentos fallidos. Espera un momento e intenta de nuevo.",
            [{ text: "Entendido" }],
          );
          setFase("idle");
          setPasoAct(-1);
          return;
        } else {
          // Otro error del sistema (system_cancel, not_available, etc.)
          Alert.alert(
            "Error de biometría",
            resultado.error ??
              "No se pudo completar la verificación biométrica.",
            [{ text: "Entendido" }],
          );
          // biometriaExitosa permanece false, el flujo continúa hacia el servidor
        }
      }

      setPasosOk((prev) => [...prev, "biometria"]);

      // ── Paso 1: GPS (coordenadas fijas del campus por ahora) ──
      setPasoAct(1);
      await new Promise((r) => setTimeout(r, 1000));
      const latitud = CAMPUS_LAT;
      const longitud = CAMPUS_LNG;
      setPasosOk((prev) => [...prev, "ubicacion"]);

      // ── Paso 2: Llamada real al servidor ─────────────────────
      setPasoAct(2);

      const token = await getToken();
      const deviceId = await getDeviceId();

      if (!asistencia_id || !deviceId) {
        throw new Error(
          "Faltan datos de sesión. Vuelve al inicio e intenta de nuevo.",
        );
      }

      const respuesta = await verificarAsistencia({
        asistencia_id: Number(asistencia_id),
        dispositivo_movil_id: deviceId,
        metodo,
        exitoso: biometriaExitosa,
        latitud,
        longitud,
      });

      if (respuesta.estado_verificacion === "completado") {
        setPasosOk((prev) => [...prev, "servidor"]);
      }

      await new Promise((r) => setTimeout(r, 400));
      setFase(
        respuesta.estado_verificacion === "completado"
          ? "completado"
          : "fallido",
      );
    } catch (err) {
      await new Promise((r) => setTimeout(r, 300));
      setFase("fallido");
      Alert.alert(
        "Error de verificación",
        err.message ?? "No se pudo conectar con el servidor.",
      );
    }
  };

  const resultado = RESULTADO_CONFIG[fase];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[
        s.container,
        {
          paddingTop: insets.top + spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        },
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
          {curso_codigo}
        </Badge>
        <Text style={s.courseName}>{curso_nombre}</Text>
        <View style={s.metaRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={colors.onSurfaceVariant}
          />
          <Text style={s.metaTxt}>{aula}</Text>
          <Ionicons
            name="time-outline"
            size={13}
            color={colors.onSurfaceVariant}
            style={{ marginLeft: spacing[4] }}
          />
          <Text style={s.metaTxt}>
            {formatTime(hora_inicio)} – {formatTime(hora_fin)}
          </Text>
        </View>
        <View style={[s.metaRow, { marginTop: spacing[1] }]}>
          <Ionicons
            name="person-outline"
            size={13}
            color={colors.onSurfaceVariant}
          />
          <Text style={s.metaTxt}>{docente}</Text>
        </View>
      </View>

      {/* ── IDLE ── */}
      {fase === "idle" && (
        <View style={s.idleSection}>
          <View style={s.bigIconBox}>
            <MaterialCommunityIcons
              name="fingerprint"
              size={68}
              color={colors.primary}
            />
          </View>
          <Text style={s.idleTitle}>Confirma tu presencia</Text>
          <BodyText
            muted
            style={{
              textAlign: "center",
              marginTop: spacing[2],
              marginBottom: spacing[6],
            }}
          >
            Se verificará tu biometría y tu ubicación dentro del campus UCC.
          </BodyText>

          {PASOS.map((p, i) => (
            <View key={p.id} style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumTxt}>{i + 1}</Text>
              </View>
              <Text style={s.stepLabel}>
                {p.id === "biometria"
                  ? "Huella digital o Face ID"
                  : p.id === "ubicacion"
                    ? "Validación GPS campus UCC"
                    : "Registro en el sistema"}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={s.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="fingerprint"
              size={22}
              color="white"
            />
            <Text style={s.confirmBtnTxt}>Confirmar ahora</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── PROCESANDO ── */}
      {fase === "procesando" && (
        <View style={s.processingSection}>
          {PASOS.map((paso, i) => {
            const done = pasosOk.includes(paso.id);
            const current = pasoActual === i && !done;
            const pending = i > pasoActual;
            return (
              <View
                key={paso.id}
                style={[
                  s.pasoCard,
                  done && s.pasoCardDone,
                  current && s.pasoCardActive,
                ]}
              >
                <View
                  style={[
                    s.pasoIconBox,
                    done && s.pasoIconDone,
                    current && s.pasoIconActive,
                  ]}
                >
                  {current && (
                    <ActivityIndicator color={colors.primary} size="small" />
                  )}
                  {done && (
                    <Ionicons
                      name={paso.iconOk}
                      size={22}
                      color={colors.secondary}
                    />
                  )}
                  {pending && (
                    <Ionicons
                      name={paso.iconPending}
                      size={22}
                      color={colors.outline}
                    />
                  )}
                </View>
                <Text
                  style={[
                    s.pasoLabel,
                    done && s.pasoLabelDone,
                    current && s.pasoLabelActive,
                  ]}
                >
                  {done
                    ? paso.labelOk
                    : current
                      ? paso.labelPending
                      : paso.labelPending.replace("…", "")}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── RESULTADO ── */}
      {(fase === "completado" || fase === "fallido") && resultado && (
        <View style={[s.resultCard, { backgroundColor: resultado.bg }]}>
          <Ionicons
            name={resultado.icon}
            size={64}
            color={resultado.color}
            style={{ marginBottom: spacing[4] }}
          />
          <Text style={[s.resultTitle, { color: resultado.color }]}>
            {resultado.label}
          </Text>
          <BodyText
            muted
            style={{
              textAlign: "center",
              marginTop: spacing[2],
              marginBottom: spacing[8],
            }}
          >
            {resultado.desc}
          </BodyText>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: resultado.color }]}
            onPress={() => router.replace("/screens/home")}
            activeOpacity={0.85}
          >
            <Text style={s.doneBtnTxt}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ── Estilos (sin cambios) ─────────────────────────────────────
const s = StyleSheet.create({
  container: { paddingHorizontal: spacing[6], flexGrow: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[6],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.onSurface,
  },

  courseCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
    ...shadows.sm,
  },
  courseName: {
    fontSize: fontSizes.xl,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.4,
    marginBottom: spacing[3],
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  metaTxt: { fontSize: fontSizes.xs, color: colors.onSurfaceVariant },

  idleSection: { alignItems: "center" },
  bigIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryFixed,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[5],
    ...shadows.md,
  },
  idleTitle: {
    fontSize: fontSizes["2xl"],
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    alignSelf: "stretch",
    marginBottom: spacing[3],
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.primaryFixed,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumTxt: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
  },
  stepLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.onSurface,
    flex: 1,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 56,
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    marginTop: spacing[6],
    ...shadows.lg,
  },
  confirmBtnTxt: { color: "white", fontSize: fontSizes.lg, fontWeight: "700" },

  processingSection: { gap: spacing[4], marginTop: spacing[2] },
  pasoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    ...shadows.sm,
  },
  pasoCardDone: { backgroundColor: colors.secondaryFixed + "88" },
  pasoCardActive: { backgroundColor: colors.primaryFixed, ...shadows.md },
  pasoIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  pasoIconDone: { backgroundColor: colors.secondaryFixed },
  pasoIconActive: { backgroundColor: colors.primaryFixed },
  pasoLabel: {
    fontSize: fontSizes.base,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  pasoLabelDone: { color: colors.secondary, fontWeight: "700" },
  pasoLabelActive: { color: colors.primary, fontWeight: "700" },

  resultCard: {
    alignItems: "center",
    borderRadius: radii["2xl"],
    padding: spacing[8],
    marginTop: spacing[4],
  },
  resultTitle: {
    fontSize: fontSizes["3xl"],
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  doneBtn: {
    height: 52,
    width: "100%",
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
  },
  doneBtnTxt: { color: "white", fontSize: fontSizes.base, fontWeight: "700" },
});
