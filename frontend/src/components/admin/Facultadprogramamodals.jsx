import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';

// ─── Modal Facultad ───────────────────────────────────────────────────────────
/**
 * Tabla facultad: id, nombre, created_at
 */
export const FacultadModal = ({ isOpen, onClose, item = null, onSave }) => {
  const [nombre, setNombre] = useState('');
  const isEditing = !!item;

  useEffect(() => { setNombre(item?.nombre ?? ''); }, [item, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({ ...item, id: item?.id ?? Date.now(), nombre: nombre.trim() });
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
/**
 * Tabla programa: id, nombre, codigo (UNIQUE, nullable), facultad_id, created_at
 */
export const ProgramaModal = ({ isOpen, onClose, item = null, onSave, facultades = [] }) => {
  const EMPTY = { nombre: '', codigo: '', facultad_id: '' };
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!item;

  useEffect(() => {
    setForm(item ? {
      nombre:      item.nombre      ?? '',
      codigo:      item.codigo      ?? '',
      facultad_id: item.facultad_id ?? '',
    } : EMPTY);
  }, [item, isOpen]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.facultad_id) return;
    const facultad = facultades.find(f => f.id === Number(form.facultad_id));
    onSave({
      ...item,
      id:          item?.id ?? Date.now(),
      nombre:      form.nombre.trim(),
      codigo:      form.codigo.trim().toUpperCase() || null,
      facultad_id: Number(form.facultad_id),
      facultad:    facultad?.nombre ?? '',
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
            {facultades.map(f => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </Select>
        </FormGroup>

        <FormRow>
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
          <FormGroup>
            <Label htmlFor="prog-codigo">Código</Label>
            <Input
              id="prog-codigo"
              value={form.codigo}
              onChange={set('codigo')}
              placeholder="Ej. ING-SIS"
              maxLength={20}
            />
            <HelperText>Opcional, único en BD.</HelperText>
          </FormGroup>
        </FormRow>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar' : 'Crear programa'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};