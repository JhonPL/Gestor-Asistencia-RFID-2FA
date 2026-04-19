import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, FormRow, FormActions, HelperText } from '../ui/FormElements';

// ─── Modal Aula ───────────────────────────────────────────────────────────────
export const AulaModal = ({ isOpen, onClose, item = null, onSave }) => {
  const EMPTY = { nombre: '', edificio: '', capacidad: '' };
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!item;

  useEffect(() => {
    setForm(item ? {
      nombre: item.nombre,
      edificio: item.edificio ?? '',
      capacidad: item.capacidad ?? '',
    } : EMPTY);
  }, [item, isOpen]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onSave({
      ...item,
      id: item?.id ?? Date.now(),
      nombre: form.nombre.trim(),
      edificio: form.edificio.trim(),
      capacidad: form.capacidad ? Number(form.capacidad) : null,
      activo: item?.activo ?? true,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar aula' : 'Nueva aula'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label htmlFor="aula-nombre">Nombre del aula *</Label>
          <Input id="aula-nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Sala 305-B" required />
          <HelperText>Identificador único visible para docentes y estudiantes.</HelperText>
        </FormGroup>
        <FormRow>
          <FormGroup>
            <Label htmlFor="aula-edificio">Edificio / Bloque</Label>
            <Input id="aula-edificio" value={form.edificio} onChange={set('edificio')} placeholder="Ej. Bloque B" />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="aula-cap">Capacidad (personas)</Label>
            <Input id="aula-cap" type="number" min="1" max="500" value={form.capacidad} onChange={set('capacidad')} placeholder="Ej. 30" />
          </FormGroup>
        </FormRow>
        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar' : 'Crear aula'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

// ─── Modal Horario ────────────────────────────────────────────────────────────
export const HorarioModal = ({ isOpen, onClose, item = null, onSave }) => {
  const EMPTY = { hora_inicio: '', hora_fin: '' };
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!item;

  useEffect(() => {
    setForm(item ? { hora_inicio: item.hora_inicio, hora_fin: item.hora_fin } : EMPTY);
  }, [item, isOpen]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.hora_inicio || !form.hora_fin) return;
    if (form.hora_fin <= form.hora_inicio) {
      alert('La hora de fin debe ser mayor que la hora de inicio.');
      return;
    }
    onSave({
      ...item,
      id: item?.id ?? Date.now(),
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar franja horaria' : 'Nueva franja horaria'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <FormRow>
          <FormGroup>
            <Label htmlFor="hor-inicio">Hora de inicio *</Label>
            <Input id="hor-inicio" type="time" value={form.hora_inicio} onChange={set('hora_inicio')} required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="hor-fin">Hora de fin *</Label>
            <Input id="hor-fin" type="time" value={form.hora_fin} onChange={set('hora_fin')} required />
          </FormGroup>
        </FormRow>
        <HelperText>Las franjas horarias son compartidas por todos los cursos del semestre.</HelperText>
        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar' : 'Crear franja'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};