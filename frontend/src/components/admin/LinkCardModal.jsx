// frontend/src/components/admin/LinkCardModal.jsx
// Vincula una tarjeta RFID a una persona mediante lectura real del ESP32.
//
// Flujo:
//   1. Admin selecciona el dispositivo ESP32 a usar.
//   2. Pulsa "Iniciar escaneo" → el modal hace polling cada 2 s a
//      GET /api/rfid/ultimo-scan/:codigoDispositivo
//   3. En el ESP32 se escribe LECTURA en Serial Monitor y se acerca la tarjeta.
//   4. El backend recibe el UID de POST /api/rfid/scan-admin y lo guarda 30 s.
//   5. El polling lo detecta, rellena el campo automáticamente y para.
//   6. El admin confirma con "Vincular tarjeta".

import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { FormGroup, Label, Input, Select, FormActions, HelperText } from '../ui/FormElements';
import { getUltimoScan } from '../../api/rfidApi';
import theme from '../../styles/theme';

// ── Animaciones ───────────────────────────────────────────────
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:.35}`;

// ── Styled ────────────────────────────────────────────────────
const ScanArea = styled.div`
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem; padding: 1.25rem;
  border-radius: ${theme.radii.xl};
  background-color: ${({ $scanning }) =>
    $scanning ? theme.colors.primaryFixed : theme.colors.surfaceContainerLow};
  border: 2px dashed ${({ $scanning }) =>
    $scanning ? theme.colors.primary : theme.colors.outlineVariant};
  transition: all ${theme.transitions.base}; margin-bottom: 1rem;
`;

const ScanIcon = styled.div`
  width: 4rem; height: 4rem; border-radius: ${theme.radii.full};
  background-color: ${({ $scanning }) =>
    $scanning ? theme.colors.primary : theme.colors.primaryFixed};
  color: ${({ $scanning }) => $scanning ? 'white' : theme.colors.primary};
  display: flex; align-items: center; justify-content: center;
  animation: ${({ $scanning }) => $scanning ? pulse : 'none'} 1.2s ease infinite;
  transition: all ${theme.transitions.base};
`;

const ScanLabel = styled.p`
  font-size: ${theme.fontSizes.sm}; font-weight: ${theme.fontWeights.semibold};
  color: ${({ $scanning }) => $scanning ? theme.colors.primary : theme.colors.onSurfaceVariant};
  text-align: center;
`;

const ScanSubLabel = styled.p`
  font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline};
  text-align: center;
`;

const PersonInfo = styled.div`
  padding: 0.75rem; background-color: ${theme.colors.secondaryFixed};
  border-radius: ${theme.radii.lg}; margin-bottom: 1rem;
  font-size: ${theme.fontSizes.sm}; color: ${theme.colors.secondary};
  font-weight: ${theme.fontWeights.medium};
`;

const CurrentCard = styled.div`
  display: flex; align-items: center; gap: .75rem; padding: 0.75rem;
  background-color: ${theme.colors.surfaceContainerLow};
  border-radius: ${theme.radii.lg}; margin-bottom: 1rem;
`;

const CardChip = styled.span`
  font-family: 'Courier New', monospace; font-weight: ${theme.fontWeights.bold};
  font-size: ${theme.fontSizes.base}; color: ${theme.colors.primary};
`;

const StepsBox = styled.div`
  background: ${theme.colors.surfaceContainerLow};
  border-radius: ${theme.radii.lg}; padding: 0.75rem 0.875rem;
  margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.375rem;
`;

const Step = styled.div`
  display: flex; align-items: center; gap: .625rem;
  font-size: ${theme.fontSizes.xs}; color: ${theme.colors.onSurfaceVariant};
`;

const StepNum = styled.span`
  width: 1.25rem; height: 1.25rem; border-radius: ${theme.radii.full};
  background: ${theme.colors.primaryFixed}; color: ${theme.colors.primary};
  display: flex; align-items: center; justify-content: center;
  font-size: ${theme.fontSizes.xs}; font-weight: 700; flex-shrink: 0;
