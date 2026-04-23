// src/components/admin/CursoGestionDatosTab.jsx
// Pestaña "Datos" del modal de gestión de curso.
// SRP: solo maneja el formulario de datos del curso y las asignaciones aula-horario.

import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  FormGroup, Label, Input, Select,
  FormRow, FormActions, HelperText,
} from '../ui/FormElements';
import theme from '../../styles/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

const duracion = (inicio, fin) => {
  if (!inicio || !fin) return '';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min <= 0) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
};

// ── Styled ────────────────────────────────────────────────────────────────────

const spin = keyframes`to { transform: rotate(360deg); }`;

const Spinner = styled.span`
  display: inline-block; width: .9rem; height: .9rem;
  border: 2px solid ${theme.colors.primaryFixed};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} .7s linear infinite;
  flex-shrink: 0;
`;

const ErrorMsg = styled.p`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.error};
  background: ${theme.colors.errorContainer};
  padding: .5rem .875rem;
  border-radius: ${theme.radii.md};
  margin-bottom: .75rem;
`;

const AsignSectionLabel = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: ${theme.colors.onSurfaceVariant};
  margin-bottom: .875rem;
`;

const AsignRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: .5rem;
  align-items: end;
  margin-bottom: .625rem;
`;

const RemoveBtn = styled.button`
  width: 2.75rem; height: 2.75rem;
  border-radius: ${theme.radii.md};
  color: ${theme.colors.error};
  display: flex; align-items: center; justify-content: center;
  transition: background ${theme.transitions.fast};
  &:hover { background: ${theme.colors.errorContainer}; }
  &:disabled { opacity: .3; pointer-events: none; }
`;

const AddAsignBtn = styled.button`
  display: inline-flex; align-items: center; gap: .375rem;
  font-size: ${theme.fontSizes.xs}; font-weight: 600;
  color: ${theme.colors.primary};
  padding: .375rem .5rem; border-radius: ${theme.radii.md};
  transition: background ${theme.transitions.fast};
  &:hover { background: ${theme.colors.primaryFixed}; }
`;

// ── Constantes ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  codigo: '', nombre: '', fecha_inicio: '', fecha_fin: '',
  persona_id: '', activo: true,
};
const EMPTY_ACH = { aula_id: '', horario_id: '' };

// ── Componente ────────────────────────────────────────────────────────────────

