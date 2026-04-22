import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';
import { ESTADOS_DISPOSITIVO } from '../../mocks/admin.mock';

/**
 * DeviceFormModal — fiel a tabla dispositivo_rfid de BD v5:
 *   id, codigo (UNIQUE), aula_id (FK nullable), ip_address,
 *   mac_address, estado_dispositivo_id (FK), ultima_conexion
 */

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.codigo.trim()) return;
    const aula = aulas.find(a => a.id === Number(form.aula_id));
    onSave({
      ...device,
      id:          device?.id ?? Date.now(),
      codigo:      form.codigo.trim().toUpperCase(),
      aula_id:     form.aula_id ? Number(form.aula_id) : null,
      aula:        aula ? `${aula.numero}${aula.nombre ? ` – ${aula.nombre}` : ''}` : null,
      ip_address:  form.ip_address.trim()  || null,
      mac_address: form.mac_address.trim() || null,
      estado:      form.estado,
      // estado_dispositivo_id se resolvería en backend con el nombre
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

        <FormGroup>
          <Label htmlFor="dev-codigo">Código del dispositivo *</Label>
          <Input
            id="dev-codigo"
            value={form.codigo}
            onChange={set('codigo')}
            placeholder="Ej. ESP32-05"
            required
          />
          <HelperText>Identificador único grabado en el firmware del ESP32 (campo UNIQUE en BD).</HelperText>
        </FormGroup>

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

        <FormGroup>
          <Label htmlFor="dev-estado">Estado *</Label>
          <Select id="dev-estado" value={form.estado} onChange={set('estado')}>
            {ESTADOS_DISPOSITIVO.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </Select>
          <HelperText>Corresponde a <code>estado_dispositivo_id</code> (FK) en BD.</HelperText>
        </FormGroup>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">
            {isEditing ? 'Guardar cambios' : 'Registrar dispositivo'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default DeviceFormModal;