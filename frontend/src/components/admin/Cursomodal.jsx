import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';
import theme from '../../styles/theme';

/**
 * CursoModal — fiel a tabla `curso` de BD v5:
 *   id, nombre, codigo, fecha_inicio (DATE), fecha_fin (DATE),
 *   persona_id (docente, nullable), activo
 *
 * También gestiona tabla `aula_curso_horario`:
 *   aula_id + curso_id + horario_id
 *   (el día ya está dentro del horario via horario.dia_semana_id)
 */

// ─── Styled locales ───────────────────────────────────────────────────────────
const ScheduleSection = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${theme.colors.outlineVariant}26;
`;

const ScheduleTitle = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: .1em;
  color: ${theme.colors.onSurfaceVariant};
  margin-bottom: .875rem;
  display: flex;
  align-items: center;
  gap: .375rem;
`;

const AsignRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: .5rem;
  align-items: end;
  margin-bottom: .625rem;
`;

const RemoveBtn = styled.button`
  width: 2.75rem;
  height: 2.75rem;
  border-radius: ${theme.radii.md};
  color: ${theme.colors.error};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background ${theme.transitions.fast};
  flex-shrink: 0;
  &:hover { background: ${theme.colors.errorContainer}; }
  &:disabled { opacity: .3; pointer-events: none; }
`;

const AddBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: .375rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.primary};
  padding: .375rem .5rem;
  border-radius: ${theme.radii.md};
  margin-top: .25rem;
  transition: background ${theme.transitions.fast};
  &:hover { background: ${theme.colors.primaryFixed}; }
`;

const HorarioLabel = styled.span`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.outline};
  background: ${theme.colors.surfaceContainerLow};
  padding: .15rem .5rem;
  border-radius: ${theme.radii.md};
`;

const duracionTexto = (inicio, fin) => {
  if (!inicio || !fin) return '';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min <= 0) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
};

// ─── Componente ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  codigo: '', nombre: '', fecha_inicio: '', fecha_fin: '',
  persona_id: '', activo: true,
};
const EMPTY_ACH = { aula_id: '', horario_id: '' }; // aula_curso_horario