`;

const ErrorBanner = styled.div`
  background: ${theme.colors.errorContainer}; color: ${theme.colors.error};
  border-radius: ${theme.radii.lg}; padding: .625rem .875rem;
  font-size: ${theme.fontSizes.xs}; margin-bottom: 1rem;
  display: flex; align-items: center; gap: .375rem;
`;

// ── Constante ─────────────────────────────────────────────────
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS  = 60000; // detener después de 60 s sin respuesta

// ── Componente ────────────────────────────────────────────────

const LinkCardModal = ({ isOpen, onClose, persona, onSave, token, dispositivos = [] }) => {
  const [codigo,    setCodigo]    = useState('');
  const [deviceId,  setDeviceId]  = useState('');
  const [scanning,  setScanning]  = useState(false);
  const [error,     setError]     = useState(null);

  const pollRef    = useRef(null);
  const timeoutRef = useRef(null);

  // ── Limpiar al abrir/cerrar ────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setCodigo('');
      setDeviceId('');
      setScanning(false);
      setError(null);
    } else {
      setCodigo(persona?.codigoTarjeta ?? persona?.codigo_tarjeta ?? '');
      // Pre-seleccionar el primer dispositivo activo
      const primerActivo = dispositivos.find(d => d.estado === 'Activo');
      if (primerActivo) setDeviceId(primerActivo.codigo);
    }
  }, [isOpen, persona]);

  // ── Limpiar al desmontar ───────────────────────────────────
  useEffect(() => () => stopPolling(), []);

  // ── Polling ────────────────────────────────────────────────
  const stopPolling = () => {
    clearInterval(pollRef.current);
    clearTimeout(timeoutRef.current);
    pollRef.current    = null;
    timeoutRef.current = null;
  };

  const startPolling = () => {
    if (!deviceId) {
      setError('Selecciona un dispositivo ESP32 antes de iniciar.');
      return;
    }
    if (!token) {
      setError('Sin token de autenticación. Recarga la página.');
      return;
    }

    setScanning(true);
    setError(null);

    // Función que se ejecuta cada 2 s
    const poll = async () => {
      try {
        const { uid } = await getUltimoScan(token, deviceId);
        if (uid) {
          setCodigo(uid);
          setScanning(false);
          stopPolling();
        }
      } catch (err) {
        // Error de red: seguir intentando hasta el timeout
        console.warn('[LinkCardModal] Error de polling:', err.message);
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Detener automáticamente después de 60 s
    timeoutRef.current = setTimeout(() => {
      if (scanning) {
        stopPolling();
        setScanning(false);
        setError('Tiempo de espera agotado (60 s). Intenta de nuevo.');
      }
    }, POLL_TIMEOUT_MS);
  };

  const handleCancelScan = () => {
    stopPolling();
    setScanning(false);
  };

  // ── Guardar ────────────────────────────────────────────────
  const handleSave = (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    onSave?.(persona?.id, codigo.trim());
    onClose();
  };

  const handleUnlink = () => {
    if (!window.confirm('¿Desvincular la tarjeta actual de esta persona?')) return;
    onSave?.(persona?.id, null);
    onClose();
  };

  if (!persona) return null;

  const dispositivosActivos = dispositivos.filter(d => d.estado === 'Activo');

  return (
    <Modal isOpen={isOpen} onClose={() => { stopPolling(); onClose(); }}
      title="Vincular tarjeta RFID" size="md">

      {/* Info de la persona */}
      <PersonInfo>
        <Icon name="person" size="sm" style={{ marginRight: '.375rem' }} />
        {persona.nombre} {persona.apellido} — <em>{persona.rol}</em>
      </PersonInfo>

      {/* Tarjeta actual */}
      {(persona.codigoTarjeta || persona.codigo_tarjeta) && (
        <CurrentCard>
          <Icon name="contactless" size="md" style={{ color: theme.colors.primary }} />
          <div>
            <p style={{ fontSize: theme.fontSizes.xs, color: theme.colors.outline,
              textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Tarjeta actual
            </p>
            <CardChip>{persona.codigoTarjeta ?? persona.codigo_tarjeta}</CardChip>
          </div>
        </CurrentCard>
      )}

      {/* Error */}
      {error && (
        <ErrorBanner>
          <Icon name="error" size="sm" />{error}
        </ErrorBanner>
      )}

      {/* Selector de dispositivo */}
      <FormGroup>
        <Label htmlFor="lc-device">Dispositivo ESP32 *</Label>
        <Select
          id="lc-device"
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          disabled={scanning}
        >
          <option value="">— Seleccionar dispositivo —</option>
          {dispositivosActivos.map(d => (
            <option key={d.id} value={d.codigo}>
              {d.codigo}{d.aula ? ` · ${d.aula}` : ''}
            </option>
          ))}
        </Select>
        {dispositivosActivos.length === 0 && (
          <HelperText style={{ color: theme.colors.error }}>
            No hay dispositivos activos. Activa uno en el tab Dispositivos.
          </HelperText>
        )}
      </FormGroup>

      {/* Área de escaneo */}
      <ScanArea $scanning={scanning}>
        <ScanIcon $scanning={scanning}>
          <Icon name="contactless" size="lg" />
        </ScanIcon>
        <ScanLabel $scanning={scanning}>
          {scanning
            ? `Esperando lectura del ESP32 (${deviceId})…`
            : 'Pulsa "Iniciar escaneo" y acerca la tarjeta al lector'}
        </ScanLabel>
        {scanning && (
          <ScanSubLabel>
            Escribe <strong>LECTURA</strong> en el Serial Monitor del ESP32 y luego acerca la tarjeta.
          </ScanSubLabel>
        )}
      </ScanArea>

      {/* Pasos de ayuda (solo cuando no está escaneando) */}
      {!scanning && !codigo && (
        <StepsBox>
          <Step>
            <StepNum>1</StepNum>
            Selecciona el dispositivo ESP32 del aula donde estás.
          </Step>
          <Step>
            <StepNum>2</StepNum>
            Pulsa <strong>Iniciar escaneo</strong> aquí en el panel.
          </Step>
          <Step>
            <StepNum>3</StepNum>
            En el Serial Monitor del ESP32 escribe <code>LECTURA</code> y presiona Enter.
          </Step>
          <Step>
            <StepNum>4</StepNum>
            Acerca la tarjeta al lector. El UID aparecerá automáticamente.
          </Step>
        </StepsBox>
      )}

      <form onSubmit={handleSave} noValidate>
        {/* Campo del código (se rellena automáticamente o manualmente) */}
        <FormGroup>
          <Label htmlFor="lc-codigo">Código RFID</Label>
          <Input
            id="lc-codigo"
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            placeholder="Se completará automáticamente…"
            disabled={scanning}
          />
          <HelperText>
            También puedes escribirlo manualmente si conoces el código.
          </HelperText>
        </FormGroup>

        <FormActions>
          {(persona.codigoTarjeta || persona.codigo_tarjeta) && (
            <Button variant="ghost" size="sm" type="button" onClick={handleUnlink}
              style={{ color: theme.colors.error, marginRight: 'auto' }}>
              <Icon name="link_off" size="sm" />Desvincular
            </Button>
          )}

          {!scanning ? (
            <>
              <Button variant="outlined" size="sm" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="outlined" size="sm" type="button"
                onClick={startPolling}
                disabled={!deviceId || dispositivosActivos.length === 0}
              >
                <Icon name="sensors" size="sm" />Iniciar escaneo
              </Button>
              <Button size="sm" type="submit" disabled={!codigo.trim()}>
                <Icon name="contactless" size="sm" />Vincular tarjeta
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" size="sm" type="button" onClick={handleCancelScan}>
                <Icon name="stop" size="sm" />Cancelar escaneo
              </Button>
            </>
          )}
        </FormActions>
      </form>
    </Modal>
  );
};

export default LinkCardModal;