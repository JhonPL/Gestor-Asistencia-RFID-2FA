import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, Select, FormActions, HelperText } from '../ui/FormElements';

// ─── Modal Facultad ───────────────────────────────────────────────────────────
export const FacultadModal = ({ isOpen, onClose, item = null, onSave }) => {
  const [nombre, setNombre] = useState('');
  const isEditing = !!item;

  useEffect(() => {
    setNombre(item?.nombre ?? '');
  }, [item, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({ ...item, id: item?.id ?? Date.now(), nombre: nombre.trim(), activo: item?.activo ?? true });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar facultad' : 'Nueva facultad'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label htmlFor="fac-nombre">Nombre de la facultad *</Label>
          <Input
            id="fac-nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Facultad de Ingeniería"
            required
          />
        </FormGroup>
        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar' : 'Crear facultad'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

// ─── Modal Programa ───────────────────────────────────────────────────────────
export const ProgramaModal = ({ isOpen, onClose, item = null, onSave, facultades = [] }) => {
  const EMPTY = { nombre: '', facultad_id: '' };
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!item;

  useEffect(() => {
    setForm(item ? { nombre: item.nombre, facultad_id: item.facultad_id ?? '' } : EMPTY);
  }, [item, isOpen]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.facultad_id) return;
    const facultad = facultades.find(f => f.id === Number(form.facultad_id));
    onSave({
      ...item,
      id: item?.id ?? Date.now(),
      nombre: form.nombre.trim(),
      facultad_id: Number(form.facultad_id),
      facultad: facultad?.nombre ?? '',
      activo: item?.activo ?? true,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar programa' : 'Nuevo programa'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label htmlFor="prog-fac">Facultad *</Label>
          <Select id="prog-fac" value={form.facultad_id} onChange={set('facultad_id')} required>
            <option value="">— Seleccionar facultad —</option>
            {facultades.filter(f => f.activo).map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="prog-nombre">Nombre del programa *</Label>
          <Input
            id="prog-nombre"
            value={form.nombre}
            onChange={set('nombre')}
            placeholder="Ej. Ingeniería de Sistemas"
            required
          />
        </FormGroup>
        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar' : 'Crear programa'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};