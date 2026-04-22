// src/components/admin/CursoGestionModal.jsx
// Modal de dos pestañas:
//   Tab 1 "Datos" — formulario del curso + asignaciones aula-horario
//   Tab 2 "Estudiantes" — lista inscritos + agregar uno + importar Excel/CSV

import { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';
import theme from '../../styles/theme';
import {
  getEstudiantes, getEstudiantesDisponibles,
  inscribirEstudiante, toggleInscripcion, eliminarInscripcion,
  importarEstudiantes,
} from '../../api/cursosApi';
import { useAuth } from '../../context/AuthContext';

// ─── Styled ───────────────────────────────────────────────────────────────────

const TabsRow = styled.div`
  display: flex; gap: 0; border-bottom: 2px solid ${theme.colors.surfaceContainerHigh};
  margin: -1.75rem -1.75rem 1.5rem;
  padding: 0 1.75rem;
`;
const TabBtn = styled.button`
  display: flex; align-items: center; gap: .375rem;
  padding: .875rem 1.25rem;
  font-size: ${theme.fontSizes.sm}; font-weight: 600;
  color: ${({ $a }) => $a ? theme.colors.primary : theme.colors.onSurfaceVariant};
  border-bottom: 3px solid ${({ $a }) => $a ? theme.colors.primary : 'transparent'};
  margin-bottom: -2px; transition: all ${theme.transitions.fast};
  &:hover { color: ${theme.colors.primary}; }
`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const Spinner = styled.span`
  display:inline-block; width:.9rem; height:.9rem;
  border:2px solid ${theme.colors.primaryFixed};
  border-top-color:${theme.colors.primary};
  border-radius:50%; animation:${spin} .7s linear infinite; flex-shrink:0;
`;
const ErrorMsg = styled.p`
  font-size:${theme.fontSizes.xs}; color:${theme.colors.error};
  background:${theme.colors.errorContainer}; padding:.5rem .875rem;
  border-radius:${theme.radii.md}; margin-bottom:.75rem;
`;
const StudentRow = styled.div`
  display:flex; align-items:center; gap:.75rem;
  padding:.75rem 0;
  border-bottom:1px solid ${theme.colors.surfaceContainerHigh}26;
  opacity:${({ $inactivo }) => $inactivo ? 0.5 : 1};
`;
const Avatar = styled.div`
  width:2.25rem; height:2.25rem; border-radius:${theme.radii.full};
  background:${theme.colors.primaryFixed}; color:${theme.colors.primary};
  display:flex; align-items:center; justify-content:center;
  font-size:${theme.fontSizes.xs}; font-weight:700; flex-shrink:0;
`;
const StudentInfo = styled.div`flex:1; min-width:0;`;
const SName = styled.p`font-size:${theme.fontSizes.sm}; font-weight:600; color:${theme.colors.onSurface};`;
const SMeta = styled.p`font-size:${theme.fontSizes.xs}; color:${theme.colors.outline}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;`;
const ActionBtn = styled.button`
  padding:.3rem; border-radius:${theme.radii.md};
  color:${({ $danger }) => $danger ? theme.colors.error : theme.colors.onSurfaceVariant};
  transition:all ${theme.transitions.fast};
  &:hover{background:${({ $danger }) => $danger ? theme.colors.errorContainer : theme.colors.surfaceContainerHigh};}
  &:disabled{opacity:.3; cursor:not-allowed;}
`;
const EmptyStudents = styled.div`
  padding:2.5rem; text-align:center; color:${theme.colors.outline};
  font-size:${theme.fontSizes.sm};
`;
const SearchDropWrap = styled.div`position:relative;`;
const DropList = styled.ul`
  position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:200;
  background:${theme.colors.surfaceContainerLowest};
  border:1px solid ${theme.colors.outlineVariant}4D;
  border-radius:${theme.radii.lg}; box-shadow:${theme.shadows.md};
  max-height:14rem; overflow-y:auto; list-style:none;
`;
const DropItem = styled.li`
  padding:.625rem 1rem; cursor:pointer; font-size:${theme.fontSizes.sm};
  transition:background ${theme.transitions.fast};
  &:hover{ background:${theme.colors.primaryFixed}; }
`;
const DropMeta = styled.span`font-size:${theme.fontSizes.xs}; color:${theme.colors.outline}; margin-left:.5rem;`;
const SectionDivider = styled.div`
  display:flex; align-items:center; gap:.75rem; margin:1.25rem 0 .875rem;
  font-size:${theme.fontSizes.xs}; font-weight:700; text-transform:uppercase;
  letter-spacing:.1em; color:${theme.colors.outline};
  &::after{content:''; flex:1; height:1px; background:${theme.colors.surfaceContainerHigh};}
`;
const ImportPanel = styled.div`
  border:2px dashed ${theme.colors.outlineVariant};
  border-radius:${theme.radii.xl}; padding:1.5rem;
  background:${theme.colors.surfaceContainerLow};
`;
const ImportDrop = styled.div`
  text-align:center; padding:1.5rem .75rem; cursor:pointer;
  &:hover>*{ color:${theme.colors.primary}; }
`;
const PreviewTable = styled.div`
  max-height:14rem; overflow-y:auto; margin-top:.75rem;
  border-radius:${theme.radii.md}; border:1px solid ${theme.colors.surfaceContainerHigh};
`;
const PTable = styled.table`width:100%; border-collapse:collapse; font-size:${theme.fontSizes.xs};`;
const PTh = styled.th`
  padding:.5rem .75rem; text-align:left; background:${theme.colors.surfaceContainerLow};
  color:${theme.colors.outline}; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
  position:sticky; top:0;
`;
const PTd = styled.td`
  padding:.5rem .75rem; border-top:1px solid ${theme.colors.surfaceContainerHigh}26;
  color:${({ $error }) => $error ? theme.colors.error : theme.colors.onSurface};
`;
const ResultBanner = styled.div`
  padding:.875rem 1rem; border-radius:${theme.radii.lg};
  background:${theme.colors.secondaryFixed}; color:${theme.colors.secondary};
  font-size:${theme.fontSizes.sm}; display:flex; flex-direction:column; gap:.25rem;
`;

// ── Chip de tipo de archivo ────────────────────────────────────────────────────
const FileTypeBadge = styled.span`
  display:inline-flex; align-items:center; gap:.3rem;
  padding:.2rem .65rem; border-radius:${theme.radii.full};
  font-size:${theme.fontSizes.xs}; font-weight:700; text-transform:uppercase;
  background:${({ $csv }) => $csv ? theme.colors.secondaryFixed : theme.colors.primaryFixed};
  color:${({ $csv }) => $csv ? theme.colors.secondary : theme.colors.primary};
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const duracion = (inicio, fin) => {
  if (!inicio || !fin) return '';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min <= 0) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
};

/**
 * Parsea texto CSV (RFC 4180) con soporte para:
 * - Campos entre comillas con comas internas
 * - Separadores ; o ,  (autodetectado)
 * - BOM UTF-8
 * Devuelve array de objetos usando la primera fila como cabecera.
 */
function parseCSV(text) {
  // Quitar BOM si existe
  const clean = text.replace(/^\uFEFF/, '');

  // Autodetectar separador: si la primera línea tiene más ; que , se usa ;
  const firstLine = clean.split('\n')[0] ?? '';
  const sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

  // Tokenizador simple RFC 4180
  const tokenize = (line) => {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          // comilla doble escapada ""
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === sep) {
        fields.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    return fields;
  };

  const lines = clean.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = tokenize(lines[0]).map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const vals = tokenize(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

/** Normaliza claves de una fila de Excel (XLSX.utils.sheet_to_json) */
function normalizeRow(row) {
  const norm = {};
  Object.entries(row).forEach(([k, v]) => {
    norm[k.toLowerCase().trim().replace(/\s+/g, '_')] = String(v).trim();
  });
  return norm;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

const CursoGestionModal = ({
  isOpen, onClose, item = null, onSave,
  docentes = [], aulas = [], horarios = [],
}) => {
  const { token } = useAuth();
  const isEditing = !!item;

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('datos');

  useEffect(() => {
    if (isOpen) setActiveTab('datos');
  }, [isOpen, item?.id]);

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1 — DATOS DEL CURSO
  // ───────────────────────────────────────────────────────────────────────────

  const EMPTY_FORM = { codigo:'', nombre:'', fecha_inicio:'', fecha_fin:'', persona_id:'', activo:true };
  const EMPTY_ACH  = { aula_id:'', horario_id:'' };

  const [form,    setForm]    = useState(EMPTY_FORM);
  const [asigns,  setAsigns]  = useState([{ ...EMPTY_ACH }]);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
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
      setAsigns(horariosCurso.length > 0
        ? horariosCurso.map(h => ({ aula_id: String(h.aula_id), horario_id: String(h.horario_id) }))
        : [{ ...EMPTY_ACH }]
      );
    } else {
      setForm(EMPTY_FORM);
      setAsigns([{ ...EMPTY_ACH }]);
    }
    setFormErr(null);
  }, [isOpen, item]);

  const setF = (k) => (e) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const setA = (idx, k) => (e) =>
    setAsigns(p => p.map((a, i) => i === idx ? { ...a, [k]: e.target.value } : a));

  const handleSubmitDatos = async (e) => {
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

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2 — ESTUDIANTES
  // ───────────────────────────────────────────────────────────────────────────

  const [estudiantes,  setEstudiantes]  = useState([]);
  const [studLoading,  setStudLoading]  = useState(false);
  const [studError,    setStudError]    = useState(null);
  const [studSearch,   setStudSearch]   = useState('');

  // Agregar uno
  const [addSearch,    setAddSearch]    = useState('');
  const [addResults,   setAddResults]   = useState([]);
  const [addLoading,   setAddLoading]   = useState(false);
  const [showDrop,     setShowDrop]     = useState(false);
  const addSearchTimer = useRef(null);

  // Import file
  const [showImport,   setShowImport]   = useState(false);
  const [importRows,   setImportRows]   = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [fileType,     setFileType]     = useState(null); // 'excel' | 'csv'
  const fileInputRef = useRef(null);

  const loadEstudiantes = useCallback(async () => {
    if (!item?.id || !token) return;
    setStudLoading(true);
    setStudError(null);
    try {
      const rows = await getEstudiantes(token, item.id);
      setEstudiantes(rows);
    } catch (err) {
      setStudError(err.message);
    } finally {
      setStudLoading(false);
    }
  }, [item?.id, token]);

  useEffect(() => {
    if (activeTab === 'estudiantes' && isOpen) {
      loadEstudiantes();
      setAddSearch('');
      setAddResults([]);
      setShowDrop(false);
      setShowImport(false);
      setImportRows([]);
      setImportResult(null);
      setFileType(null);
    }
  }, [activeTab, isOpen, loadEstudiantes]);

  // Búsqueda con debounce
  const handleAddSearchChange = (e) => {
    const q = e.target.value;
    setAddSearch(q);
    clearTimeout(addSearchTimer.current);
    if (q.trim().length < 2) { setAddResults([]); setShowDrop(false); return; }
    addSearchTimer.current = setTimeout(async () => {
      setAddLoading(true);
      try {
        const rows = await getEstudiantesDisponibles(token, item.id, q);
        setAddResults(rows);
        setShowDrop(true);
      } catch {
        setAddResults([]);
      } finally {
        setAddLoading(false);
      }
    }, 300);
  };

  const handleInscribir = async (persona) => {
    setShowDrop(false);
    setAddSearch('');
    try {
      const nuevo = await inscribirEstudiante(token, item.id, persona.id);
      setEstudiantes(p => [nuevo, ...p]);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleToggle = async (est) => {
    try {
      await toggleInscripcion(token, item.id, est.lista_id, !est.activo);
      setEstudiantes(p => p.map(e => e.lista_id === est.lista_id ? { ...e, activo: !e.activo } : e));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEliminar = async (est) => {
    const msg = est.total_asistencias > 0
      ? `"${est.nombre} ${est.apellido}" tiene ${est.total_asistencias} registro(s) de asistencia y será desactivado (no eliminado). ¿Continuar?`
      : `¿Eliminar la inscripción de "${est.nombre} ${est.apellido}"?`;
    if (!window.confirm(msg)) return;
    try {
      const r = await eliminarInscripcion(token, item.id, est.lista_id);
      if (r.accion === 'eliminado') {
        setEstudiantes(p => p.filter(e => e.lista_id !== est.lista_id));
      } else {
        setEstudiantes(p => p.map(e => e.lista_id === est.lista_id ? { ...e, activo: false } : e));
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Leer archivo (Excel o CSV) ────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const isCsv = ext === 'csv';

    setImportRows([]);
    setImportResult(null);
    setFileType(isCsv ? 'csv' : 'excel');

    if (isCsv) {
      // Leer como texto para el parser propio
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const rows = parseCSV(ev.target.result);
          if (rows.length === 0) {
            alert('El archivo CSV está vacío o no tiene la cabecera correcta.');
            return;
          }
          setImportRows(rows);
        } catch {
          alert('No se pudo leer el CSV. Comprueba que tenga cabecera y codificación UTF-8.');
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      // Leer como ArrayBuffer para SheetJS
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb   = XLSX.read(ev.target.result, { type: 'array' });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const raw  = XLSX.utils.sheet_to_json(ws, { defval: '' });
          const rows = raw.map(normalizeRow);
          if (rows.length === 0) {
            alert('La hoja de cálculo no contiene datos.');
            return;
          }
          setImportRows(rows);
        } catch {
          alert('No se pudo leer el archivo. Asegúrate de que sea .xlsx o .xls válido.');
        }
      };
      reader.readAsArrayBuffer(file);
    }

    e.target.value = ''; // reset
  };

  const handleConfirmarImport = async () => {
    if (!importRows.length) return;
    setImporting(true);
    try {
      const payload = importRows.map(r => ({
        correo:         r.correo?.toLowerCase(),
        nombre:         r.nombre,
        apellido:       r.apellido,
        codigo_tarjeta: r.codigo_tarjeta || undefined,
      }));
      const result = await importarEstudiantes(token, item.id, payload);
      setImportResult(result);
      if (result.inscritos > 0 || result.reactivados > 0) {
        await loadEstudiantes();
      }
    } catch (err) {
      alert(`Error en importación: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Descargar plantilla Excel
  const descargarPlantillaExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['correo', 'nombre', 'apellido', 'codigo_tarjeta'],
      ['ana.garcia@campusucc.edu.co', 'Ana', 'García', 'RFID-A1B2'],
      ['luis.perez@campusucc.edu.co',  'Luis', 'Pérez', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
    XLSX.writeFile(wb, 'plantilla_estudiantes.xlsx');
  };

  // Descargar plantilla CSV
  const descargarPlantillaCSV = () => {
    const content = [
      'correo,nombre,apellido,codigo_tarjeta',
      'ana.garcia@campusucc.edu.co,Ana,García,RFID-A1B2',
      'luis.perez@campusucc.edu.co,Luis,Pérez,',
    ].join('\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'plantilla_estudiantes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtrado local
  const estudiantesFiltrados = estudiantes.filter(e => {
    if (!studSearch.trim()) return true;
    const q = studSearch.toLowerCase();
    return `${e.nombre} ${e.apellido}`.toLowerCase().includes(q) || e.correo.toLowerCase().includes(q);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Curso: ${item.nombre}` : 'Nuevo curso'} size="lg">

      {/* Tabs (solo en edición) */}
      {isEditing && (
        <TabsRow>
          <TabBtn $a={activeTab === 'datos'} onClick={() => setActiveTab('datos')}>
            <Icon name="info" size="sm" />Datos
          </TabBtn>
          <TabBtn $a={activeTab === 'estudiantes'} onClick={() => setActiveTab('estudiantes')}>
            <Icon name="group" size="sm" />
            Estudiantes
            {estudiantes.filter(e => e.activo).length > 0 && (
              <span style={{
                background: theme.colors.primaryFixed, color: theme.colors.primary,
                borderRadius: 99, padding: '0 .45rem', fontSize: theme.fontSizes.xs, fontWeight: 700,
              }}>
                {estudiantes.filter(e => e.activo).length}
              </span>
            )}
          </TabBtn>
        </TabsRow>
      )}

      {/* ══ TAB DATOS ══ */}
      {activeTab === 'datos' && (
        <form onSubmit={handleSubmitDatos} noValidate>
          {formErr && <ErrorMsg>{formErr}</ErrorMsg>}

          <FormRow>
            <FormGroup>
              <Label htmlFor="cg-codigo">Código del curso</Label>
              <Input id="cg-codigo" value={form.codigo} onChange={setF('codigo')} placeholder="Ej. IS-301" />
              <HelperText>Opcional — único en BD.</HelperText>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="cg-nombre">Nombre del curso *</Label>
              <Input id="cg-nombre" value={form.nombre} onChange={setF('nombre')} placeholder="Ej. Ingeniería de Software II" required />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="cg-fi">Fecha de inicio *</Label>
              <Input id="cg-fi" type="date" value={form.fecha_inicio} onChange={setF('fecha_inicio')} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="cg-ff">Fecha de fin *</Label>
              <Input id="cg-ff" type="date" value={form.fecha_fin} onChange={setF('fecha_fin')} min={form.fecha_inicio || undefined} required />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="cg-docente">Docente asignado</Label>
            <Select id="cg-docente" value={form.persona_id} onChange={setF('persona_id')}>
              <option value="">— Sin asignar —</option>
              {docentes.map(d => (
                <option key={d.id} value={d.id}>{d.nombre} {d.apellido} · {d.correo}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <label style={{ display:'flex', alignItems:'center', gap:'.625rem', cursor:'pointer' }}>
              <input type="checkbox" checked={form.activo} onChange={setF('activo')}
                style={{ width:'1rem', height:'1rem', accentColor:'#000666' }} />
              <span style={{ fontSize:'.875rem', fontWeight:500 }}>Curso activo</span>
            </label>
          </FormGroup>

          {/* Asignaciones aula-horario */}
          <div style={{ marginTop:'1.25rem', paddingTop:'1.25rem', borderTop:`1px solid ${theme.colors.outlineVariant}26` }}>
            <p style={{ fontSize:theme.fontSizes.xs, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:theme.colors.onSurfaceVariant, marginBottom:'.875rem' }}>
              Asignaciones de aula y horario
            </p>

            {asigns.map((asign, idx) => (
              <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'.5rem', alignItems:'end', marginBottom:'.625rem' }}>
                <FormGroup style={{ marginBottom:0 }}>
                  {idx === 0 && <Label>Aula</Label>}
                  <Select value={asign.aula_id} onChange={setA(idx, 'aula_id')}>
                    <option value="">— Aula —</option>
                    {aulas.map(a => <option key={a.id} value={a.id}>{a.numero}{a.nombre ? ` – ${a.nombre}` : ''}</option>)}
                  </Select>
                </FormGroup>

                <FormGroup style={{ marginBottom:0 }}>
                  {idx === 0 && <Label>Día y horario</Label>}
                  <Select value={asign.horario_id} onChange={setA(idx, 'horario_id')}>
                    <option value="">— Horario —</option>
                    {Object.entries(horariosPorDia).map(([dia, hs]) => (
                      <optgroup key={dia} label={dia}>
                        {hs.map(h => {
                          const dur  = duracion(h.hora_inicio, h.hora_fin);
                          const used = horariosUsados.has(String(h.id)) && String(h.id) !== String(asign.horario_id);
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

                <button type="button"
                  disabled={asigns.length === 1}
                  onClick={() => setAsigns(p => p.filter((_, i) => i !== idx))}
                  style={{ width:'2.75rem', height:'2.75rem', borderRadius:theme.radii.md, color:theme.colors.error, display:'flex', alignItems:'center', justifyContent:'center', marginTop: idx === 0 ? '1.5rem' : 0 }}>
                  <Icon name="remove" size="sm" />
                </button>
              </div>
            ))}

            <button type="button"
              onClick={() => setAsigns(p => [...p, { ...EMPTY_ACH }])}
              style={{ display:'inline-flex', alignItems:'center', gap:'.375rem', fontSize:theme.fontSizes.xs, fontWeight:600, color:theme.colors.primary, padding:'.375rem .5rem', borderRadius:theme.radii.md }}>
              <Icon name="add" size="sm" />Añadir asignación
            </button>
          </div>

          <FormActions>
            <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving && <Spinner />}
              {isEditing ? 'Guardar cambios' : 'Crear curso'}
            </Button>
          </FormActions>
        </form>
      )}

      {/* ══ TAB ESTUDIANTES ══ */}
      {activeTab === 'estudiantes' && isEditing && (
        <div>

          {/* Barra superior: búsqueda + importar */}
          <div style={{ display:'flex', gap:'.75rem', alignItems:'flex-start', marginBottom:'1rem', flexWrap:'wrap' }}>
            <SearchDropWrap style={{ flex:1, minWidth:'200px' }}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'.875rem', top:'50%', transform:'translateY(-50%)', color:theme.colors.outline, display:'flex', pointerEvents:'none' }}>
                  {addLoading ? <Spinner /> : <Icon name="person_search" size="sm" />}
                </span>
                <Input
                  value={addSearch}
                  onChange={handleAddSearchChange}
                  onFocus={() => addResults.length && setShowDrop(true)}
                  onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                  placeholder="Buscar estudiante para inscribir…"
                  style={{ paddingLeft:'2.75rem' }}
                />
              </div>
              {showDrop && addResults.length > 0 && (
                <DropList>
                  {addResults.map(p => (
                    <DropItem key={p.id} onMouseDown={() => handleInscribir(p)}>
                      {p.nombre} {p.apellido}
                      <DropMeta>{p.correo}</DropMeta>
                      {p.programa && <DropMeta>· {p.programa}</DropMeta>}
                    </DropItem>
                  ))}
                </DropList>
              )}
              {showDrop && addResults.length === 0 && !addLoading && (
                <DropList>
                  <DropItem style={{ cursor:'default', color:theme.colors.outline }}>Sin resultados</DropItem>
                </DropList>
              )}
            </SearchDropWrap>

            <Button variant="outlined" size="sm"
              onClick={() => { setShowImport(v => !v); setImportResult(null); setImportRows([]); setFileType(null); }}>
              <Icon name="upload_file" size="sm" />
              {showImport ? 'Cerrar import' : 'Importar archivo'}
            </Button>
          </div>

          {/* ── Panel de importación ──────────────────────────────────────────── */}
          {showImport && (
            <ImportPanel style={{ marginBottom:'1.25rem' }}>
              {/* Cabecera del panel */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.875rem', flexWrap:'wrap', gap:'.5rem' }}>
                <p style={{ fontSize:theme.fontSizes.sm, fontWeight:600, color:theme.colors.onSurface }}>
                  Importación masiva
                </p>
                <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={descargarPlantillaExcel}>
                    <Icon name="download" size="sm" />Plantilla Excel
                  </Button>
                  <Button variant="ghost" size="sm" onClick={descargarPlantillaCSV}>
                    <Icon name="download" size="sm" />Plantilla CSV
                  </Button>
                </div>
              </div>

              <HelperText style={{ marginBottom:'.875rem' }}>
                Acepta <strong>.xlsx</strong>, <strong>.xls</strong> y <strong>.csv</strong>.
                Columnas requeridas: <code>correo</code>, <code>nombre</code>, <code>apellido</code>.
                Opcional: <code>codigo_tarjeta</code>.
                El CSV puede usar <code>,</code> o <code>;</code> como separador.
              </HelperText>

              {/* Zona de selección */}
              {importRows.length === 0 ? (
                <ImportDrop onClick={() => fileInputRef.current?.click()}>
                  <Icon name="cloud_upload" size="lg" style={{ color:theme.colors.outline, marginBottom:'.5rem' }} />
                  <p style={{ fontSize:theme.fontSizes.sm, color:theme.colors.outline }}>
                    Clic para seleccionar archivo (.xlsx, .xls o .csv)
                  </p>
                </ImportDrop>
              ) : (
                <>
                  {/* Badge del tipo de archivo */}
                  <div style={{ display:'flex', alignItems:'center', gap:'.625rem', marginBottom:'.75rem' }}>
                    <FileTypeBadge $csv={fileType === 'csv'}>
                      <Icon name={fileType === 'csv' ? 'description' : 'table_chart'} size="sm" />
                      {fileType === 'csv' ? 'CSV' : 'Excel'}
                    </FileTypeBadge>
                    <span style={{ fontSize:theme.fontSizes.xs, color:theme.colors.outline }}>
                      {importRows.length} fila(s) detectadas
                    </span>
                  </div>

                  {/* Previsualización */}
                  <PreviewTable>
                    <PTable>
                      <thead>
                        <tr>
                          <PTh>#</PTh>
                          <PTh>Correo</PTh>
                          <PTh>Nombre</PTh>
                          <PTh>Apellido</PTh>
                          <PTh>Tarjeta</PTh>
                          <PTh>Estado</PTh>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.slice(0, 30).map((r, i) => {
                          const faltante = !r.correo || !r.nombre || !r.apellido;
                          return (
                            <tr key={i}>
                              <PTd $error={faltante}>{i + 1}</PTd>
                              <PTd $error={!r.correo}>{r.correo || '—'}</PTd>
                              <PTd $error={!r.nombre}>{r.nombre || '—'}</PTd>
                              <PTd $error={!r.apellido}>{r.apellido || '—'}</PTd>
                              <PTd>{r.codigo_tarjeta || '—'}</PTd>
                              <PTd $error={faltante}>{faltante ? '⚠ Incompleto' : '✓'}</PTd>
                            </tr>
                          );
                        })}
                      </tbody>
                    </PTable>
                  </PreviewTable>
                  {importRows.length > 30 && (
                    <p style={{ fontSize:theme.fontSizes.xs, color:theme.colors.outline, marginTop:'.375rem' }}>
                      … y {importRows.length - 30} fila(s) más
                    </p>
                  )}

                  {/* Resultado de importación */}
                  {importResult && (
                    <ResultBanner style={{ marginTop:'.875rem' }}>
                      <strong>Resultado de la importación:</strong>
                      <span>✓ {importResult.inscritos} inscrito(s) nuevos · {importResult.creados} persona(s) creadas · {importResult.reactivados} reactivado(s)</span>
                      <span>— {importResult.ya_inscritos} ya estaban inscritos</span>
                      {importResult.errores.length > 0 && (
                        <span style={{ color:theme.colors.error }}>
                          ✗ {importResult.errores.length} error(es):&nbsp;
                          {importResult.errores.slice(0, 3).map(e => `${e.correo}: ${e.motivo}`).join(' | ')}
                        </span>
                      )}
                    </ResultBanner>
                  )}

                  <div style={{ display:'flex', gap:'.75rem', marginTop:'.875rem' }}>
                    <Button variant="ghost" size="sm"
                      onClick={() => { setImportRows([]); setImportResult(null); setFileType(null); }}>
                      Limpiar
                    </Button>
                    {!importResult && (
                      <Button size="sm" onClick={handleConfirmarImport} disabled={importing}>
                        {importing && <Spinner />}
                        Confirmar importación ({importRows.length})
                      </Button>
                    )}
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                style={{ display:'none' }}
              />
            </ImportPanel>
          )}

          {/* ── Filtro lista ───────────────────────────────────────────────────── */}
          <div style={{ position:'relative', marginBottom:'.875rem' }}>
            <span style={{ position:'absolute', left:'.875rem', top:'50%', transform:'translateY(-50%)', color:theme.colors.outline, display:'flex', pointerEvents:'none' }}>
              <Icon name="search" size="sm" />
            </span>
            <Input
              value={studSearch}
              onChange={e => setStudSearch(e.target.value)}
              placeholder="Filtrar por nombre o correo…"
              style={{ paddingLeft:'2.75rem' }}
            />
          </div>

          {/* ── Lista de estudiantes ───────────────────────────────────────────── */}
          {studLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}>
              <Spinner style={{ width:'1.5rem', height:'1.5rem' }} />
            </div>
          ) : studError ? (
            <ErrorMsg>{studError}</ErrorMsg>
          ) : estudiantesFiltrados.length === 0 ? (
            <EmptyStudents>
              <Icon name="group" size="lg" style={{ opacity:.3, marginBottom:'.5rem' }} />
              <p>{estudiantes.length === 0 ? 'No hay estudiantes inscritos.' : 'Sin resultados para ese filtro.'}</p>
            </EmptyStudents>
          ) : (
            <div style={{ maxHeight:'22rem', overflowY:'auto' }}>
              {['activos', 'inactivos'].map(grupo => {
                const lista = estudiantesFiltrados.filter(e => grupo === 'activos' ? e.activo : !e.activo);
                if (!lista.length) return null;
                return (
                  <div key={grupo}>
                    <SectionDivider>
                      {grupo === 'activos' ? `Inscritos (${lista.length})` : `Inactivos (${lista.length})`}
                    </SectionDivider>
                    {lista.map(est => (
                      <StudentRow key={est.lista_id} $inactivo={!est.activo}>
                        <Avatar>{est.nombre[0]}{est.apellido[0]}</Avatar>
                        <StudentInfo>
                          <SName>{est.nombre} {est.apellido}</SName>
                          <SMeta>{est.correo}{est.programa ? ` · ${est.programa}` : ''}</SMeta>
                        </StudentInfo>
                        {est.total_asistencias > 0 && (
                          <span style={{ fontSize:theme.fontSizes.xs, color:theme.colors.outline, background:theme.colors.surfaceContainerHigh, padding:'2px 8px', borderRadius:99, flexShrink:0 }}>
                            {est.total_asistencias} asist.
                          </span>
                        )}
                        <ActionBtn title={est.activo ? 'Desactivar inscripción' : 'Reactivar inscripción'}
                          onClick={() => handleToggle(est)}>
                          <Icon name={est.activo ? 'toggle_on' : 'toggle_off'} size="sm" />
                        </ActionBtn>
                        <ActionBtn $danger title="Eliminar / retirar del curso"
                          onClick={() => handleEliminar(est)}>
                          <Icon name="person_remove" size="sm" />
                        </ActionBtn>
                      </StudentRow>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop:'1rem', display:'flex', justifyContent:'flex-end' }}>
            <Button variant="outlined" size="sm" onClick={loadEstudiantes}>
              <Icon name="refresh" size="sm" />Actualizar
            </Button>
          </div>
        </div>
      )}

      {/* Mensaje si se intenta abrir estudiantes en un curso nuevo */}
      {activeTab === 'estudiantes' && !isEditing && (
        <EmptyStudents>
          Guarda el curso primero para gestionar estudiantes.
        </EmptyStudents>
      )}
    </Modal>
  );
};

export default CursoGestionModal;