import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { getEstudiantes } from '../api/cursosApi';
import { getCurso } from '../api/cursosApi';
import { getSesionesByCurso } from '../api/sesionesApi';
import AppLayout from '../components/layout/AppLayout';
import AttendanceStatusToggle from '../components/attendance/AttendanceStatusToggle';
import VerificationBadge from '../components/attendance/VerificationBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

const AVATAR_COLORS = [
  { bg: '#e0e0ff', color: '#000666' },
  { bg: '#94f0df', color: '#006b5e' },
  { bg: '#ffdbd0', color: '#5c1800' },
  { bg: '#bdc2ff', color: '#000666' },
];

const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

const FILTER_OPTIONS = ['Todos', 'Presente', 'Ausente', 'Justificado', 'Pendientes'];

/* ── Styled ── */
const PageHeader = styled.header`margin-bottom:2.5rem;`;
const Breadcrumb = styled.button`
  display:flex;align-items:center;gap:.5rem;color:${theme.colors.secondary};
  font-size:${theme.fontSizes.sm};font-weight:${theme.fontWeights.medium};margin-bottom:.875rem;
  &:hover span:last-child{text-decoration:underline}
`;
const HeaderRow = styled.div`
  display:flex;flex-direction:column;gap:1rem;
  @media(min-width:${theme.breakpoints.md}){flex-direction:row;align-items:flex-end;justify-content:space-between}
`;
const CourseTitle = styled.h1`
  font-family:${theme.fonts.headline};font-size:clamp(1.5rem,3vw,2.5rem);
  font-weight:${theme.fontWeights.extrabold};color:${theme.colors.primary};
  letter-spacing:-.025em;line-height:1.15;
`;
const SessionMeta = styled.p`
  font-size:${theme.fontSizes.base};color:${theme.colors.onSurfaceVariant};
  font-weight:${theme.fontWeights.light};margin-top:.375rem;text-transform:capitalize;
`;
const DateNav = styled.div`
  display:flex;align-items:center;gap:.5rem;
  background-color:${theme.colors.surfaceContainerHigh};
  border-radius:${theme.radii.xl};padding:.375rem;flex-shrink:0;
`;
const DateNavBtn = styled.button`
  width:2.25rem;height:2.25rem;display:flex;align-items:center;justify-content:center;
  border-radius:${theme.radii.lg};color:${theme.colors.onSurface};
  transition:background-color ${theme.transitions.fast};
  &:hover{background-color:${theme.colors.surfaceContainerLowest}}
`;
const DateLabel = styled.div`
  display:flex;align-items:center;gap:.5rem;padding:0 .75rem;
  font-size:${theme.fontSizes.sm};font-weight:${theme.fontWeights.semibold};color:${theme.colors.onSurface};
`;
const StatsRow = styled.div`
  display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:2rem;
  @media(min-width:${theme.breakpoints.md}){grid-template-columns:repeat(4,1fr)}
`;
const StatCard = styled.div`
  background-color:${theme.colors.surfaceContainerLowest};border-radius:${theme.radii.xl};
  padding:1rem 1.25rem;box-shadow:${theme.shadows.sm};
`;
const StatValue = styled.p`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes['3xl']};
  font-weight:${theme.fontWeights.extrabold};color:${({ $color }) => $color ?? theme.colors.primary};
  line-height:1;margin-bottom:.25rem;
`;
const StatLabel = styled.p`
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.semibold};
  text-transform:uppercase;letter-spacing:.08em;color:${theme.colors.outline};
`;
const ActionBar = styled.div`
  display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem;
  @media(min-width:${theme.breakpoints.sm}){flex-direction:row;align-items:center;justify-content:space-between}
`;
const SearchWrapper = styled.div`position:relative;flex:1;max-width:26rem;`;
const SearchIconWrap = styled.span`
  position:absolute;left:1rem;top:50%;transform:translateY(-50%);
  color:${theme.colors.outline};pointer-events:none;display:flex;
`;
const SearchInput = styled.input`
  width:100%;padding:.875rem 1rem .875rem 3rem;
  background-color:${theme.colors.surfaceContainerLow};border:none;
  border-radius:${theme.radii.xl};font-family:${theme.fonts.body};
  font-size:${theme.fontSizes.sm};color:${theme.colors.onSurface};outline:none;
  &::placeholder{color:${theme.colors.outline};opacity:.6}
  &:focus{box-shadow:0 0 0 2px ${theme.colors.primary}33}
`;
const RightActions = styled.div`display:flex;align-items:center;gap:.75rem;`;
const FilterBar = styled.div`display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.5rem;`;
const FilterChip = styled.button`
  padding:.375rem 1rem;border-radius:${theme.radii.full};
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.semibold};
  text-transform:uppercase;letter-spacing:.08em;transition:all ${theme.transitions.fast};
  background-color:${({ $active }) => $active ? theme.colors.primary : theme.colors.surfaceContainerHigh};
  color:${({ $active }) => $active ? 'white' : theme.colors.onSurfaceVariant};
  &:hover{background-color:${({ $active }) => $active ? theme.colors.primaryContainer : theme.colors.surfaceContainer}}
`;
const TableWrapper = styled.div`
  background-color:${theme.colors.surfaceContainerLowest};border-radius:${theme.radii['2xl']};
  box-shadow:${theme.shadows.sm};overflow:hidden;overflow-x:auto;
`;
const Table = styled.table`width:100%;border-collapse:collapse;text-align:left;`;
const THead = styled.thead`background-color:${theme.colors.surfaceContainerLow};`;
const Th = styled.th`
  padding:1rem 1.5rem;font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.bold};
  color:${theme.colors.outline};text-transform:uppercase;letter-spacing:.1em;white-space:nowrap;
  border-bottom:1px solid ${theme.colors.surfaceContainerHigh};
`;
const Tr = styled.tr`transition:background-color ${theme.transitions.fast};&:hover{background-color:${theme.colors.surfaceContainerLow}}`;
const Td = styled.td`padding:1.125rem 1.5rem;vertical-align:middle;`;
const StudentCell = styled.div`display:flex;align-items:center;gap:.75rem;`;
const Avatar = styled.div`
  width:2.5rem;height:2.5rem;border-radius:${theme.radii.full};
  background-color:${({ $bg }) => $bg};color:${({ $color }) => $color};
  display:flex;align-items:center;justify-content:center;
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.bold};flex-shrink:0;
`;
const MonoText = styled.span`font-family:'Courier New',monospace;font-size:${theme.fontSizes.xs};color:${theme.colors.onSurfaceVariant};`;
const EmptyCell = styled.td`padding:3rem;text-align:center;color:${theme.colors.outline};font-size:${theme.fontSizes.sm};`;
const ModalOverlay = styled.div`
  position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0,0,0,0.5);
  display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem;
`;
const ModalContent = styled.div`
  background-color:${theme.colors.surfaceContainerLowest};border-radius:${theme.radii['2xl']};
  max-width:90vw;max-height:90vh;overflow:auto;box-shadow:${theme.shadows.lg};
`;
const ModalHeader = styled.div`
  display:flex;align-items:center;justify-content:space-between;padding:1.5rem;
  border-bottom:1px solid ${theme.colors.surfaceContainerHigh};
`;
const ModalTitle = styled.h2`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes.xl};font-weight:${theme.fontWeights.bold};
  color:${theme.colors.primary};
`;
const CloseBtn = styled.button`
  background:none;border:none;cursor:pointer;color:${theme.colors.outline};
  font-size:${theme.fontSizes.lg};transition:color ${theme.transitions.fast};
  &:hover{color:${theme.colors.onSurface}}
`;
const FullTableContainer = styled.div`padding:1.5rem;overflow-x:auto;`;
const FullTable = styled.table`
  width:100%;border-collapse:collapse;text-align:left;font-size:${theme.fontSizes.xs};
`;
const FullTh = styled.th`
  padding:0.75rem;background-color:${theme.colors.surfaceContainerLow};
  font-weight:${theme.fontWeights.bold};color:${theme.colors.outline};border:1px solid ${theme.colors.surfaceContainerHigh};
  text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;
`;
const FullTd = styled.td`
  padding:0.75rem;border:1px solid ${theme.colors.surfaceContainerHigh};
  text-align:center;
`;
const FullTdName = styled(FullTd)`text-align:left;font-weight:${theme.fontWeights.semibold};`;

