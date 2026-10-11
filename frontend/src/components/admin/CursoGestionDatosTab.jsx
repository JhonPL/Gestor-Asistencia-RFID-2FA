// src/components/admin/CursoGestionDatosTab.jsx
// Pestaña "Datos" del modal de gestión de curso.
// SRP: solo maneja el formulario de datos del curso y las asignaciones aula-horario.

import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import * as XLSX from 'xlsx';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  FormGroup, Label, Input, Select,
  FormRow, FormActions, HelperText,
} from '../ui/FormElements';
import { getPersonas } from '../../api/personasApi';
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

const InitialStudentsSection = styled.div`
  margin-top: 1.25rem;
  padding: 1.25rem 0;
  border-top: 1px solid ${theme.colors.outlineVariant}26;
`;

const InitialStudentResult = styled.button`
  display: block;
  width: 100%;
  padding: .625rem .75rem;
  text-align: left;
  color: ${theme.colors.onSurface};
  background: ${theme.colors.surfaceContainerLowest};
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
  item, isEditing, onSave, onClose, token,
  docentes = [], aulas = [], horarios = [],
}) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [asigns,  setAsigns]  = useState([{ ...EMPTY_ACH }]);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState(null);
  const [showInitialStudents, setShowInitialStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [studentError, setStudentError] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [importedEmails, setImportedEmails] = useState([]);
  const [importedFile, setImportedFile] = useState('');
  const [importError, setImportError] = useState(null);
  const studentSearchTimer = useRef(null);
  const studentFileInput = useRef(null);

  useEffect(() => () => clearTimeout(studentSearchTimer.current), []);

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

  const handleStudentSearch = (e) => {
    const query = e.target.value;
    setStudentSearch(query);
    setStudentError(null);
    clearTimeout(studentSearchTimer.current);
    if (query.trim().length < 2) {
      setStudentResults([]);
      return;
    }

    studentSearchTimer.current = setTimeout(async () => {
      setStudentSearchLoading(true);
      try {
        const data = await getPersonas(token, {
          rol: 'estudiante', activo: true, search: query.trim(), page: 1, limit: 50,
        });
        const selectedIds = new Set(selectedStudents.map(student => student.id));
        setStudentResults((data.items ?? []).filter(student => !selectedIds.has(student.id)));
      } catch (err) {
        setStudentError(err.message);
        setStudentResults([]);
      } finally {
        setStudentSearchLoading(false);
      }
    }, 300);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudents(current => current.some(item => item.id === student.id)
      ? current
      : [...current, student]
    );
    setStudentSearch('');
    setStudentResults([]);
  };

  const handleInitialStudentsFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!rows.length) throw new Error('El archivo no contiene filas de estudiantes.');

      const normalizedRows = rows.map(row => Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key.toLowerCase().trim().replace(/\s+/g, '_'), value,
        ]),
      ));
      const emails = normalizedRows.map(row =>
        String(row.correo ?? row.email ?? '').trim().toLowerCase()
      );
      if (emails.some(email => !email)) {
        throw new Error('Todas las filas deben incluir la columna correo.');
      }

      setImportedEmails([...new Set(emails)]);
      setImportedFile(file.name);
    } catch (err) {
      setImportedEmails([]);
      setImportedFile('');
      setImportError(err.message || 'No se pudo leer el archivo.');
    }
  };

  const downloadInitialStudentsCsvTemplate = () => {
    const blob = new Blob(['\uFEFFcorreo\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_estudiantes_curso.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadInitialStudentsExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([['correo']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');
    XLSX.writeFile(workbook, 'plantilla_estudiantes_curso.xlsx');
  };

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
        ...(isEditing ? {} : {
          estudiantes_ids: selectedStudents.map(student => student.id),
          correos_estudiantes: importedEmails,
        }),
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

      {!isEditing && (
        <InitialStudentsSection>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}>
            <div>
              <AsignSectionLabel>Estudiantes iniciales (opcional)</AsignSectionLabel>
              <HelperText>Inscríbelos ahora o deja el curso sin estudiantes para agregarlos después.</HelperText>
            </div>
            <Button
              type="button"
              variant="outlined"
              size="sm"
              onClick={() => setShowInitialStudents(show => !show)}
            >
              <Icon name="group_add" size="sm" />
              {showInitialStudents ? 'Ocultar' : 'Agregar ahora'}
            </Button>
          </div>

          {showInitialStudents && (
            <div style={{ display: 'grid', gap: '.875rem', marginTop: '.875rem' }}>
              <FormGroup style={{ marginBottom: 0 }}>
                <Label htmlFor="cg-estudiante-buscar">Inscribir individualmente</Label>
                <div style={{ position: 'relative' }}>
                  <Input
                    id="cg-estudiante-buscar"
                    value={studentSearch}
                    onChange={handleStudentSearch}
                    placeholder="Buscar estudiante por nombre o correo…"
                    autoComplete="off"
                  />
                  {studentSearchLoading && (
                    <Spinner style={{ position: 'absolute', right: '.875rem', top: '.875rem' }} />
                  )}
                  {studentResults.length > 0 && (
                    <div role="listbox" style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      zIndex: 10, maxHeight: '13rem', overflowY: 'auto',
                      background: theme.colors.surfaceContainerLowest,
                      border: `1px solid ${theme.colors.outlineVariant}`,
                      borderRadius: theme.radii.md, boxShadow: theme.shadows.md,
                    }}>
                      {studentResults.map(student => (
                        <InitialStudentResult
                          key={student.id}
                          type="button"
                          role="option"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <strong>{student.nombre} {student.apellido}</strong>
                          <span style={{ display: 'block', fontSize: theme.fontSizes.xs, color: theme.colors.outline }}>
                            {student.correo}
                          </span>
                        </InitialStudentResult>
                      ))}
                    </div>
                  )}
                </div>
                {studentError && <ErrorMsg>{studentError}</ErrorMsg>}
              </FormGroup>

              {selectedStudents.length > 0 && (
                <div style={{ display: 'grid', gap: '.375rem' }}>
                  {selectedStudents.map(student => (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ flex: 1, fontSize: theme.fontSizes.sm }}>
                        {student.nombre} {student.apellido}
                        <span style={{ display: 'block', fontSize: theme.fontSizes.xs, color: theme.colors.outline }}>
                          {student.correo}
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudents(current => current.filter(item => item.id !== student.id))}
                        title={`Quitar a ${student.nombre} ${student.apellido}`}
                      >
                        <Icon name="close" size="sm" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: `1px solid ${theme.colors.outlineVariant}26`, paddingTop: '.875rem' }}>
                <Label>Inscribir varios desde archivo</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', flexWrap: 'wrap' }}>
                  <Button type="button" variant="outlined" size="sm" onClick={() => studentFileInput.current?.click()}>
                    <Icon name="upload_file" size="sm" />Seleccionar CSV o Excel
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={downloadInitialStudentsCsvTemplate}>
                    <Icon name="download" size="sm" />Plantilla CSV
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={downloadInitialStudentsExcelTemplate}>
                    <Icon name="download" size="sm" />Plantilla Excel
                  </Button>
                  {importedFile && (
                    <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.onSurfaceVariant }}>
                      {importedFile}: {importedEmails.length} correo(s)
                    </span>
                  )}
                  {importedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setImportedEmails([]); setImportedFile(''); }}
                    >
                      <Icon name="close" size="sm" />Quitar archivo
                    </Button>
                  )}
                </div>
                <HelperText>
                  Primera hoja del Excel o encabezado CSV: <code>correo</code>. Agrega un correo institucional de un estudiante registrado por fila.
                  Ejemplo: <code>ana@campusucc.edu.co</code>. No agregues títulos ni otras columnas.
                </HelperText>
                {importError && <ErrorMsg>{importError}</ErrorMsg>}
                <input
                  ref={studentFileInput}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleInitialStudentsFile}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}
        </InitialStudentsSection>
      )}

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