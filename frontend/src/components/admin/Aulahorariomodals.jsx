import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';
import theme from '../../styles/theme';

// ─── Modal Aula ───────────────────────────────────────────────────────────────
/**
 * Campos BD: id, numero (UNIQUE), nombre, edificio, piso, capacidad
 */
export const AulaModal = ({ isOpen, onClose, item = null, onSave }) => {
  const EMPTY = { numero: '', nombre: '', edificio: '', piso: '', capacidad: '' };
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!item;

  useEffect(() => {
    setForm(item ? {
      numero:    item.numero    ?? '',
      nombre:    item.nombre    ?? '',
      edificio:  item.edificio  ?? '',
      piso:      item.piso      ?? '',
      capacidad: item.capacidad ?? '',
    } : EMPTY);
  }, [item, isOpen]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.numero.trim()) return;
    onSave({
      ...(item && { id: item.id }),
      numero:    form.numero.trim().toUpperCase(),
      nombre:    form.nombre.trim() || null,
      edificio:  form.edificio.trim() || null,
      piso:      form.piso !== '' ? Number(form.piso) : null,
      capacidad: form.capacidad !== '' ? Number(form.capacidad) : null,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar aula' : 'Nueva aula'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <FormRow>
          <FormGroup>
            <Label htmlFor="aula-numero">Número / código *</Label>
            <Input
              id="aula-numero"
              value={form.numero}
              onChange={set('numero')}
              placeholder="Ej. 305-B, LAB-1"
              required
            />
            <HelperText>Identificador único del aula (campo UNIQUE en BD).</HelperText>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="aula-nombre">Nombre descriptivo</Label>
            <Input
              id="aula-nombre"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Ej. Aula Magistral"
            />
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label htmlFor="aula-edificio">Edificio / Bloque</Label>
            <Input
              id="aula-edificio"
              value={form.edificio}
              onChange={set('edificio')}
              placeholder="Ej. Bloque B"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="aula-piso">Piso</Label>
            <Input
              id="aula-piso"
              type="number"
              min="0"
              max="20"
              value={form.piso}
              onChange={set('piso')}
              placeholder="Ej. 3"
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="aula-cap">Capacidad (personas)</Label>
          <Input
            id="aula-cap"
            type="number"
            min="1"
            max="1000"
            value={form.capacidad}
            onChange={set('capacidad')}
            placeholder="Ej. 30"
          />
        </FormGroup>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar' : 'Crear aula'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

// ─── Modal Horario ────────────────────────────────────────────────────────────
/**
 * Campos BD: id, dia_semana_id (FK), hora_inicio (TIME), hora_fin (TIME)
 * Duración LIBRE: puede ser 1h, 2h, 3h, 4h, etc.
 */

const DuracionBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: .375rem;
  padding: .375rem .875rem;
  background: ${theme.colors.primaryFixed};
  color: ${theme.colors.primary};
  border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  margin-top: .5rem;
`;

const calcDuracion = (inicio, fin) => {
  if (!inicio || !fin) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (totalMin <= 0) return null;
  const horas = Math.floor(totalMin / 60);
  const mins  = totalMin % 60;
  if (horas === 0) return `${mins} min`;
  if (mins  === 0) return `${horas}h`;
  return `${horas}h ${mins}min`;
};

export const HorarioModal = ({ isOpen, onClose, item = null, onSave, dias = [] }) => {
  const EMPTY = { dia_semana_id: '', hora_inicio: '', hora_fin: '' };
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!item;

  useEffect(() => {
    setForm(item ? {
      dia_semana_id: item.dia_semana_id ?? '',
      hora_inicio:   item.hora_inicio   ?? '',
      hora_fin:      item.hora_fin      ?? '',
    } : EMPTY);
  }, [item, isOpen]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const duracion = calcDuracion(form.hora_inicio, form.hora_fin);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.dia_semana_id || !form.hora_inicio || !form.hora_fin) return;
    if (form.hora_fin <= form.hora_inicio) {
      alert('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
    const dia = dias.find(d => d.id === Number(form.dia_semana_id));
    onSave({
      ...(item && { id: item.id }),
      dia_semana_id: Number(form.dia_semana_id),
      dia:           dia?.nombre ?? '',
      hora_inicio:   form.hora_inicio,
      hora_fin:      form.hora_fin,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar franja horaria' : 'Nueva franja horaria'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label htmlFor="hor-dia">Día de la semana *</Label>
          <Select id="hor-dia" value={form.dia_semana_id} onChange={set('dia_semana_id')} required>
            <option value="">— Seleccionar día —</option>
            {dias.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </Select>
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label htmlFor="hor-inicio">Hora de inicio *</Label>
            <Input
              id="hor-inicio"
              type="time"
              value={form.hora_inicio}
              onChange={set('hora_inicio')}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="hor-fin">Hora de fin *</Label>
            <Input
              id="hor-fin"
              type="time"
              value={form.hora_fin}
              onChange={set('hora_fin')}
              required
            />
          </FormGroup>
        </FormRow>

        {duracion && (
          <DuracionBadge>
            ⏱ Duración: {duracion}
          </DuracionBadge>
        )}

        <HelperText style={{ marginTop: '.75rem' }}>
          La duración es libre: 1 hora, 2 horas, 3 horas, etc.
          Cada combinación día + aula es única en la tabla <code>aula_curso_horario</code>.
        </HelperText>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar' : 'Crear franja'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};