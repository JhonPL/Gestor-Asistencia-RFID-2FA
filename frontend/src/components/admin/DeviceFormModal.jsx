import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';

/**
 * DeviceFormModal — crea o edita un dispositivo ESP32/RFID (RF-11).
 *
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {object|null} device - null = crear, objeto = editar
 * @param {Function} onSave(deviceData)
 */

const EMPTY = { codigo: '', aula: '', ip: '', mac: '', estado: 'Activo' };

const DeviceFormModal = ({ isOpen, onClose, device = null, onSave }) => {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!device;

  useEffect(() => {
    setForm(device ? { ...EMPTY, ...device } : EMPTY);
  }, [device, isOpen]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.codigo.trim()) return;
    onSave?.({ ...form, id: device?.id ?? Date.now() });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar dispositivo' : 'Nuevo dispositivo RFID'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label htmlFor="dm-codigo">Código del dispositivo *</Label>
          <Input id="dm-codigo" value={form.codigo} onChange={set('codigo')} placeholder="Ej. ESP32-04" required />
          <HelperText>Identificador único grabado en el firmware del ESP32.</HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="dm-aula">Aula asignada</Label>
          <Input id="dm-aula" value={form.aula} onChange={set('aula')} placeholder="Ej. Sala 305-B" />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label htmlFor="dm-ip">Dirección IP</Label>
            <Input id="dm-ip" value={form.ip} onChange={set('ip')} placeholder="192.168.1.100" />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="dm-mac">Dirección MAC</Label>
            <Input id="dm-mac" value={form.mac} onChange={set('mac')} placeholder="AA:BB:CC:DD:EE:FF" />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="dm-estado">Estado</Label>
          <Select id="dm-estado" value={form.estado} onChange={set('estado')}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Mantenimiento">En mantenimiento</option>
          </Select>
        </FormGroup>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar cambios' : 'Crear dispositivo'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default DeviceFormModal;