const CursoModal = ({
  isOpen, onClose, item = null, onSave,
  docentes  = [],   // personas con rol docente activo
  aulas     = [],   // lista de aulas
  horarios  = [],   // lista de horarios (con dia_semana_id, hora_inicio, hora_fin, dia)
  achExistentes = [], // aula_curso_horario del curso (para edición)
}) => {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [asigns, setAsigns] = useState([{ ...EMPTY_ACH }]);
  const isEditing = !!item;

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      setForm({
        codigo:       item.codigo       ?? '',
        nombre:       item.nombre       ?? '',
        fecha_inicio: item.fecha_inicio ?? '',
        fecha_fin:    item.fecha_fin    ?? '',
        persona_id:   item.persona_id   ?? '',
        activo:       item.activo       ?? true,
      });
      // Carga las asignaciones existentes; si no hay, pone una vacía
      setAsigns(
        achExistentes.length > 0
          ? achExistentes.map(a => ({ id: a.id, aula_id: String(a.aula_id), horario_id: String(a.horario_id) }))
          : [{ ...EMPTY_ACH }]
      );
    } else {
      setForm(EMPTY_FORM);
      setAsigns([{ ...EMPTY_ACH }]);
    }
  }, [item, isOpen]);

  const setF = (k) => (e) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const setA = (idx, k) => (e) =>
    setAsigns(prev => prev.map((a, i) => i === idx ? { ...a, [k]: e.target.value } : a));

  const addAsign = () => setAsigns(p => [...p, { ...EMPTY_ACH }]);

  const removeAsign = (idx) => setAsigns(p => p.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.fecha_inicio || !form.fecha_fin) return;
    if (form.fecha_fin < form.fecha_inicio) {
      alert('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }

    const docente = docentes.find(d => d.id === Number(form.persona_id));
    const asigsFiltradas = asigns.filter(a => a.aula_id && a.horario_id);

    onSave({
      ...item,
      id:           item?.id ?? Date.now(),
      codigo:       form.codigo.trim().toUpperCase() || null,
      nombre:       form.nombre.trim(),
      fecha_inicio: form.fecha_inicio,
      fecha_fin:    form.fecha_fin,
      persona_id:   form.persona_id ? Number(form.persona_id) : null,
      docente:      docente ? `${docente.nombre} ${docente.apellido}` : null,
      activo:       form.activo,
      // Las asignaciones se enviarían al backend para gestionar aula_curso_horario
      _asignaciones: asigsFiltradas.map(a => ({
        ...(a.id ? { id: a.id } : {}),
        aula_id:    Number(a.aula_id),
        horario_id: Number(a.horario_id),
      })),
    });
    onClose();
  };

  // Horarios ya usados en este curso (para evitar duplicar)
  const horariosUsados = new Set(asigns.map(a => a.horario_id));
  // Horarios agrupados por día para el select
  const horariosPorDia = horarios.reduce((acc, h) => {
    if (!acc[h.dia]) acc[h.dia] = [];
    acc[h.dia].push(h);
    return acc;
  }, {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar curso' : 'Nuevo curso'} size="lg">
      <form onSubmit={handleSubmit} noValidate>

        {/* ── Código y nombre ── */}
        <FormRow>
          <FormGroup>
            <Label htmlFor="cur-codigo">Código del curso</Label>
            <Input
              id="cur-codigo"
              value={form.codigo}
              onChange={setF('codigo')}
              placeholder="Ej. IS-301"
            />
            <HelperText>Opcional, pero único en BD si se ingresa.</HelperText>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="cur-nombre">Nombre del curso *</Label>
            <Input
              id="cur-nombre"
              value={form.nombre}
              onChange={setF('nombre')}
              placeholder="Ej. Ingeniería de Software II"
              required
            />
          </FormGroup>
        </FormRow>

        {/* ── Fechas ── */}
        <FormRow>
          <FormGroup>
            <Label htmlFor="cur-fi">Fecha de inicio *</Label>
            <Input
              id="cur-fi"
              type="date"
              value={form.fecha_inicio}
              onChange={setF('fecha_inicio')}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="cur-ff">Fecha de fin *</Label>
            <Input
              id="cur-ff"
              type="date"
              value={form.fecha_fin}
              onChange={setF('fecha_fin')}
              min={form.fecha_inicio || undefined}
              required
            />
          </FormGroup>
        </FormRow>

        {/* ── Docente ── */}
        <FormGroup>
          <Label htmlFor="cur-docente">Docente asignado</Label>
          <Select id="cur-docente" value={form.persona_id} onChange={setF('persona_id')}>
            <option value="">— Sin asignar —</option>
            {docentes.map(d => (
              <option key={d.id} value={d.id}>
                {d.nombre} {d.apellido} · {d.correo}
              </option>
            ))}
          </Select>
          <HelperText>Se puede asignar después. Corresponde a <code>persona_id</code> en la tabla curso.</HelperText>
        </FormGroup>

        {/* ── Activo ── */}
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

        {/* ── Aula-Curso-Horario ── */}
        <ScheduleSection>
          <ScheduleTitle>
            <Icon name="schedule" size="sm" />
            Asignaciones de aula y horario
          </ScheduleTitle>

          {asigns.map((asign, idx) => {
            const horSel = horarios.find(h => String(h.id) === String(asign.horario_id));
            const dur = horSel ? duracionTexto(horSel.hora_inicio, horSel.hora_fin) : null;

            return (
              <AsignRow key={idx}>
                {/* Aula */}
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

                {/* Horario (con día incluido) */}
                <FormGroup style={{ marginBottom: 0 }}>
                  {idx === 0 && <Label>Día y horario</Label>}
                  <Select value={asign.horario_id} onChange={setA(idx, 'horario_id')}>
                    <option value="">— Día y horario —</option>
                    {Object.entries(horariosPorDia).map(([dia, hs]) => (
                      <optgroup key={dia} label={dia}>
                        {hs.map(h => {
                          const dur = duracionTexto(h.hora_inicio, h.hora_fin);
                          const yaUsado = horariosUsados.has(String(h.id)) && String(h.id) !== String(asign.horario_id);
                          return (
                            <option key={h.id} value={h.id} disabled={yaUsado}>
                              {h.hora_inicio} – {h.hora_fin}{dur ? ` (${dur})` : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </Select>
                  {dur && idx === 0 && (
                    <HorarioLabel>⏱ {dur}</HorarioLabel>
                  )}
                </FormGroup>

                {/* Botón eliminar */}
                <RemoveBtn
                  type="button"
                  onClick={() => removeAsign(idx)}
                  title="Quitar esta asignación"
                  disabled={asigns.length === 1}
                  style={{ marginTop: idx === 0 ? '1.5rem' : 0 }}
                >
                  <Icon name="remove" size="sm" />
                </RemoveBtn>
              </AsignRow>
            );
          })}

          <AddBtn type="button" onClick={addAsign}>
            <Icon name="add" size="sm" />
            Añadir otra asignación
          </AddBtn>

          <HelperText style={{ marginTop: '.625rem' }}>
            Cada fila representa un registro en <code>aula_curso_horario</code>.
            El día ya está incluido en la franja horaria.
          </HelperText>
        </ScheduleSection>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar cambios' : 'Crear curso'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default CursoModal;