// ── Modal de Export ──────────────────────────────────────────
const ExportDialogOverlay = styled.div`
  position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0,0,0,0.5);
  display:flex;align-items:center;justify-content:center;z-index:1001;padding:1rem;
`;

const ExportDialogContent = styled.div`
  background-color:${theme.colors.surfaceContainerLowest};border-radius:${theme.radii['2xl']};
  max-width:28rem;box-shadow:${theme.shadows.lg};padding:2rem;
`;

const ExportDialogTitle = styled.h3`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes.lg};
  font-weight:${theme.fontWeights.bold};color:${theme.colors.primary};margin-bottom:1rem;
`;

const ExportDialogText = styled.p`
  font-size:${theme.fontSizes.sm};color:${theme.colors.onSurfaceVariant};margin-bottom:1.5rem;
`;

const ExportDialogActions = styled.div`
  display:flex;gap:1rem;justify-content:flex-end;
`;

const ExportButton = styled.button`
  padding:.5rem 1rem;border:none;border-radius:${theme.radii.md};
  font-weight:${theme.fontWeights.semibold};font-size:${theme.fontSizes.sm};
  cursor:pointer;transition:all ${theme.transitions.fast};
  
  &.primary {
    background-color:${theme.colors.primary};color:white;
    &:hover { background-color:${theme.colors.primaryContainer}; }
  }
  
  &.secondary {
    background-color:${theme.colors.surfaceContainer};color:${theme.colors.onSurface};
    &:hover { background-color:${theme.colors.surfaceContainerHigh}; }
  }
`;

