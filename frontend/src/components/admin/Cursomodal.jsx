import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';
import theme from '../../styles/theme';

/**
 * CursoModal — crear o editar un curso con asignación de docente y programa.
 * También gestiona la tabla aula_curso_horario (franjas horarias del curso).
 */

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
`;

const ScheduleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: .5rem;
  align-items: end;
  margin-bottom: .5rem;
`;

const RemoveBtn = styled.button`
  width: 2.5rem;
  height: 2.75rem;
  border-radius: ${theme.radii.md};
  color: ${theme.colors.error};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background ${theme.transitions.fast};
  &:hover { background: ${theme.colors.errorContainer}; }
`;

const AddFranja = styled.button`
  display: flex;
  align-items: center;
  gap: .375rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.primary};
  padding: .375rem .5rem;
  border-radius: ${theme.radii.md};
  transition: background ${theme.transitions.fast};
  &:hover { background: ${theme.colors.primaryFixed}; }
`;

const EMPTY = {
  codigo: '', nombre: '', programa_id: '', docente_id: '',
  creditos: '3', semestre: '', activo: true,
};

const EMPTY_FRANJA = { dia_id: '', aula_id: '', horario_id: '' };

const CursoModal = ({
  isOpen, onClose, item = null, onSave,
  programas = [], docentes = [], aulas = [], horarios = [], dias = [],
}) => {
  const [form, setForm] = useState(EMPTY);
  const [franjas, setFranjas] = useState([{ ...EMPTY_FRANJA }]);
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setForm({
        codigo:      item.codigo ?? '',
        nombre:      item.nombre ?? '',
        programa_id: item.programa_id ?? '',
        docente_id:  item.docente_id ?? '',
        creditos:    item.creditos ?? '3',
        semestre:    item.semestre ?? '',
        activo:      item.activo ?? true,
      });
      // En producción aquí se cargarían las franjas existentes del curso
      setFranjas([{ ...EMPTY_FRANJA }]);
    } else {
      setForm(EMPTY);
      setFranjas([{ ...EMPTY_FRANJA }]);
    }
  }, [item, isOpen]);

  const set = (k) => (e) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const setFranja = (idx, k) => (e) => {
    setFranjas(prev => prev.map((f, i) => i === idx ? { ...f, [k]: e.target.value } : f));
  };

  const addFranja = () => setFranjas(prev => [...prev, { ...EMPTY_FRANJA }]);

  const removeFranja = (idx) => {
    if (franjas.length === 1) return;
    setFranjas(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim() || !form.programa_id) return;

    const programa = programas.find(p => p.id === Number(form.programa_id));
    const docente  = docentes.find(d => d.id === Number(form.docente_id));

    onSave({
      ...item,
      id:           item?.id ?? Date.now(),
      codigo:       form.codigo.trim().toUpperCase(),
      nombre:       form.nombre.trim(),
      programa_id:  Number(form.programa_id),
      programa:     programa?.nombre ?? '',
      docente_id:   form.docente_id ? Number(form.docente_id) : null,
      docente:      docente ? `${docente.nombre} ${docente.apellido}` : null,
      creditos:     Number(form.creditos),
      semestre:     form.semestre ? Number(form.semestre) : null,
      activo:       form.activo,
      totalEstudiantes: item?.totalEstudiantes ?? 0,
      // Las franjas se guardarían en aula_curso_horario desde el backend
      _franjas: franjas.filter(f => f.dia_id && f.aula_id && f.horario_id),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar curso' : 'Nuevo curso'} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <FormRow>
          <FormGroup>
            <Label htmlFor="cur-codigo">Código del curso *</Label>
            <Input id="cur-codigo" value={form.codigo} onChange={set('codigo')} placeholder="Ej. IS-301" required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="cur-creditos">Créditos</Label>
            <Input id="cur-creditos" type="number" min="1" max="10" value={form.creditos} onChange={set('creditos')} />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="cur-nombre">Nombre del curso *</Label>
          <Input id="cur-nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Ingeniería de Software II" required />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label htmlFor="cur-programa">Programa académico *</Label>
            <Select id="cur-programa" value={form.programa_id} onChange={set('programa_id')} required>
              <option value="">— Seleccionar —</option>
              {programas.filter(p => p.activo).map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="cur-semestre">Semestre</Label>
            <Select id="cur-semestre" value={form.semestre} onChange={set('semestre')}>
              <option value="">— Ninguno —</option>
              {[1,2,3,4,5,6,7,8,9,10].map(s => (
                <option key={s} value={s}>Semestre {s}</option>
              ))}
            </Select>
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="cur-docente">Docente asignado</Label>
          <Select id="cur-docente" value={form.docente_id} onChange={set('docente_id')}>
            <option value="">— Sin asignar —</option>
            {docentes.map(d => (
              <option key={d.id} value={d.id}>{d.nombre} {d.apellido} — {d.correo}</option>
            ))}
          </Select>
          <HelperText>El docente puede ser asignado después.</HelperText>
        </FormGroup>

        <FormGroup>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.625rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.activo} onChange={set('activo')} style={{ width: '1rem', height: '1rem', accentColor: '#000666' }} />
            <span style={{ fontSize: '.875rem', fontWeight: 500 }}>Curso activo en el semestre actual</span>
          </label>
        </FormGroup>

        {/* ── Franjas horarias ── */}
        <ScheduleSection>
          <ScheduleTitle>Franjas horarias (aula · día · horario)</ScheduleTitle>
          {franjas.map((franja, idx) => (
            <ScheduleRow key={idx}>
              <FormGroup style={{ marginBottom: 0 }}>
                {idx === 0 && <Label>Día</Label>}
                <Select value={franja.dia_id} onChange={setFranja(idx, 'dia_id')}>
                  <option value="">Día</option>
                  {dias.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </Select>
              </FormGroup>
              <FormGroup style={{ marginBottom: 0 }}>
                {idx === 0 && <Label>Aula</Label>}
                <Select value={franja.aula_id} onChange={setFranja(idx, 'aula_id')}>
                  <option value="">Aula</option>
                  {aulas.filter(a => a.activo).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </Select>
              </FormGroup>
              <FormGroup style={{ marginBottom: 0 }}>
                {idx === 0 && <Label>Franja</Label>}
                <Select value={franja.horario_id} onChange={setFranja(idx, 'horario_id')}>
                  <option value="">Horario</option>
                  {horarios.map(h => (
                    <option key={h.id} value={h.id}>{h.hora_inicio} – {h.hora_fin}</option>
                  ))}
                </Select>
              </FormGroup>
              <RemoveBtn type="button" onClick={() => removeFranja(idx)} title="Eliminar franja" disabled={franjas.length === 1}>
                <Icon name="remove" size="sm" />
              </RemoveBtn>
            </ScheduleRow>
          ))}
          <AddFranja type="button" onClick={addFranja}>
            <Icon name="add" size="sm" />Añadir otra franja
          </AddFranja>
          <HelperText style={{ marginTop: '.5rem' }}>
            Cada franja asocia el curso con un aula, día y horario específico.
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