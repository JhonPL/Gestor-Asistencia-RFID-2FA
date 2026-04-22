// src/components/admin/DeviceFormModal.jsx
// Fiel a tabla dispositivo_rfid de BD v5:
//   id, codigo (UNIQUE), aula_id (FK nullable), ip_address,
//   mac_address, estado_dispositivo_id (FK → Activo|Inactivo|Mantenimiento)
// NO existe eliminación física: el cambio de estado reemplaza el "borrar".

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';
import theme from '../../styles/theme';

// Catálogo fijo alineado con la BD (tabla estado_dispositivo)
const ESTADOS_DISPOSITIVO = ['Activo', 'Inactivo', 'Mantenimiento'];

const estadoMeta = {
  Activo:       { color: theme.colors.secondary,     bg: theme.colors.secondaryFixed,   icon: 'check_circle' },
  Inactivo:     { color: theme.colors.outline,        bg: theme.colors.surfaceContainerHigh, icon: 'cancel' },
  Mantenimiento:{ color: '#7b2e12',                   bg: theme.colors.tertiaryFixed,    icon: 'build' },
};

const EstadoBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .25rem .75rem;
  border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  background: ${({ $estado }) => estadoMeta[$estado]?.bg ?? theme.colors.surfaceContainerHigh};
  color: ${({ $estado }) => estadoMeta[$estado]?.color ?? theme.colors.outline};
`;

const EstadoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .5rem;
  margin-top: .375rem;
`;

const EstadoBtn = styled.button`
  type: button;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .3rem;
  padding: .625rem .5rem;
  border-radius: ${theme.radii.lg};
  font-size: ${theme.fontSizes.xs};
  font-weight: 600;
  border: 2px solid ${({ $active, $estado }) =>
    $active ? (estadoMeta[$estado]?.color ?? theme.colors.primary) : 'transparent'};
  background: ${({ $active, $estado }) =>
    $active ? (estadoMeta[$estado]?.bg ?? theme.colors.primaryFixed) : theme.colors.surfaceContainerLow};
  color: ${({ $active, $estado }) =>
    $active ? (estadoMeta[$estado]?.color ?? theme.colors.primary) : theme.colors.onSurfaceVariant};
  transition: all ${theme.transitions.fast};
  cursor: pointer;
  &:hover {
    background: ${({ $estado }) => estadoMeta[$estado]?.bg ?? theme.colors.surfaceContainerHigh};
    color: ${({ $estado }) => estadoMeta[$estado]?.color ?? theme.colors.primary};
  }
`;

const EMPTY = {
  codigo: '', aula_id: '', ip_address: '', mac_address: '', estado: 'Activo',
};

const DeviceFormModal = ({ isOpen, onClose, device = null, onSave, aulas = [] }) => {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!device;

  useEffect(() => {
    setForm(device ? {
      codigo:      device.codigo      ?? '',
      aula_id:     device.aula_id     ?? '',
      ip_address:  device.ip_address  ?? '',
      mac_address: device.mac_address ?? '',
      estado:      device.estado      ?? 'Activo',
    } : EMPTY);
  }, [device, isOpen]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const setEstado = (estado) => setForm(p => ({ ...p, estado }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.codigo.trim()) return;

    onSave({
      // Si es edición pasamos el id real; si es creación no hay id
      ...(device ? { id: device.id } : {}),
      codigo:      form.codigo.trim().toUpperCase(),
      aula_id:     form.aula_id ? Number(form.aula_id) : null,
      ip_address:  form.ip_address.trim()  || null,
      mac_address: form.mac_address.trim() || null,
      estado:      form.estado,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar dispositivo RFID' : 'Nuevo dispositivo RFID'}
      size="sm"
    >
      <form onSubmit={handleSubmit} noValidate>

        {/* Código */}
        <FormGroup>
          <Label htmlFor="dev-codigo">Código del dispositivo *</Label>
          <Input
            id="dev-codigo"
            value={form.codigo}
            onChange={set('codigo')}
            placeholder="Ej. ESP32-05"
            required
          />
          <HelperText>
            Identificador único grabado en el firmware del ESP32 (campo UNIQUE en BD).
          </HelperText>
        </FormGroup>

        {/* Aula */}
        <FormGroup>
          <Label htmlFor="dev-aula">Aula asignada</Label>
          <Select id="dev-aula" value={form.aula_id} onChange={set('aula_id')}>
            <option value="">— Sin asignar —</option>
            {aulas.map(a => (
              <option key={a.id} value={a.id}>
                {a.numero}{a.nombre ? ` – ${a.nombre}` : ''}{a.edificio ? ` (${a.edificio})` : ''}
              </option>
            ))}
          </Select>
          <HelperText>Corresponde a <code>aula_id</code> FK en BD. Puede quedar sin asignar.</HelperText>
        </FormGroup>

        {/* IP / MAC */}
        <FormRow>
          <FormGroup>
            <Label htmlFor="dev-ip">Dirección IP</Label>
            <Input
              id="dev-ip"
              value={form.ip_address}
              onChange={set('ip_address')}
              placeholder="192.168.1.105"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="dev-mac">Dirección MAC</Label>
            <Input
              id="dev-mac"
              value={form.mac_address}
              onChange={set('mac_address')}
              placeholder="AA:BB:CC:DD:EE:FF"
              maxLength={17}
            />
          </FormGroup>
        </FormRow>

        {/* Estado — selector visual de 3 opciones */}
        <FormGroup>
          <Label>Estado del dispositivo *</Label>
          <EstadoGrid>
            {ESTADOS_DISPOSITIVO.map(est => (
              <EstadoBtn
                key={est}
                type="button"
                $active={form.estado === est}
                $estado={est}
                onClick={() => setEstado(est)}
              >
                <Icon name={estadoMeta[est].icon} size="sm" />
                {est}
              </EstadoBtn>
            ))}
          </EstadoGrid>
          <HelperText style={{ marginTop: '.5rem' }}>
            Corresponde a <code>estado_dispositivo_id</code> (FK) en BD.
            No existe eliminación física: usa <strong>Inactivo</strong> para retirar un dispositivo.
          </HelperText>

          {/* Badge preview del estado actual */}
          <div style={{ marginTop: '.625rem' }}>
            <EstadoBadge $estado={form.estado}>
              <Icon name={estadoMeta[form.estado]?.icon} size="sm" />
              {form.estado}
            </EstadoBadge>
          </div>
        </FormGroup>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" type="submit">
            {isEditing ? 'Guardar cambios' : 'Registrar dispositivo'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default DeviceFormModal;