// ── Modal de Edición de Asistencia ──────────────────────────────
const EditDialogOverlay = styled.div`
  position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0,0,0,0.5);
  display:flex;align-items:center;justify-content:center;z-index:1001;padding:1rem;
`;

const EditDialogContent = styled.div`
  background-color:${theme.colors.surfaceContainerLowest};border-radius:${theme.radii['2xl']};
  max-width:32rem;box-shadow:${theme.shadows.lg};padding:2rem;
`;

const EditDialogTitle = styled.h3`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes.lg};
  font-weight:${theme.fontWeights.bold};color:${theme.colors.primary};margin-bottom:1rem;
`;

const EditFormGroup = styled.div`
  margin-bottom:1.25rem;
`;

const EditLabel = styled.label`
  display:block;font-size:${theme.fontSizes.sm};font-weight:${theme.fontWeights.semibold};
  color:${theme.colors.onSurface};margin-bottom:.375rem;
`;

const EditSelect = styled.select`
  width:100%;padding:.75rem;border:1px solid ${theme.colors.outline};
  border-radius:${theme.radii.md};font-family:${theme.fonts.body};font-size:${theme.fontSizes.sm};
  color:${theme.colors.onSurface};background-color:${theme.colors.surfaceContainer};
  &:focus { outline:none;border-color:${theme.colors.primary};box-shadow:0 0 0 2px ${theme.colors.primary}33; }
`;

const EditTextarea = styled.textarea`
  width:100%;padding:.75rem;border:1px solid ${theme.colors.outline};
  border-radius:${theme.radii.md};font-family:${theme.fonts.body};font-size:${theme.fontSizes.sm};
  color:${theme.colors.onSurface};background-color:${theme.colors.surfaceContainer};
  resize:vertical;min-height:4rem;
  &:focus { outline:none;border-color:${theme.colors.primary};box-shadow:0 0 0 2px ${theme.colors.primary}33; }
`;

const EditDialogActions = styled.div`
  display:flex;gap:1rem;justify-content:flex-end;margin-top:1.5rem;
`;