const CursoGestionDatosTab = ({
  item, isEditing, onSave, onClose,
  docentes = [], aulas = [], horarios = [],
}) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [asigns,  setAsigns]  = useState([{ ...EMPTY_ACH }]);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState(null);

  useEffect(() => {
    if (item) {
      setForm({
        codigo:       item.codigo       ?? '',
        nombre:       item.nombre       ?? '',
        fecha_inicio: item.fecha_inicio ? item.fecha_inicio.slice(0, 10) : '',
        fecha_fin:    item.fecha_fin    ? item.fecha_fin.slice(0, 10)    : '',
        persona_id:   item.persona_id   ?? '',
        activo:       item.activo       ?? true,
      });
      const horariosCurso = item.horarios ?? [];
      setAsigns(
        horariosCurso.length > 0
          ? horariosCurso.map(h => ({
              aula_id:    String(h.aula_id),
              horario_id: String(h.horario_id),
            }))
          : [{ ...EMPTY_ACH }]
      );
    } else {
      setForm(EMPTY_FORM);
      setAsigns([{ ...EMPTY_ACH }]);
    }
    setFormErr(null);
  }, [item]);

  const setF = (k) => (e) =>
    setForm(p => ({
      ...p,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const setA = (idx, k) => (e) =>
    setAsigns(p => p.map((a, i) => i === idx ? { ...a, [k]: e.target.value } : a));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.fecha_inicio || !form.fecha_fin) {
      setFormErr('Nombre, fecha de inicio y fecha de fin son requeridos');
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      setFormErr('La fecha de fin debe ser posterior al inicio');
      return;
    }
    setSaving(true);
    setFormErr(null);
    try {
      const payload = {
        nombre:       form.nombre.trim(),
        codigo:       form.codigo.trim().toUpperCase() || null,
        fecha_inicio: form.fecha_inicio,
        fecha_fin:    form.fecha_fin,
        persona_id:   form.persona_id ? Number(form.persona_id) : null,
        activo:       form.activo,
        asignaciones: asigns
          .filter(a => a.aula_id && a.horario_id)
          .map(a => ({ aula_id: Number(a.aula_id), horario_id: Number(a.horario_id) })),
      };
      await onSave(item?.id || null, payload);
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const horariosPorDia = horarios.reduce((acc, h) => {
    if (!acc[h.dia]) acc[h.dia] = [];
    acc[h.dia].push(h);
    return acc;
  }, {});

  const horariosUsados = new Set(asigns.map(a => a.horario_id));

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formErr && <ErrorMsg>{formErr}</ErrorMsg>}

      <FormRow>
        <FormGroup>
          <Label htmlFor="cg-codigo">Código del curso</Label>
          <Input
            id="cg-codigo"
            value={form.codigo}
            onChange={setF('codigo')}
            placeholder="Ej. IS-301"
          />
          <HelperText>Opcional — único en BD.</HelperText>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="cg-nombre">Nombre del curso *</Label>
          <Input
            id="cg-nombre"
            value={form.nombre}
            onChange={setF('nombre')}
            placeholder="Ej. Ingeniería de Software II"
            required
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup>
          <Label htmlFor="cg-fi">Fecha de inicio *</Label>
          <Input
            id="cg-fi"
            type="date"
            value={form.fecha_inicio}
            onChange={setF('fecha_inicio')}
            required
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="cg-ff">Fecha de fin *</Label>
          <Input
            id="cg-ff"
            type="date"
            value={form.fecha_fin}
            onChange={setF('fecha_fin')}
            min={form.fecha_inicio || undefined}
            required
          />
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="cg-docente">Docente asignado</Label>
        <Select id="cg-docente" value={form.persona_id} onChange={setF('persona_id')}>
          <option value="">— Sin asignar —</option>
          {docentes.map(d => (
            <option key={d.id} value={d.id}>
              {d.nombre} {d.apellido} · {d.correo}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.625rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.activo}
            onChange={setF('activo')}
            style={{ width: '1rem', height: '1rem', accentColor: '#000666' }}
          />
          <span style={{ fontSize: '.875rem', fontWeight: 500 }}>Curso activo</span>
        </label>
      </FormGroup>

      {/* ── Asignaciones aula-horario ── */}
      <div style={{
        marginTop: '1.25rem',
        paddingTop: '1.25rem',
        borderTop: `1px solid ${theme.colors.outlineVariant}26`,
      }}>
        <AsignSectionLabel>Asignaciones de aula y horario</AsignSectionLabel>

        {asigns.map((asign, idx) => (
          <AsignRow key={idx}>
            <FormGroup style={{ marginBottom: 0 }}>
              {idx === 0 && <Label>Aula</Label>}
              <Select value={asign.aula_id} onChange={setA(idx, 'aula_id')}>
                <option value="">— Aula —</option>
                {aulas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.numero}{a.nombre ? ` – ${a.nombre}` : ''}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup style={{ marginBottom: 0 }}>
              {idx === 0 && <Label>Día y horario</Label>}
              <Select value={asign.horario_id} onChange={setA(idx, 'horario_id')}>
                <option value="">— Horario —</option>
                {Object.entries(horariosPorDia).map(([dia, hs]) => (
                  <optgroup key={dia} label={dia}>
                    {hs.map(h => {
                      const dur  = duracion(h.hora_inicio, h.hora_fin);
                      const used =
                        horariosUsados.has(String(h.id)) &&
                        String(h.id) !== String(asign.horario_id);
                      return (
                        <option key={h.id} value={h.id} disabled={used}>
                          {h.hora_inicio} – {h.hora_fin}{dur ? ` (${dur})` : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </Select>
            </FormGroup>

            <RemoveBtn
              type="button"
              onClick={() => setAsigns(p => p.filter((_, i) => i !== idx))}
              title="Quitar esta asignación"
              disabled={asigns.length === 1}
              style={{ marginTop: idx === 0 ? '1.5rem' : 0 }}
            >
              <Icon name="remove" size="sm" />
            </RemoveBtn>
          </AsignRow>
        ))}

        <AddAsignBtn type="button" onClick={() => setAsigns(p => [...p, { ...EMPTY_ACH }])}>
          <Icon name="add" size="sm" />Añadir asignación
        </AddAsignBtn>
      </div>

      <FormActions>
        <Button variant="outlined" size="sm" type="button" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" type="submit" disabled={saving}>
          {saving && <Spinner />}
          {isEditing ? 'Guardar cambios' : 'Crear curso'}
        </Button>
      </FormActions>
    </form>
  );
};

export default CursoGestionDatosTab;