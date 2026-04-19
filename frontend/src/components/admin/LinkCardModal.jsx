import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { FormGroup, Label, Input, FormActions, HelperText } from '../ui/FormElements';
import theme from '../../styles/theme';

/**
 * LinkCardModal — vincula o reemplaza el código RFID de una persona (RF-12).
 * Simula un "escaneo" del lector: el campo se autocompleta con un código ficticio.
 *
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {object}   persona - persona a la que se vincula la tarjeta
 * @param {Function} onSave(personaId, codigoTarjeta)
 */

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:.4}`;

const ScanArea = styled.div`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:1rem;padding:2rem;border-radius:${theme.radii.xl};
  background-color:${({ $scanning }) => $scanning ? theme.colors.primaryFixed : theme.colors.surfaceContainerLow};
  border:2px dashed ${({ $scanning }) => $scanning ? theme.colors.primary : theme.colors.outlineVariant};
  cursor:pointer;transition:all ${theme.transitions.base};margin-bottom:1.5rem;
  &:hover{border-color:${theme.colors.primary};background-color:${theme.colors.primaryFixed}}
`;
const ScanIcon = styled.div`
  width:4rem;height:4rem;border-radius:${theme.radii.full};
  background-color:${({ $scanning }) => $scanning ? theme.colors.primary : theme.colors.primaryFixed};
  color:${({ $scanning }) => $scanning ? 'white' : theme.colors.primary};
  display:flex;align-items:center;justify-content:center;
  animation:${({ $scanning }) => $scanning ? pulse : 'none'} 1.2s ease infinite;
  transition:all ${theme.transitions.base};
`;
const ScanLabel = styled.p`
  font-size:${theme.fontSizes.sm};font-weight:${theme.fontWeights.semibold};
  color:${({ $scanning }) => $scanning ? theme.colors.primary : theme.colors.onSurfaceVariant};
  text-align:center;
`;
const CurrentCard = styled.div`
  display:flex;align-items:center;gap:.75rem;padding:1rem;
  background-color:${theme.colors.surfaceContainerLow};border-radius:${theme.radii.lg};
  margin-bottom:1.5rem;
`;
const CardChip = styled.span`
  font-family:'Courier New',monospace;font-weight:${theme.fontWeights.bold};
  font-size:${theme.fontSizes.base};color:${theme.colors.primary};
`;
const PersonInfo = styled.div`
  padding:1rem;background-color:${theme.colors.secondaryFixed};
  border-radius:${theme.radii.lg};margin-bottom:1.5rem;
  font-size:${theme.fontSizes.sm};color:${theme.colors.secondary};
  font-weight:${theme.fontWeights.medium};
`;

const LinkCardModal = ({ isOpen, onClose, persona, onSave }) => {
  const [codigo, setCodigo]     = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) { setCodigo(''); setScanning(false); }
    else setCodigo(persona?.codigoTarjeta ?? '');
  }, [isOpen, persona]);

  // Simula el escaneo del lector físico ESP32
  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const fake = `RFID-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
      setCodigo(fake);
      setScanning(false);
    }, 1800);
  };

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vincular tarjeta RFID" size="sm">
      <PersonInfo>
        <Icon name="person" size="sm" style={{marginRight:'.375rem'}} />
        {persona.nombre} {persona.apellido} — <em>{persona.rol}</em>
      </PersonInfo>

      {persona.codigoTarjeta && (
        <CurrentCard>
          <Icon name="contactless" size="md" style={{color:theme.colors.primary}} />
          <div>
            <p style={{fontSize:theme.fontSizes.xs,color:theme.colors.outline,textTransform:'uppercase',letterSpacing:'.08em'}}>Tarjeta actual</p>
            <CardChip>{persona.codigoTarjeta}</CardChip>
          </div>
        </CurrentCard>
      )}

      <ScanArea $scanning={scanning} onClick={!scanning ? simulateScan : undefined} role="button" tabIndex={0}
        onKeyDown={e => e.key==='Enter' && !scanning && simulateScan()}>
        <ScanIcon $scanning={scanning}>
          <Icon name="contactless" size="lg" />
        </ScanIcon>
        <ScanLabel $scanning={scanning}>
          {scanning ? 'Esperando lectura del lector RFID…' : 'Clic para simular escaneo de tarjeta'}
        </ScanLabel>
      </ScanArea>

      <form onSubmit={handleSave} noValidate>
        <FormGroup>
          <Label htmlFor="lc-codigo">Código RFID</Label>
          <Input id="lc-codigo" value={codigo} onChange={e => setCodigo(e.target.value)}
            placeholder="Ej. RFID-A1B2C3" required />
          <HelperText>También puedes escribirlo manualmente si conoces el código.</HelperText>
        </FormGroup>

        <FormActions>
          {persona.codigoTarjeta && (
            <Button variant="ghost" size="sm" type="button" onClick={handleUnlink}
              style={{color:theme.colors.error,marginRight:'auto'}}>
              <Icon name="link_off" size="sm" />Desvincular
            </Button>
          )}
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit" disabled={!codigo.trim() || scanning}>
            <Icon name="contactless" size="sm" />Vincular tarjeta
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default LinkCardModal;