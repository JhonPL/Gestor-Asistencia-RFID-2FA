import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';

import { colors, spacing, radii, fontSizes, shadows } from '../../constants/tokens';
import { Badge, BodyText } from '../../components/ui';

import { verificarAsistencia } from '../../src/api/asistencia';
import { getToken, getDeviceId } from '../../src/storage/auth';

// ── Coordenadas del campus UCC Villavicencio ──────────────────
const CAMPUS_LAT = 4.11607;
const CAMPUS_LNG = -73.60909;
const CAMPUS_RADIUS_METERS = 500;

const MAX_INTENTOS = 3;

// ── Helpers para formatear el método ──────────────────────────
function formatearMetodo(metodo) {
  const metodos = {
    fingerprint: 'Huella digital',
    face_id: 'Face ID',
    ubicacion: 'GPS',
  };
  return metodos[metodo] ?? metodo;
}

// ── Helpers para formatear el motivo del rechazo ──────────────
function formatearMotivo(tipoFallo) {
  const motivos = {
    biometria_fallida: 'Biometría no validada',
    gps_fuera: 'Ubicación fuera del campus',
    gps_error: 'GPS no disponible',
    servidor_error: 'Error de conexión',
  };
  return motivos[tipoFallo] ?? tipoFallo;
}

function getIconoMetodo(metodo) {
  const iconos = {
    fingerprint: 'finger-print',
    face_id: 'face-recognition',
    ubicacion: 'location',
  };
  return iconos[metodo] ?? 'help-circle';
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function obtenerUbicacion() {
  try {
    const permisoActual = await Location.getForegroundPermissionsAsync();

    if (permisoActual.status === 'denied' && permisoActual.canAskAgain === false) {
      return { error: 'permiso_bloqueado' };
    }

    let status = permisoActual.status;
    if (status !== 'granted') {
      const resultado = await Location.requestForegroundPermissionsAsync();
      status = resultado.status;
      if (status !== 'granted') return { error: 'permiso_denegado' };
    }

    let ubicacion = null;
    for (let i = 0; i < 3; i++) {
      try {
        ubicacion = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, maxAge: 0 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
        ]);
        break;
      } catch {
        if (i < 2) await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (!ubicacion) return { error: 'sin_señal' };

    const { latitude, longitude, accuracy } = ubicacion.coords;
    const distancia = calcularDistancia(latitude, longitude, CAMPUS_LAT, CAMPUS_LNG);
    const dentro = distancia <= CAMPUS_RADIUS_METERS;

    return { latitude, longitude, accuracy, dentro, distancia: Math.round(distancia), error: null };
  } catch (err) {
    return { error: err.message };
  }
}

async function detectarMetodo() {
  try {
    const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face_id';
    if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  } catch { /* ignorar */ }
  return Platform.OS === 'ios' ? 'face_id' : 'fingerprint';
}

// ── Configuración de pasos ────────────────────────────────────
const PASOS = [
  { id: 'biometria', iconPending: 'fingerprint',   iconOk: 'checkmark-circle', labelPending: 'Verificando identidad…',    labelOk: 'Identidad verificada' },
  { id: 'ubicacion', iconPending: 'location',       iconOk: 'checkmark-circle', labelPending: 'Obteniendo ubicación GPS…', labelOk: 'Dentro del campus UCC' },
  { id: 'servidor',  iconPending: 'cloud-upload',   iconOk: 'checkmark-done-circle', labelPending: 'Registrando asistencia…', labelOk: 'Asistencia confirmada' },
];

// ── Configuración de resultados por tipo ────────────────────────────────
const RESULTADO = {
  completado: {
    icon: 'checkmark-done-circle',
    color: colors.secondary,
    bg: colors.secondaryFixed,
    label: '¡Asistencia registrada!',
    desc: 'Tu presencia fue verificada correctamente con biometría y GPS.',
  },
  gps_fuera: {
    icon: 'location',
    color: colors.error,
    bg: colors.errorContainer,
    label: 'No estás en el campus',
    desc: 'Verificación rechazada. Tu ubicación actual está fuera del radio permitido (500 m). Debes estar físicamente en el campus UCC Villavicencio para registrar asistencia.',
  },
  gps_error: {
    icon: 'location-outline',
    color: colors.error,
    bg: colors.errorContainer,
    label: 'GPS no disponible',
    desc: 'No se pudo obtener tu ubicación — verificación rechazada. Activa el GPS, sale al exterior si estás en un edificio y vuelve a intentarlo.',
  },
  biometria_fallida: {
    icon: 'finger-print',
    color: colors.error,
    bg: colors.errorContainer,
    label: 'Identidad no verificada',
    desc: 'La verificación biométrica falló — acceso rechazado. Usa la huella dactilar o Face ID registrados en la configuración de tu dispositivo.',
  },
  servidor_error: {
    icon: 'cloud-offline-outline',
    color: colors.error,
    bg: colors.errorContainer,
    label: 'Error de conexión',
    desc: 'No se pudo registrar tu asistencia. Verifica tu conexión a internet e intenta de nuevo. Si el problema persiste, contacta a tu docente.',
  },
  bloqueado: {
    icon: 'lock-closed',
    color: colors.error,
    bg: colors.errorContainer,
    label: `${MAX_INTENTOS} intentos agotados`,
    desc: `Alcanzaste el límite de ${MAX_INTENTOS} intentos fallidos. Tu verificación ha sido bloqueada por seguridad. Muestra esta pantalla a tu docente para que registre tu asistencia manualmente desde el portal web.`,
  },
};

export default function AttendanceConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    asistencia_id, curso_codigo, curso_nombre,
    aula, hora_inicio, hora_fin, docente,
  } = useLocalSearchParams();

  // ── Validar que asistencia_id es válido ───────────────────
  useEffect(() => {
    if (!asistencia_id) {
      Alert.alert(
        'Error de sesión',
        'No se encontró el ID de asistencia. Vuelve al inicio e intenta de nuevo.',
        [{ text: 'Aceptar', onPress: () => router.replace('/screens/home') }],
      );
    }
  }, [asistencia_id, router]);

  // ── Estados principales ───────────────────────────────────
  const [fase,       setFase]       = useState('idle');      // idle | procesando | completado | fallido | bloqueado
  const [tipoFallo,  setTipoFallo]  = useState(null);        // clave de RESULTADO
  const [intentos,   setIntentos]   = useState(0);
  const [pasoActual, setPasoActual] = useState(-1);
  const [pasosOk,    setPasosOk]    = useState([]);
  const [metodoVerificacion, setMetodoVerificacion] = useState(null); // El método que se usó (fingerprint, face_id)

  // Ref para leer el valor actual de intentos dentro de async functions
  const intentosRef = useRef(0);

  // ── Registrar un intento fallido ──────────────────────────
  const registrarFallo = (tipo, metodo = null) => {
    intentosRef.current += 1;
    const nuevoTotal = intentosRef.current;
    setIntentos(nuevoTotal);
    setTipoFallo(tipo);
    if (metodo) setMetodoVerificacion(metodo);

    if (nuevoTotal >= MAX_INTENTOS) {
      setFase('bloqueado');
    } else {
      setFase('fallido');
    }
  };

  // ── Flujo principal de confirmación ───────────────────────
  const handleConfirm = async () => {
    if (intentosRef.current >= MAX_INTENTOS) return;

    setFase('procesando');
    setPasosOk([]);
    setPasoActual(-1);

    let metodo = 'desconocido'; // Inicializar para evitar undefined

    try {
      // ────────────────────────────────────────────────────────
      // PASO 0 — Biometría
      // ────────────────────────────────────────────────────────
      setPasoActual(0);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
      metodo = await detectarMetodo();
      let biometriaExitosa = false;

      if (!hasHardware || !isEnrolled) {
        // Sin sensor o sin biometría configurada — continuar sin ella
        // (el servidor marcará como fallido biométrico)
        Alert.alert(
          hasHardware ? 'Biometría no configurada' : 'Sin sensor biométrico',
          hasHardware
            ? 'Configura tu huella o Face ID en Ajustes del dispositivo para usar la verificación biométrica.'
            : 'Tu dispositivo no tiene sensor biométrico. Tu asistencia se registrará sin verificación biométrica.',
          [{ text: 'Continuar' }],
        );
      } else {
        const authOptions = {
          promptMessage: Platform.OS === 'ios'
            ? 'Usa Face ID para confirmar tu identidad'
            : 'Confirma tu identidad con huella o Face ID',
          disableDeviceFallback: false,
        };
        
        if (Platform.OS === 'ios') {
          authOptions.fallbackLabel = 'Usar PIN';
          authOptions.cancelLabel = 'Cancelar';
        }

        const resultado = await LocalAuthentication.authenticateAsync(authOptions);

        if (resultado.success) {
          biometriaExitosa = true;
        } else if (resultado.error === 'user_cancel') {
          // El usuario canceló — volver al inicio SIN contar como intento
          setFase('idle');
          setPasoActual(-1);
          return;
        } else if (resultado.error === 'lockout' || resultado.error === 'lockout_permanent') {
          Alert.alert(
            'Demasiados intentos biométricos',
            'Tu dispositivo bloqueó temporalmente la biometría por múltiples intentos fallidos. Espera unos minutos e intenta de nuevo.',
            [{ text: 'Entendido' }],
          );
          setFase('idle');
          setPasoActual(-1);
          return;
        } else {
          // Biometría falló (no canceló) — cuenta como intento
          // ── NOTIFICAR AL BACKEND EL FALLO BIOMÉTRICO ──
          try {
            const token = await getToken();
            const deviceId = await getDeviceId();
            if (token && deviceId && asistencia_id) {
              await verificarAsistencia({
                asistencia_id: Number(asistencia_id),
                dispositivo_movil_id: deviceId,
                metodo,
                exitoso: false,
                ubicacion_valida: false, // Ni siquiera se verificó, así que false
                latitud: 0,
                longitud: 0,
                motivo_rechazo: 'biometria_fallida',
              });
            }
          } catch { /* ignorar error de red */ }

          registrarFallo('biometria_fallida', metodo);
          return;
        }
      }

      setPasosOk((p) => [...p, 'biometria']);

      // ────────────────────────────────────────────────────────
      // PASO 1 — Ubicación GPS
      // ────────────────────────────────────────────────────────
      setPasoActual(1);

      const ubicacion = await obtenerUbicacion();

      // Permisos bloqueados permanentemente
      if (ubicacion.error === 'permiso_bloqueado') {
        Alert.alert(
          'Permiso de ubicación bloqueado',
          Platform.OS === 'android'
            ? 'Ve a Ajustes → Aplicaciones → SmartClass → Permisos → Ubicación y selecciona "Permitir todo el tiempo".'
            : 'Ve a Ajustes → Privacidad → Servicios de Ubicación → SmartClass y selecciona "Siempre".',
          [
            { text: 'Reintentar', onPress: () => { setFase('idle'); setPasoActual(-1); } },
            { text: 'Cancelar', style: 'cancel', onPress: () => { setFase('idle'); setPasoActual(-1); } },
          ],
        );
        return;
      }

      // Permiso denegado (puede volver a pedir)
      if (ubicacion.error === 'permiso_denegado') {
        Alert.alert(
          'Permiso de ubicación requerido',
          'Necesitamos acceso a tu GPS para verificar que estás dentro del campus UCC al registrar tu asistencia.',
          [
            { text: 'Reintentar', onPress: () => { setFase('idle'); setPasoActual(-1); } },
            { text: 'Cancelar', style: 'cancel', onPress: () => { setFase('idle'); setPasoActual(-1); } },
          ],
        );
        return;
      }

      // Sin señal GPS — no cuenta como intento, puede reintentar
      if (ubicacion.error === 'sin_señal' || ubicacion.error) {
        Alert.alert(
          'No se pudo obtener tu ubicación',
          'Verificación rechazada por fallo de GPS.\n\nPara continuar:\n• Activa el GPS en tu dispositivo\n• Sal al exterior si estás en un edificio (mejor señal de satélites)\n• Espera unos segundos y vuelve a intentarlo',
          [
            { text: 'Reintentar', onPress: () => { setFase('idle'); setPasoActual(-1); } },
            { text: 'Cancelar', style: 'cancel', onPress: () => { setFase('idle'); setPasoActual(-1); } },
          ],
        );
        return;
      }

      // Fuera del campus — sí cuenta como intento
      if (!ubicacion.dentro) {
        // Enviar al servidor que la verificación falló por ubicación
        try {
          const token    = await getToken();
          const deviceId = await getDeviceId();
          if (token && deviceId && asistencia_id) {
              await verificarAsistencia({
                asistencia_id: Number(asistencia_id),
                dispositivo_movil_id: deviceId,
                metodo,
                exitoso: biometriaExitosa,
                ubicacion_valida: false,
                latitud: ubicacion.latitude,
                longitud: ubicacion.longitude,
                motivo_rechazo: 'gps_fuera',
              });
          }
        } catch { /* ignorar error de red aquí */ }

        registrarFallo('gps_fuera', metodo);
        return;
      }

      setPasosOk((p) => [...p, 'ubicacion']);

      // ────────────────────────────────────────────────────────
      // PASO 2 — Registro en el servidor
      // ────────────────────────────────────────────────────────
      setPasoActual(2);

      const token    = await getToken();
      const deviceId = await getDeviceId();

      if (!asistencia_id || !deviceId) {
        Alert.alert(
          'Sesión inválida',
          'No se encontraron los datos de tu sesión. Vuelve al inicio e intenta de nuevo.',
          [{ text: 'Ir al inicio', onPress: () => router.replace('/screens/home') }],
        );
        setFase('idle');
        return;
      }

      // ── Validar que asistencia_id es un número válido ──────
      const asistenciaIdNum = parseInt(asistencia_id, 10);
      if (isNaN(asistenciaIdNum) || asistenciaIdNum <= 0) {
        throw new Error('asistencia_id inválido: ' + asistencia_id);
      }

      const respuesta = await verificarAsistencia({
        asistencia_id:        asistenciaIdNum,
        dispositivo_movil_id: deviceId,
        metodo,
        exitoso:              biometriaExitosa,
        ubicacion_valida:     true,
        latitud:              ubicacion.latitude,
        longitud:             ubicacion.longitude,
      });

      if (respuesta.estado_verificacion === 'verificado') {
        setPasosOk((p) => [...p, 'servidor']);
        setMetodoVerificacion(respuesta.metodo);
        await new Promise((r) => setTimeout(r, 400));
        setFase('completado');
      } else {
        // El servidor rechazó la verificación (biometría no válida en el registro)
        setMetodoVerificacion(respuesta.metodo);
        registrarFallo('biometria_fallida', respuesta.metodo);
      }
    } catch (err) {
      console.error('[attendance-confirm] Error en handleConfirm:', {
        mensaje: err.message,
        stack: err.stack,
        codigo: err.code,
      });
      await new Promise((r) => setTimeout(r, 300));
      // Error de red o servidor — mostrar mensaje de conexión
      setFase('fallido');
      setTipoFallo('servidor_error');
      setMetodoVerificacion(metodo); // siempre tiene un valor
    }
  };

  // ── Calcular info de resultado ────────────────────────────
  const infoResultado = fase === 'completado'
    ? RESULTADO.completado
    : fase === 'bloqueado'
      ? RESULTADO.bloqueado
      : tipoFallo
        ? RESULTADO[tipoFallo] ?? RESULTADO.servidor_error
        : null;

  const intentosRestantes = MAX_INTENTOS - intentos;
  const puedeReintentar   = fase === 'fallido' && intentosRestantes > 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={[
        s.container,
        { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[8] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Confirmar asistencia</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Datos del curso */}
      <View style={s.courseCard}>
        <Badge variant="default" style={{ marginBottom: spacing[3] }}>{curso_codigo}</Badge>
        <Text style={s.courseName}>{curso_nombre}</Text>
        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={s.metaTxt}>{aula}</Text>
          <Ionicons name="time-outline" size={13} color={colors.onSurfaceVariant} style={{ marginLeft: spacing[4] }} />
          <Text style={s.metaTxt}>{formatTime(hora_inicio)} – {formatTime(hora_fin)}</Text>
        </View>
        <View style={[s.metaRow, { marginTop: spacing[1] }]}>
          <Ionicons name="person-outline" size={13} color={colors.onSurfaceVariant} />
          <Text style={s.metaTxt}>{docente}</Text>
        </View>
      </View>

      {/* ── IDLE: Mostrar interfaz de confirmación ── */}
      {fase === 'idle' && (
        <View style={s.idleSection}>
          {/* Banner: Pendiente de verificación */}
          <View style={s.pendienteBanner}>
            <View style={s.statusHeader}>
              <Text style={s.statusLabel}>Pendiente</Text>
              <Ionicons name="timer-sand" size={20} color={colors.primary} />
            </View>
            <Text style={s.statusMessage}>Verifica tu presencia para completar el registro</Text>
          </View>

          {/* Contador de intentos (solo si ya hubo alguno) */}
          {intentos > 0 && (
            <View style={s.intentosBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.error} />
              <Text style={s.intentosTxt}>
                Intento{' '}
                <Text style={{ fontWeight: '800' }}>{intentos}</Text>
                {' '}de{' '}
                <Text style={{ fontWeight: '800' }}>{MAX_INTENTOS}</Text>
                {' '}— te queda{intentosRestantes === 1 ? '' : 'n'}{' '}
                <Text style={{ fontWeight: '800' }}>{intentosRestantes}</Text>{' '}
                intento{intentosRestantes === 1 ? '' : 's'}
              </Text>
            </View>
          )}

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
                {p.id === 'biometria'
                  ? 'Huella digital o Face ID'
                  : p.id === 'ubicacion'
                    ? 'Validación GPS · campus UCC (500 m)'
                    : 'Registro en el servidor SmartClass'}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <MaterialCommunityIcons name="fingerprint" size={22} color="white" />
            <Text style={s.confirmBtnTxt}>
              {intentos === 0 ? 'Confirmar ahora' : 'Intentar de nuevo'}
            </Text>
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
              <View
                key={paso.id}
                style={[s.pasoCard, done && s.pasoCardDone, current && s.pasoCardActive]}
              >
                <View style={[s.pasoIconBox, done && s.pasoIconDone, current && s.pasoIconActive]}>
                  {current && <ActivityIndicator color={colors.primary} size="small" />}
                  {done    && <Ionicons name={paso.iconOk}      size={22} color={colors.secondary} />}
                  {pending && <Ionicons name={paso.iconPending} size={22} color={colors.outline} />}
                </View>
                <Text style={[s.pasoLabel, done && s.pasoLabelDone, current && s.pasoLabelActive]}>
                  {done ? paso.labelOk : current ? paso.labelPending : paso.labelPending.replace('…', '')}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── RESULTADO: completado / fallido / bloqueado ── */}
      {(fase === 'completado' || fase === 'fallido' || fase === 'bloqueado') && infoResultado && (
        <View style={[s.resultCard, { backgroundColor: infoResultado.bg }]}>
          {/* Header: ESTADO / ICONO MÉTODO */}
          <View style={s.resultStatusRow}>
            <Text style={[s.resultStatus, { color: infoResultado.color }]}>
              {fase === 'completado' ? 'VERIFICADO' : fase === 'bloqueado' ? 'BLOQUEADO' : 'RECHAZADO'}
            </Text>
            <Text style={[s.resultStatusSeparator, { color: infoResultado.color }]}>  /  </Text>
            {metodoVerificacion && (
              <View style={s.resultMethodRow}>
                <MaterialCommunityIcons 
                  name={getIconoMetodo(metodoVerificacion)} 
                  size={20} 
                  color={infoResultado.color} 
                />
                <Text style={[s.resultMethodText, { color: infoResultado.color }]}>
                  {formatearMetodo(metodoVerificacion)}
                </Text>
              </View>
            )}
          </View>

          <Ionicons
            name={infoResultado.icon}
            size={64}
            color={infoResultado.color}
            style={{ marginTop: spacing[6], marginBottom: spacing[4] }}
          />
          <Text style={[s.resultTitle, { color: infoResultado.color }]}>
            {infoResultado.label}
          </Text>
          
          <BodyText muted style={{ textAlign: 'center', marginTop: spacing[2], marginBottom: spacing[4] }}>
            {infoResultado.desc}
          </BodyText>

          {/* Info extra para GPS fuera de campus */}
          {tipoFallo === 'gps_fuera' && (
            <View style={s.extraInfo}>
              <Ionicons name="navigate-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={s.extraInfoText}>
                El campus UCC Villavicencio está en:{'\n'}
                Av. Bello Horizonte — Villavicencio, Meta
              </Text>
            </View>
          )}

          {/* Contador si quedan intentos */}
          {puedeReintentar && (
            <View style={s.intentosInfo}>
              <Ionicons name="refresh-circle-outline" size={16} color={colors.primary} />
              <Text style={s.intentosInfoText}>
                Puedes reintentar{' '}
                <Text style={{ fontWeight: '800' }}>{intentosRestantes}</Text>
                {' '}vez{intentosRestantes === 1 ? '' : 'es'} más
              </Text>
            </View>
          )}

          {/* Botones de acción */}
          <View style={s.resultButtons}>
            {puedeReintentar && (
              <TouchableOpacity
                style={[s.retryResultBtn, { borderColor: infoResultado.color }]}
                onPress={() => { setFase('idle'); setPasoActual(-1); }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color={infoResultado.color} />
                <Text style={[s.retryResultBtnText, { color: infoResultado.color }]}>
                  Reintentar
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.doneBtn, { backgroundColor: infoResultado.color, flex: puedeReintentar ? 1 : undefined, width: puedeReintentar ? undefined : '100%' }]}
              onPress={() => router.replace('/screens/home')}
              activeOpacity={0.85}
            >
              <Text style={s.doneBtnTxt}>
                {fase === 'completado' ? 'Ir al inicio' : 'Volver al inicio'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instrucción de contacto cuando está bloqueado */}
          {fase === 'bloqueado' && (
            <View style={[s.extraInfo, { marginTop: spacing[3] }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.onSurfaceVariant} />
              <Text style={s.extraInfoText}>
                Muestra esta pantalla a tu docente. Él podrá registrar tu asistencia manualmente desde el portal web SmartClass.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ── Estilos ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { paddingHorizontal: spacing[6], flexGrow: 1 },

  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[6] },
  backBtn:      { width: 36, height: 36, borderRadius: radii.full, backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  topTitle:     { fontSize: fontSizes.base, fontWeight: '700', color: colors.onSurface },

  courseCard:   { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing[5], marginBottom: spacing[6], ...shadows.sm },
  courseName:   { fontSize: fontSizes.xl, fontWeight: '800', color: colors.primary, letterSpacing: -0.4, marginBottom: spacing[3] },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  metaTxt:      { fontSize: fontSizes.xs, color: colors.onSurfaceVariant },

  // Idle
  idleSection:  { alignItems: 'center' },
  pendienteBanner: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] },
  statusLabel: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.primary },
  statusMessage: { fontSize: fontSizes.sm, color: colors.primary, opacity: 0.8 },
  intentosBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.errorContainer, borderRadius: radii.lg,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    marginBottom: spacing[5], alignSelf: 'stretch',
  },
  intentosTxt:  { fontSize: fontSizes.sm, color: colors.error, flex: 1, lineHeight: 20 },
  bigIconBox:   { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryFixed, justifyContent: 'center', alignItems: 'center', marginBottom: spacing[5], ...shadows.md },
  idleTitle:    { fontSize: fontSizes['2xl'], fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing[4], alignSelf: 'stretch', marginBottom: spacing[3] },
  stepNum:      { width: 32, height: 32, borderRadius: radii.full, backgroundColor: colors.primaryFixed, justifyContent: 'center', alignItems: 'center' },
  stepNumTxt:   { fontSize: fontSizes.sm, fontWeight: '800', color: colors.primary },
  stepLabel:    { fontSize: fontSizes.sm, fontWeight: '600', color: colors.onSurface, flex: 1 },
  confirmBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], height: 56, width: '100%', backgroundColor: colors.primary, borderRadius: radii.full, marginTop: spacing[6], ...shadows.lg },
  confirmBtnTxt:{ color: 'white', fontSize: fontSizes.lg, fontWeight: '700' },

  // Procesando
  processingSection: { gap: spacing[4], marginTop: spacing[2] },
  pasoCard:     { flexDirection: 'row', alignItems: 'center', gap: spacing[4], padding: spacing[4], backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, ...shadows.sm },
  pasoCardDone: { backgroundColor: colors.secondaryFixed + '88' },
  pasoCardActive: { backgroundColor: colors.primaryFixed, ...shadows.md },
  pasoIconBox:  { width: 44, height: 44, borderRadius: radii.full, backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  pasoIconDone: { backgroundColor: colors.secondaryFixed },
  pasoIconActive: { backgroundColor: colors.primaryFixed },
  pasoLabel:    { fontSize: fontSizes.base, fontWeight: '500', color: colors.onSurfaceVariant, flex: 1 },
  pasoLabelDone: { color: colors.secondary, fontWeight: '700' },
  pasoLabelActive: { color: colors.primary, fontWeight: '700' },

  // Resultado
  resultCard:   { alignItems: 'center', borderRadius: radii['2xl'], padding: spacing[8], marginTop: spacing[4] },
  resultStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing[2], alignSelf: 'center' },
  resultStatus: { fontSize: fontSizes.lg, fontWeight: '900', letterSpacing: 1 },
  resultStatusSeparator: { fontSize: fontSizes.lg, fontWeight: '700', marginHorizontal: spacing[1] },
  resultMethodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  resultMethodText: { fontSize: fontSizes.lg, fontWeight: '700' },
  resultTitle:  { fontSize: fontSizes['3xl'], fontWeight: '800', letterSpacing: -0.8, textAlign: 'center', marginTop: spacing[2] },

  extraInfo:    {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: radii.lg,
    padding: spacing[3], marginTop: spacing[2], alignSelf: 'stretch',
  },
  extraInfoText: { fontSize: fontSizes.xs, color: colors.onSurfaceVariant, flex: 1, lineHeight: 18 },

  intentosInfo: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.primaryFixed, borderRadius: radii.lg,
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    marginTop: spacing[3],
  },
  intentosInfoText: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: '600' },

  resultButtons: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[6], width: '100%' },
  retryResultBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], height: 52, paddingHorizontal: spacing[4],
    borderRadius: radii.full, borderWidth: 2, flex: 1,
  },
  retryResultBtnText: { fontSize: fontSizes.base, fontWeight: '700' },
  doneBtn:      { height: 52, borderRadius: radii.full, justifyContent: 'center', alignItems: 'center', ...shadows.md },
  doneBtnTxt:   { color: 'white', fontSize: fontSizes.base, fontWeight: '700', paddingHorizontal: spacing[4] },
});