const AttendancePage = ({ onLogout }) => {
  const navigate         = useNavigate();
  const { cursoId }      = useParams();
  const { user, token }  = useAuth();
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('Todos');
  const [curso, setCurso] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [currentSessionIdx, setCurrentSessionIdx] = useState(0);
  const [showFullTable, setShowFullTable] = useState(false);
  const [fullTableData, setFullTableData] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editMotivo, setEditMotivo] = useState('');
  
  // Cargar curso, estudiantes y sesiones
  useEffect(() => {
    if (!token || !cursoId) return;
    
    const loadCourseData = async () => {
      try {
        console.log('Cargando curso:', cursoId);
        const cursoData = await getCurso(token, cursoId);
        console.log('Curso:', cursoData);
        setCurso(cursoData);
        
        console.log('Cargando estudiantes del curso:', cursoId);
        const estudiantesData = await getEstudiantes(token, cursoId);
        console.log('Estudiantes:', estudiantesData);
        
        // Cargar sesiones del curso
        console.log('Cargando sesiones del curso:', cursoId);
        const sesionesData = await getSesionesByCurso(token, cursoId);
        console.log('Sesiones:', sesionesData);
        
        // Ordenar sesiones por fecha
        const sesionesOrdenadas = (sesionesData || [])
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setSesiones(sesionesOrdenadas);
        
        // Mapear estudiantes a formato de asistencia (estado por defecto: Ausente)
        const mappedRecords = (estudiantesData || []).map((est, idx) => ({
          id: est.id ?? `EST-${idx}`,
          codigoEstudiante: est.codigo ?? `EST-${est.id ?? idx}`,
          nombre: est.nombre ?? 'Sin nombre',
          apellido: est.apellido ?? '',
          estado: 'Ausente',
          estadoVerificacion: 'sin_app',
          horaRegistro: null,
          metodo: null,
          dentroCampus: null,
          motivo: null,
        }));
        
        setRecords(mappedRecords);
        
        // Preparar datos para tabla completa
        const fullData = (estudiantesData || []).map((est, idx) => ({
          id: est.id ?? `EST-${idx}`,
          codigoEstudiante: est.codigo ?? `EST-${est.id ?? idx}`,
          nombre: est.nombre ?? 'Sin nombre',
          apellido: est.apellido ?? '',
          sesiones: sesionesOrdenadas.map(s => ({
            sesionId: s.id,
            fecha: s.fecha,
            estado: 'Ausente', // Por defecto Ausente
          })),
        }));
        setFullTableData(fullData);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseData();
  }, [token, cursoId]);
  
  const handleStatusChange = (id, newEstado) => {
    setRecords(prev => prev.map(r => r.id !== id ? r : {
      ...r, estado: newEstado,
      estadoVerificacion: newEstado === 'Presente' && r.estadoVerificacion === 'sin_app' ? 'completado' : r.estadoVerificacion,
    }));
  };
  
  const handleFullTableStatusChange = (estudianteId, sesionIdx, newEstado) => {
    setFullTableData(prev => prev.map(est => {
      if (est.id !== estudianteId) return est;
      return {
        ...est,
        sesiones: est.sesiones.map((s, idx) => 
          idx === sesionIdx ? { ...s, estado: newEstado } : s
        ),
      };
    }));
  };
  
  const currentSesion = sesiones[currentSessionIdx];
  
  const handlePrevSession = () => {
    if (currentSessionIdx > 0) {
      setCurrentSessionIdx(currentSessionIdx - 1);
    }
  };
  
  const handleNextSession = () => {
    if (currentSessionIdx < sesiones.length - 1) {
      setCurrentSessionIdx(currentSessionIdx + 1);
    }
  };

  const stats = useMemo(() => {
    const presentes    = records.filter(r => r.estado === 'Presente').length;
    const ausentes     = records.filter(r => r.estado === 'Ausente').length;
    const justificados = records.filter(r => r.estado === 'Justificado').length;
    const pendientes   = records.filter(r => ['pendiente','sin_app'].includes(r.estadoVerificacion)).length;
    const tasa = records.length > 0 ? Math.round((presentes / records.length) * 100) : 0;
    return { total: records.length, presentes, ausentes, justificados, pendientes, tasa };
  }, [records]);

  const filtered = useMemo(() => {
    let data = records;
    if (filter === 'Pendientes') data = data.filter(r => ['pendiente','sin_app'].includes(r.estadoVerificacion));
    else if (filter !== 'Todos') data = data.filter(r => r.estado === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r => `${r.nombre} ${r.apellido}`.toLowerCase().includes(q) || r.codigoEstudiante.toLowerCase().includes(q));
    }
    return data;
  }, [records, filter, search]);

  // ── Funciones de export ──────────────────────────────────────────
  const exportAsistencia = (type) => {
    try {
      let dataToExport = [];
      let filename = `asistencia-${curso?.codigo || 'curso'}-`;
      
      if (type === 'current-session') {
        // Exportar sesión actual
        const currentDate = currentSesion?.fecha ? 
          new Date(currentSesion.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
          : new Date().toISOString().split('T')[0];
        filename += currentDate;
        
        dataToExport = records.map(r => ({
          codigo: r.codigoEstudiante,
          nombre: `${r.nombre} ${r.apellido}`,
          estado: r.estado,
          hora: r.horaRegistro || '—',
          verificacion: r.estadoVerificacion,
        }));
      } else {
        // Exportar todo completo
        filename += 'completo-' + new Date().toISOString().split('T')[0];
        
        dataToExport = fullTableData.map(est => {
          const row = {
            codigo: est.codigoEstudiante,
            nombre: `${est.nombre} ${est.apellido}`,
          };
          est.sesiones.forEach((s, idx) => {
            const dateLabel = new Date(s.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
            row[`sesion-${idx}`] = s.estado;
          });
          return row;
        });
      }
      
      // Convertir a CSV
      const headers = type === 'current-session' 
        ? ['Código', 'Nombre', 'Estado', 'Hora', 'Verificación']
        : ['Código', 'Nombre', ...sesiones.map((s, i) => new Date(s.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }))];
      
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(h => {
            const key = h.toLowerCase().replace(/ /g, '-').replace(/ó/g, 'o');
            const val = row[key] || row[h] || '—';
            return `"${val}"`;
          }).join(',')
        ),
      ].join('\n');
      
      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowExportDialog(false);
    } catch (err) {
      console.error('Error al exportar:', err);
      alert('Error al exportar: ' + err.message);
    }
  };

  // ── Guardar cambios ──────────────────────────────────────────────
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Aquí irá la llamada a la API para guardar los cambios
      // Por ahora, solo mostramos un mensaje de éxito
      console.log('Guardando cambios...', records);
      alert('Asistencia guardada exitosamente (esta es una demostración)');
      setSaving(false);
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar: ' + err.message);
      setSaving(false);
    }
  };

  // ── Editar asistencia manual ─────────────────────────────────────
  const openEditRecord = (record) => {
    setEditingRecord(record);
    setEditMotivo(record.motivo || '');
  };

  const handleSaveEditedRecord = () => {
    if (!editingRecord) return;
    
    setRecords(prev => prev.map(r => 
      r.id === editingRecord.id 
        ? { ...r, motivo: editMotivo }
        : r
    ));
    
    setEditingRecord(null);
    setEditMotivo('');
  };

  if (loading) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.onSurfaceVariant }}>
          Cargando estudiantes...
        </div>
      </AppLayout>
    );
  }

  if (!curso) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.error }}>
          <p>No se encontró el curso.</p>
          {error && <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: theme.colors.onSurfaceVariant }}>Error: {error}</p>}
          <button 
            onClick={() => navigate('/mis-cursos')}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Volver a mis cursos
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Breadcrumb onClick={() => navigate('/mis-cursos')}>
          <Icon name="arrow_back" size="sm" /><span>Mis cursos</span>
        </Breadcrumb>
        <HeaderRow>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'.375rem'}}>
              <Badge variant="default">{curso.codigo}</Badge>
            </div>
            <CourseTitle>{curso.nombre}</CourseTitle>
            <SessionMeta>Lista de estudiantes del curso</SessionMeta>
          </div>
          <DateNav>
            <DateNavBtn 
              aria-label="Sesión anterior" 
              onClick={handlePrevSession}
              disabled={currentSessionIdx === 0}
              style={{ opacity: currentSessionIdx === 0 ? 0.5 : 1, cursor: currentSessionIdx === 0 ? 'not-allowed' : 'pointer' }}
            >
              <Icon name="chevron_left" size="sm" />
            </DateNavBtn>
            <DateLabel>
              <Icon name="calendar_month" size="sm" style={{color:theme.colors.primary}}/>
              <span>
                {currentSesion 
                  ? new Date(currentSesion.fecha).toLocaleDateString('es-CO',{day:'numeric',month:'short'})
                  : new Date().toLocaleDateString('es-CO',{day:'numeric',month:'short'})
                }
              </span>
            </DateLabel>
            <DateNavBtn 
              aria-label="Sesión siguiente" 
              onClick={handleNextSession}
              disabled={currentSessionIdx >= sesiones.length - 1}
              style={{ opacity: currentSessionIdx >= sesiones.length - 1 ? 0.5 : 1, cursor: currentSessionIdx >= sesiones.length - 1 ? 'not-allowed' : 'pointer' }}
            >
              <Icon name="chevron_right" size="sm" />
            </DateNavBtn>
          </DateNav>
        </HeaderRow>
      </PageHeader>

      <StatsRow>
        <StatCard><StatValue>{stats.tasa}%</StatValue><StatLabel>Tasa de asistencia</StatLabel></StatCard>
        <StatCard><StatValue $color={theme.colors.secondary}>{stats.presentes}</StatValue><StatLabel>Presentes</StatLabel></StatCard>
        <StatCard><StatValue $color={theme.colors.error}>{stats.ausentes}</StatValue><StatLabel>Ausentes</StatLabel></StatCard>
        <StatCard><StatValue $color="#e17c5a">{stats.justificados}</StatValue><StatLabel>Justificados</StatLabel></StatCard>
      </StatsRow>

      <ActionBar>
        <SearchWrapper>
          <SearchIconWrap><Icon name="search" size="sm" /></SearchIconWrap>
          <SearchInput type="text" placeholder="Buscar por nombre o código…" value={search} onChange={e => setSearch(e.target.value)} />
        </SearchWrapper>
        <RightActions>
          <Button variant="outlined" size="sm" onClick={() => setShowFullTable(true)}>
            <Icon name="table" size="sm" />Tabla completa
          </Button>
          <Button variant="outlined" size="sm" onClick={() => setShowExportDialog(true)}>
            <Icon name="download" size="sm" />Exportar
          </Button>
          <Button size="sm" onClick={handleSaveChanges} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </RightActions>
      </ActionBar>

      <FilterBar role="group" aria-label="Filtrar por estado">
        {FILTER_OPTIONS.map(opt => (
          <FilterChip key={opt} $active={filter === opt} onClick={() => setFilter(opt)}>
            {opt}{opt === 'Pendientes' && stats.pendientes > 0 && ` (${stats.pendientes})`}
          </FilterChip>
        ))}
      </FilterBar>

      <TableWrapper>
        <Table>
          <THead>
            <tr>
              <Th>Código</Th><Th>Estudiante</Th><Th>Hora</Th><Th>Verificación</Th>
              <Th style={{textAlign:'center'}}>Estado</Th>
            </tr>
          </THead>
          <tbody>
            {filtered.length === 0 && <Tr key="empty"><EmptyCell colSpan={5}>No hay estudiantes con los filtros actuales.</EmptyCell></Tr>}
            {filtered.length > 0 && filtered.map((r, i) => {
                  const av = avatarColor(i);
                  return (
                    <Tr key={`${i}-${r.codigoEstudiante}`}>
                      <Td><MonoText>{r.codigoEstudiante}</MonoText></Td>
                      <Td>
                        <StudentCell>
                          <Avatar $bg={av.bg} $color={av.color}>{r.nombre[0]}{r.apellido[0]}</Avatar>
                          <span style={{fontWeight:theme.fontWeights.semibold,color:theme.colors.onSurface}}>{r.nombre} {r.apellido}</span>
                        </StudentCell>
                      </Td>
                      <Td><span style={{fontSize:theme.fontSizes.sm,color:theme.colors.onSurfaceVariant}}>{r.horaRegistro ?? '—'}</span></Td>
                      <Td>
                        <VerificationBadge status={r.estadoVerificacion} metodo={r.metodo} />
                        {r.motivo && <div style={{marginTop:'.25rem',fontSize:theme.fontSizes.xs,color:theme.colors.outline,fontStyle:'italic'}}>"{r.motivo}"</div>}
                      </Td>
                      <Td style={{textAlign:'center'}}>
                        <div style={{display:'flex',gap:'.5rem',justifyContent:'center',alignItems:'center'}}>
                          <AttendanceStatusToggle value={r.estado} onChange={newEstado => handleStatusChange(r.id, newEstado)} />
                          <button 
                            onClick={() => openEditRecord(r)}
                            title="Editar registro"
                            style={{
                              background:'none',border:'none',color:theme.colors.primary,cursor:'pointer',
                              fontSize:theme.fontSizes.sm,padding:'.25rem .5rem',borderRadius:theme.radii.md,
                              transition:`all ${theme.transitions.fast}`
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = theme.colors.primaryFixed}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <Icon name="edit" size="sm" />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
          </tbody>
        </Table>
      </TableWrapper>

      {showFullTable && (
        <ModalOverlay onClick={() => setShowFullTable(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Tabla completa de asistencia</ModalTitle>
              <CloseBtn onClick={() => setShowFullTable(false)}>
                <Icon name="close" size="md" />
              </CloseBtn>
            </ModalHeader>
            <FullTableContainer>
              <FullTable>
                <THead>
                  <tr>
                    <FullTh>Código</FullTh>
                    <FullTh>Estudiante</FullTh>
                    {sesiones.map((sesion, idx) => (
                      <FullTh key={sesion.id || idx}>
                        {new Date(sesion.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </FullTh>
                    ))}
                  </tr>
                </THead>
                <tbody>
                  {fullTableData.map((est, estIdx) => (
                    <Tr key={`full-${estIdx}-${est.codigoEstudiante}`}>
                      <FullTd><MonoText>{est.codigoEstudiante}</MonoText></FullTd>
                      <FullTdName>{est.nombre} {est.apellido}</FullTdName>
                      {est.sesiones.map((sesionData, sesionIdx) => (
                        <FullTd key={sesionData.sesionId || sesionIdx} style={{padding: '0.5rem'}}>
                          <AttendanceStatusToggle
                            value={sesionData.estado}
                            onChange={(newEstado) => handleFullTableStatusChange(est.id, sesionIdx, newEstado)}
                          />
                        </FullTd>
                      ))}
                    </Tr>
                  ))}
                </tbody>
              </FullTable>
            </FullTableContainer>
          </ModalContent>
        </ModalOverlay>
      )}

      {showExportDialog && (
        <ExportDialogOverlay onClick={() => setShowExportDialog(false)}>
          <ExportDialogContent onClick={(e) => e.stopPropagation()}>
            <ExportDialogTitle>Exportar asistencia</ExportDialogTitle>
            <ExportDialogText>¿Qué deseas exportar?</ExportDialogText>
            <ExportDialogActions>
              <ExportButton className="secondary" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </ExportButton>
              <ExportButton className="primary" onClick={() => exportAsistencia('current-session')}>
                Sesión actual
              </ExportButton>
              <ExportButton className="primary" onClick={() => exportAsistencia('all-sessions')}>
                Todo completo
              </ExportButton>
            </ExportDialogActions>
          </ExportDialogContent>
        </ExportDialogOverlay>
      )}

      {editingRecord && (
        <EditDialogOverlay onClick={() => setEditingRecord(null)}>
          <EditDialogContent onClick={(e) => e.stopPropagation()}>
            <EditDialogTitle>Editar asistencia</EditDialogTitle>
            
            <EditFormGroup>
              <EditLabel>Estudiante</EditLabel>
              <div style={{fontSize:theme.fontSizes.sm,color:theme.colors.onSurface}}>
                {editingRecord.nombre} {editingRecord.apellido} ({editingRecord.codigoEstudiante})
              </div>
            </EditFormGroup>

            <EditFormGroup>
              <EditLabel htmlFor="edit-estado">Estado</EditLabel>
              <EditSelect 
                id="edit-estado"
                value={editingRecord.estado} 
                onChange={(e) => setEditingRecord({...editingRecord, estado: e.target.value})}
              >
                <option value="Presente">Presente</option>
                <option value="Ausente">Ausente</option>
                <option value="Justificado">Justificado</option>
              </EditSelect>
            </EditFormGroup>

            <EditFormGroup>
              <EditLabel htmlFor="edit-motivo">Motivo / Observación</EditLabel>
              <EditTextarea 
                id="edit-motivo"
                value={editMotivo}
                onChange={(e) => setEditMotivo(e.target.value)}
                placeholder="Ej: Enfermedad, tramite, etc..."
              />
            </EditFormGroup>

            <EditDialogActions>
              <ExportButton className="secondary" onClick={() => setEditingRecord(null)}>
                Cancelar
              </ExportButton>
              <ExportButton className="primary" onClick={handleSaveEditedRecord}>
                Guardar cambios
              </ExportButton>
            </EditDialogActions>
          </EditDialogContent>
        </EditDialogOverlay>
      )}
    </AppLayout>
  );
};

export default AttendancePage;