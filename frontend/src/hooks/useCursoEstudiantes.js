// src/hooks/useCursoEstudiantes.js
// Encapsula todo el estado y las operaciones de la pestaña "Estudiantes" del modal de curso.

import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  getEstudiantes, getEstudiantesDisponibles,
  inscribirEstudiante, toggleInscripcion, eliminarInscripcion,
  importarEstudiantes,
} from '../api/cursosApi';

// ── Helpers de parseo ─────────────────────────────────────────────────────────

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const firstLine = clean.split('\n')[0] ?? '';
  const sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

  const tokenize = (line) => {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else { cur += ch; }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === sep) {
        fields.push(cur.trim());
        cur = '';
      } else { cur += ch; }
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

function normalizeRow(row) {
  const norm = {};
  Object.entries(row).forEach(([k, v]) => {
    norm[k.toLowerCase().trim().replace(/\s+/g, '_')] = String(v).trim();
  });
  return norm;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCursoEstudiantes(token, cursoId) {
  const [estudiantes,  setEstudiantes]  = useState([]);
  const [studLoading,  setStudLoading]  = useState(false);
  const [studError,    setStudError]    = useState(null);
  const [studSearch,   setStudSearch]   = useState('');

  const [addSearch,    setAddSearch]    = useState('');
  const [addResults,   setAddResults]   = useState([]);
  const [addLoading,   setAddLoading]   = useState(false);
  const [showDrop,     setShowDrop]     = useState(false);

  const [showImport,   setShowImport]   = useState(false);
  const [importRows,   setImportRows]   = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [fileType,     setFileType]     = useState(null);

  const addSearchTimer = useRef(null);

  // ── Cargar estudiantes ────────────────────────────────────────────────────

  const loadEstudiantes = useCallback(async () => {
    if (!cursoId || !token) return;
    setStudLoading(true);
    setStudError(null);
    try {
      const rows = await getEstudiantes(token, cursoId);
      setEstudiantes(rows);
    } catch (err) {
      setStudError(err.message);
    } finally {
      setStudLoading(false);
    }
  }, [cursoId, token]);

  // ── Reset del panel de búsqueda e importación ─────────────────────────────

  const reset = useCallback(() => {
    setAddSearch('');
    setAddResults([]);
    setShowDrop(false);
    setShowImport(false);
    setImportRows([]);
    setImportResult(null);
    setFileType(null);
    setStudSearch('');
  }, []);

  const toggleImportPanel = () => {
    setShowImport(v => !v);
    setImportResult(null);
    setImportRows([]);
    setFileType(null);
  };

  const clearImport = () => {
    setImportRows([]);
    setImportResult(null);
    setFileType(null);
  };

  // ── Búsqueda de estudiantes disponibles ───────────────────────────────────

  const handleAddSearchChange = (e) => {
    const q = e.target.value;
    setAddSearch(q);
    clearTimeout(addSearchTimer.current);
    if (q.trim().length < 2) {
      setAddResults([]);
      setShowDrop(false);
      return;
    }
    addSearchTimer.current = setTimeout(async () => {
      setAddLoading(true);
      try {
        const rows = await getEstudiantesDisponibles(token, cursoId, q);
        setAddResults(rows);
        setShowDrop(true);
      } catch {
        setAddResults([]);
      } finally {
        setAddLoading(false);
      }
    }, 300);
  };

  // ── Inscribir ─────────────────────────────────────────────────────────────

  const handleInscribir = async (persona) => {
    setShowDrop(false);
    setAddSearch('');
    try {
      const nuevo = await inscribirEstudiante(token, cursoId, persona.id);
      setEstudiantes(p => [nuevo, ...p]);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Toggle activo ─────────────────────────────────────────────────────────

  const handleToggle = async (est) => {
    try {
      await toggleInscripcion(token, cursoId, est.lista_id, !est.activo);
      setEstudiantes(p =>
        p.map(e => e.lista_id === est.lista_id ? { ...e, activo: !e.activo } : e)
      );
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Eliminar inscripción ──────────────────────────────────────────────────

  const handleEliminar = async (est) => {
    const msg = est.total_asistencias > 0
      ? `"${est.nombre} ${est.apellido}" tiene ${est.total_asistencias} registro(s) de asistencia y será desactivado (no eliminado). ¿Continuar?`
      : `¿Eliminar la inscripción de "${est.nombre} ${est.apellido}"?`;
    if (!window.confirm(msg)) return;
    try {
      const r = await eliminarInscripcion(token, cursoId, est.lista_id);
      if (r.accion === 'eliminado') {
        setEstudiantes(p => p.filter(e => e.lista_id !== est.lista_id));
      } else {
        setEstudiantes(p =>
          p.map(e => e.lista_id === est.lista_id ? { ...e, activo: false } : e)
        );
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Importar archivo (Excel / CSV) ────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const isCsv = ext === 'csv';

    setImportRows([]);
    setImportResult(null);
    setFileType(isCsv ? 'csv' : 'excel');

    if (isCsv) {
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

    e.target.value = '';
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
      const result = await importarEstudiantes(token, cursoId, payload);
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

  // ── Descargar plantillas ──────────────────────────────────────────────────

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

  // ── Datos derivados ───────────────────────────────────────────────────────

  const estudiantesFiltrados = estudiantes.filter(e => {
    if (!studSearch.trim()) return true;
    const q = studSearch.toLowerCase();
    return (
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(q) ||
      e.correo.toLowerCase().includes(q)
    );
  });

  const activeCount = estudiantes.filter(e => e.activo).length;

  return {
    // Data
    estudiantes,
    estudiantesFiltrados,
    activeCount,
    studLoading,
    studError,
    studSearch,
    setStudSearch,
    // Búsqueda de disponibles
    addSearch,
    addResults,
    addLoading,
    showDrop,
    setShowDrop,
    // Importación
    showImport,
    importRows,
    importResult,
    importing,
    fileType,
    // Acciones
    loadEstudiantes,
    reset,
    toggleImportPanel,
    clearImport,
    handleAddSearchChange,
    handleInscribir,
    handleToggle,
    handleEliminar,
    handleFileChange,
    handleConfirmarImport,
    descargarPlantillaExcel,
    descargarPlantillaCSV,
  };
}   