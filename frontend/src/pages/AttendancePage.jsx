import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { getSesionesByCurso } from '../api/sesionesApi';
import { batchUpdateAsistencia, getAsistenciaBySesion } from '../api/asistenciaApi';
import { useAttendance, avatarColor } from '../hooks/useAttendance';
import AppLayout from '../components/layout/AppLayout';
import AttendanceStatusToggle from '../components/attendance/AttendanceStatusToggle';
import VerificationBadge from '../components/attendance/VerificationBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

const FILTER_OPTIONS = ['Todos', 'Presente', 'Ausente', 'Justificado', 'Pendientes'];

/* ── Styled (sin cambios respecto al original) ── */
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
  &:hover:not(:disabled){background-color:${theme.colors.surfaceContainerLowest}}
  &:disabled{opacity:0.4;cursor:not-allowed}
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

// ── Loader inline ────────────────────────────────────────────
const InlineLoader = styled.div`
  padding: 3rem;
  text-align: center;
  color: ${theme.colors.onSurfaceVariant};
  font-size: ${theme.fontSizes.sm};
`;

const ErrorBanner = styled.div`
  padding: 1rem 1.25rem;
  background-color: ${theme.colors.errorContainer};
  color: ${theme.colors.error};
  border-radius: ${theme.radii.lg};
  font-size: ${theme.fontSizes.sm};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: .5rem;
`;

const SuccessBanner = styled.div`
  padding: 1rem 1.25rem;
  background-color: ${theme.colors.secondary}22;
  color: ${theme.colors.secondary};
  border-radius: ${theme.radii.lg};
  font-size: ${theme.fontSizes.sm};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: .5rem;
`;

const ChangeIndicator = styled.span`
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: ${theme.radii.full};
  background-color: ${theme.colors.error};
  margin-left: 0.5rem;
`;

const SessionHeader = styled.div`
  background-color: ${theme.colors.surfaceContainerHigh};
  padding: 1rem 1.5rem;
  font-weight: ${theme.fontWeights.semibold};
  border-bottom: 1px solid ${theme.colors.surfaceContainerHighest};
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SessionDate = styled.span`
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.bold};
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: ${theme.colors.surface};
  border-radius: ${theme.radii['2xl']};
  box-shadow: ${theme.shadows.lg};
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${theme.colors.surfaceContainerHigh};
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.onSurface};
  margin: 0;
`;

const ModalBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid ${theme.colors.surfaceContainerHigh};
  flex-shrink: 0;
`;

const FullTableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    height: 0.5rem;
  }
  
  &::-webkit-scrollbar-track {
    background-color: ${theme.colors.surfaceContainerLow};
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.outline};
    border-radius: ${theme.radii.full};
    
    &:hover {
      background-color: ${theme.colors.onSurfaceVariant};
    }
  }
`;

const AttendancePage = ({ onLogout }) => {
  const navigate        = useNavigate();
  const { cursoId }     = useParams();
  const { user, token } = useAuth();

  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('Todos');

  // ── Selector de sesiones ──────────────────────────────────
  // Se carga una sola vez al montar. El hook de asistencia
  // se re-ejecuta automáticamente cuando cambia currentSesion.id
  const [sesiones,          setSesiones]          = useState([]);
  const [sesionesLoading,   setSesionesLoading]   = useState(true);
  const [sesionesError,     setSesionesError]     = useState(null);
  const [currentSessionIdx, setCurrentSessionIdx] = useState(0);

  // ── Estados para guardar cambios ──────────────────────────
  const [originalRecords, setOriginalRecords]     = useState([]);
  const [isSaving,        setIsSaving]            = useState(false);
  const [saveError,       setSaveError]           = useState(null);
  const [saveSuccess,     setSaveSuccess]         = useState(false);
  const [showFullTable,   setShowFullTable]       = useState(false);
  const [prevLoading,     setPrevLoading]         = useState(true);
  const [fullTableData,   setFullTableData]       = useState([]);
  const [loadingFullTable, setLoadingFullTable]   = useState(false);
  const [fullTableChanges, setFullTableChanges]   = useState({});

  useEffect(() => {
    if (!token || !cursoId) return;
    setSesionesLoading(true);
    getSesionesByCurso(token, cursoId)
      .then((data) => {
        const ordenadas = (data || []).sort(
          (a, b) => new Date(a.fecha) - new Date(b.fecha)
        );
        setSesiones(ordenadas);
      })
      .catch((err) => setSesionesError(err.message))
      .finally(() => setSesionesLoading(false));
  }, [token, cursoId]);

  const currentSesion = sesiones[currentSessionIdx] ?? null;

  // ── Datos de asistencia real desde el hook ─────────────────
  // Cuando currentSesion.id cambia, el hook recarga automáticamente.
  const {
    sesion,
    curso,
    records,
    loading:     attendanceLoading,
    error:       attendanceError,
    updateRecord,
    reload,
  } = useAttendance(token, cursoId, currentSesion?.id);

  // ── Resetear prevLoading cuando cambia la sesión ──────────
  useEffect(() => {
    setPrevLoading(true);
  }, [currentSesion?.id]);

  // ── Guardar copia de records originales cuando se cargan desde la API ───
  // Solo actualizar cuando attendanceLoading pasa de true a false
  useEffect(() => {
    if (prevLoading && !attendanceLoading && records.length > 0) {
      setOriginalRecords(JSON.parse(JSON.stringify(records)));
      setSaveError(null);
      setSaveSuccess(false);
    }
    setPrevLoading(attendanceLoading);
  }, [attendanceLoading, records, prevLoading]);

  // ── Cargar tabla completa con todas las sesiones ──────────
  useEffect(() => {
    if (!showFullTable || !token || sesiones.length === 0) return;

    setLoadingFullTable(true);
    
    const loadAllSessions = async () => {
      try {
        const allData = [];
        for (const sesion of sesiones) {
          const asistencia = await getAsistenciaBySesion(token, sesion.id);
          allData.push({
            sesionId: sesion.id,
            sesionFecha: sesion.fecha,
            sesionAula: sesion.aula_nombre || sesion.aula || '',
            records: (asistencia || []).map((a) => ({
              id: a.id > 0 ? a.id : null, // ← IMPORTANTE: id para saber si CREATE o UPDATE
              listaEstudiantesId: a.lista_estudiantes_id,
              nombre: a.nombre ?? 'Sin nombre',
              apellido: a.apellido ?? '',
              codigoEstudiante: a.correo ?? `EST-${a.lista_estudiantes_id}`,
              estado: a.estado ?? 'Pendiente',
              estadoVerificacion: a.estado_verificacion ?? 'sin_app',
            })),
          });
        }
        setFullTableData(allData);
      } catch (err) {
        console.error('Error cargando tabla completa:', err);
      } finally {
        setLoadingFullTable(false);
      }
    };

    loadAllSessions();
  }, [showFullTable, token, sesiones]);

  // ── Detectar cambios comparando con originales ─────────────
  const hasChanges = useMemo(() => {
    return records.some((r) => {
      const original = originalRecords.find((o) => o.listaEstudiantesId === r.listaEstudiantesId);
      return !original || original.estado !== r.estado;
    });
  }, [records, originalRecords]);

  // ── Stats derivados de los records reales ─────────────────
  const stats = useMemo(() => {
    const presentes    = records.filter(r => r.estado === 'Presente').length;
    const ausentes     = records.filter(r => r.estado === 'Ausente').length;
    const justificados = records.filter(r => r.estado === 'Justificado').length;
    const pendientes   = records.filter(r =>
      ['pendiente', 'sin_app'].includes(r.estadoVerificacion)
    ).length;
    const tasa = records.length > 0
      ? Math.round((presentes / records.length) * 100)
      : 0;
    return { total: records.length, presentes, ausentes, justificados, pendientes, tasa };
  }, [records]);

  // ── Filtrado de la tabla ───────────────────────────────────
  const filtered = useMemo(() => {
    let data = records;
    if (filter === 'Pendientes') {
      data = data.filter(r => ['pendiente', 'sin_app'].includes(r.estadoVerificacion));
    } else if (filter !== 'Todos') {
      data = data.filter(r => r.estado === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        `${r.nombre} ${r.apellido}`.toLowerCase().includes(q) ||
        r.codigoEstudiante.toLowerCase().includes(q)
      );
    }
    return data;
  }, [records, filter, search]);

  // ── Guardar cambios (implementación real) ────────────────
  const handleSaveChanges = useCallback(async () => {
    if (!hasChanges) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Construir array de cambios: incluir actualizaciones Y creaciones
      const cambios = records
        .filter((r) => {
          const original = originalRecords.find((o) => o.listaEstudiantesId === r.listaEstudiantesId);
          return original && original.estado !== r.estado;
        })
        .map((r) => {
          if (r.id && r.id > 0) {
            // UPDATE - registro ya existe en BD
            return {
              asistencia_id: r.id,
              estado: r.estado,
            };
          } else {
            // CREATE - nuevo registro
            return {
              asistencia_id: 0,
              lista_estudiantes_id: r.listaEstudiantesId,
              sesion_clase_id: currentSesion?.id,
              estado: r.estado,
            };
          }
        });

      if (cambios.length === 0) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        return;
      }

      const result = await batchUpdateAsistencia(token, cambios);
      
      if (result.ok) {
        setSaveSuccess(true);
        // Actualizar originalRecords después de guardado exitoso
        setOriginalRecords(JSON.parse(JSON.stringify(records)));
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      setSaveError(err.message);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, records, originalRecords, token, currentSesion?.id]);

  // ── Handler de cambio de estado en la tabla ───────────────
  const handleStatusChange = (listaEstudiantesId, newEstado) => {
    updateRecord(listaEstudiantesId, newEstado);
  };

  // ── Handler para cambios en tabla completa ────────────────
  const handleFullTableStatusChange = (sesionId, listaEstudiantesId, newEstado) => {
    const key = `${sesionId}-${listaEstudiantesId}`;
    setFullTableChanges(prev => ({
      ...prev,
      [key]: newEstado,
    }));
  };

  // ── Guardar cambios desde tabla completa ──────────────────
  const handleSaveFullTableChanges = useCallback(async () => {
    if (Object.keys(fullTableChanges).length === 0) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const cambios = [];

      // Iterar sobre fullTableData para construir array de cambios
      for (const session of fullTableData) {
        for (const record of session.records) {
          const key = `${session.sesionId}-${record.listaEstudiantesId}`;
          const newEstado = fullTableChanges[key];

          // Si hay cambio registrado para este estudiante en esta sesión
          if (newEstado && newEstado !== record.estado) {
            console.log(`✓ Cambio detectado - Sesión: ${session.sesionId}, Estudiante: ${record.listaEstudiantesId}, Estado anterior: ${record.estado}, Estado nuevo: ${newEstado}, ID asistencia: ${record.id}`);
            
            if (record.id && record.id > 0) {
              // UPDATE - registro ya existe
              cambios.push({
                asistencia_id: record.id,
                estado: newEstado,
              });
            } else {
              // CREATE - nuevo registro
              cambios.push({
                asistencia_id: 0,
                lista_estudiantes_id: record.listaEstudiantesId,
                sesion_clase_id: session.sesionId,
                estado: newEstado,
              });
            }
          }
        }
      }

      console.log('📤 Enviando al servidor:', JSON.stringify(cambios, null, 2));

      if (cambios.length === 0) {
        console.log('⚠️ No hay cambios para guardar');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        return;
      }

      const result = await batchUpdateAsistencia(token, cambios);
      
      console.log('📥 Respuesta servidor:', result);

      if (result.ok) {
        setSaveSuccess(true);
        setFullTableChanges({});
        
        // Recargar tabla completa con los datos actualizados
        const newData = [];
        for (const sesion of sesiones) {
          const asistencia = await getAsistenciaBySesion(token, sesion.id);
          newData.push({
            sesionId: sesion.id,
            sesionFecha: sesion.fecha,
            sesionAula: sesion.aula_nombre || sesion.aula || '',
            records: (asistencia || []).map((a) => ({
              id: a.id > 0 ? a.id : null,
              listaEstudiantesId: a.lista_estudiantes_id,
              nombre: a.nombre ?? 'Sin nombre',
              apellido: a.apellido ?? '',
              codigoEstudiante: a.correo ?? `EST-${a.lista_estudiantes_id}`,
              estado: a.estado ?? 'Pendiente',
              estadoVerificacion: a.estado_verificacion ?? 'sin_app',
            })),
          });
        }
        setFullTableData(newData);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('❌ Error al guardar:', err);
      setSaveError(err.message);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [fullTableChanges, fullTableData, token, sesiones]);

  // ── Estados de carga inicial ───────────────────────────────
  if (sesionesLoading) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <InlineLoader>Cargando sesiones del curso…</InlineLoader>
      </AppLayout>
    );
  }

  if (sesionesError) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <ErrorBanner>
          <Icon name="error" size="sm" />
          {sesionesError}
        </ErrorBanner>
      </AppLayout>
    );
  }

  // cursoId existe pero aún no tenemos `curso` del hook (puede tardar un tick)
  const cursoNombre = curso?.nombre ?? sesion?.cursoNombre ?? '…';
  const cursoCodigo = curso?.codigo ?? sesion?.cursoCodigo ?? '';

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Breadcrumb onClick={() => navigate('/mis-cursos')}>
          <Icon name="arrow_back" size="sm" /><span>Mis cursos</span>
        </Breadcrumb>
        <HeaderRow>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'.375rem' }}>
              {cursoCodigo && <Badge variant="default">{cursoCodigo}</Badge>}
            </div>
            <CourseTitle>{cursoNombre}</CourseTitle>
            <SessionMeta>
              {sesion
                ? `${sesion.fecha} · ${sesion.aula}`
                : 'Selecciona una sesión para ver la asistencia'}
            </SessionMeta>
          </div>

          {/* Selector de sesiones */}
          <DateNav>
            <DateNavBtn
              aria-label="Sesión anterior"
              onClick={() => setCurrentSessionIdx(i => i - 1)}
              disabled={currentSessionIdx === 0}
            >
              <Icon name="chevron_left" size="sm" />
            </DateNavBtn>
            <DateLabel>
              <Icon name="calendar_month" size="sm" style={{ color: theme.colors.primary }} />
              <span>
                {currentSesion
                  ? new Date(currentSesion.fecha).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'short',
                    })
                  : '—'}
              </span>
            </DateLabel>
            <DateNavBtn
              aria-label="Sesión siguiente"
              onClick={() => setCurrentSessionIdx(i => i + 1)}
              disabled={currentSessionIdx >= sesiones.length - 1}
            >
              <Icon name="chevron_right" size="sm" />
            </DateNavBtn>
          </DateNav>
        </HeaderRow>
      </PageHeader>

      {/* Error de asistencia */}
      {attendanceError && (
        <ErrorBanner>
          <Icon name="error" size="sm" />
          {attendanceError}
        </ErrorBanner>
      )}

      {/* Error al guardar */}
      {saveError && (
        <ErrorBanner>
          <Icon name="error" size="sm" />
          Error al guardar: {saveError}
        </ErrorBanner>
      )}

      {/* Éxito al guardar */}
      {saveSuccess && (
        <SuccessBanner>
          <Icon name="check_circle" size="sm" />
          Cambios guardados exitosamente
        </SuccessBanner>
      )}

      {/* Stats */}
      <StatsRow>
        <StatCard>
          <StatValue>{attendanceLoading ? '…' : `${stats.tasa}%`}</StatValue>
          <StatLabel>Tasa de asistencia</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue $color={theme.colors.secondary}>{attendanceLoading ? '…' : stats.presentes}</StatValue>
          <StatLabel>Presentes</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue $color={theme.colors.error}>{attendanceLoading ? '…' : stats.ausentes}</StatValue>
          <StatLabel>Ausentes</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue $color="#e17c5a">{attendanceLoading ? '…' : stats.justificados}</StatValue>
          <StatLabel>Justificados</StatLabel>
        </StatCard>
      </StatsRow>

      <ActionBar>
        <SearchWrapper>
          <SearchIconWrap><Icon name="search" size="sm" /></SearchIconWrap>
          <SearchInput
            type="text"
            placeholder="Buscar por nombre o correo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchWrapper>
        <RightActions>
          <Button variant="outlined" size="sm" onClick={reload} title="Recargar desde la BD">
            <Icon name="refresh" size="sm" />
          </Button>
          {!showFullTable && (
            <Button 
              variant="outlined"
              size="sm" 
              onClick={() => setShowFullTable(true)}
              title="Ver todas las sesiones con lista de estudiantes"
            >
              <Icon name="table_chart" size="sm" />
            </Button>
          )}
          {showFullTable && (
            <Button 
              variant="outlined"
              size="sm" 
              onClick={() => setShowFullTable(false)}
              title="Volver a vista de sesión única"
            >
              <Icon name="close" size="sm" />
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleSaveChanges}
            disabled={!hasChanges || isSaving}
            title={!hasChanges ? 'No hay cambios para guardar' : 'Guardar cambios'}
          >
            {isSaving ? (
              <>
                <Icon name="hourglass_top" size="sm" />
                Guardando…
              </>
            ) : (
              <>
                Guardar cambios
                {hasChanges && <ChangeIndicator />}
              </>
            )}
          </Button>
        </RightActions>
      </ActionBar>

      {showFullTable && (
        <ModalOverlay onClick={() => setShowFullTable(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Tabla Completa - Todas las Sesiones</ModalTitle>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowFullTable(false)}
                title="Cerrar"
              >
                <Icon name="close" size="sm" />
              </Button>
            </ModalHeader>

            <ModalBody>
              {loadingFullTable ? (
                <InlineLoader>Cargando todas las sesiones…</InlineLoader>
              ) : fullTableData.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: theme.colors.outline }}>
                  No hay datos de sesiones disponibles
                </div>
              ) : (
                <FullTableContainer>
                  <TableWrapper>
                    <Table>
                      <THead>
                        <tr>
                          <Th style={{ minWidth: '200px', position: 'sticky', left: 0, zIndex: 10, backgroundColor: theme.colors.surfaceContainerLow }}>Estudiante</Th>
                          {fullTableData.map((session) => (
                            <Th key={`header-${session.sesionId}`} style={{ textAlign: 'center', minWidth: '120px' }}>
                              <div style={{ fontSize: theme.fontSizes.xs }}>
                                {new Date(session.sesionFecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                              </div>
                              <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.onSurfaceVariant }}>
                                {session.sesionAula}
                              </div>
                            </Th>
                          ))}
                        </tr>
                      </THead>
                      <tbody>
                        {/* Obtener lista única de estudiantes de la primera sesión */}
                        {fullTableData.length > 0 && fullTableData[0].records.map((estudiante, idx) => (
                          <Tr key={`row-${estudiante.listaEstudiantesId}`}>
                            <Td style={{ position: 'sticky', left: 0, zIndex: 9, backgroundColor: theme.colors.surface, minWidth: '200px' }}>
                              <StudentCell>
                                <Avatar $bg={avatarColor(idx).bg} $color={avatarColor(idx).color}>
                                  {estudiante.nombre[0]}{estudiante.apellido[0]}
                                </Avatar>
                                <div>
                                  <span style={{
                                    fontWeight: theme.fontWeights.semibold,
                                    color: theme.colors.onSurface,
                                    display: 'block',
                                    fontSize: theme.fontSizes.sm,
                                  }}>
                                    {estudiante.nombre} {estudiante.apellido}
                                  </span>
                                  <MonoText>{estudiante.codigoEstudiante}</MonoText>
                                </div>
                              </StudentCell>
                            </Td>
                            {fullTableData.map((session) => {
                              const recordEnSesion = session.records.find(r => r.listaEstudiantesId === estudiante.listaEstudiantesId);
                              const estadoActual = recordEnSesion ? (fullTableChanges[`${session.sesionId}-${estudiante.listaEstudiantesId}`] ?? recordEnSesion.estado) : 'Pendiente';
                              return (
                                <Td key={`${session.sesionId}-${estudiante.listaEstudiantesId}`} style={{ textAlign: 'center', minWidth: '120px' }}>
                                  <AttendanceStatusToggle
                                    value={estadoActual}
                                    onChange={newEstado => {
                                      handleFullTableStatusChange(session.sesionId, estudiante.listaEstudiantesId, newEstado);
                                      console.log(`Cambio: Sesión ${session.sesionId}, Estudiante ${estudiante.listaEstudiantesId}, Nuevo Estado: ${newEstado}`);
                                    }}
                                  />
                                </Td>
                              );
                            })}
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableWrapper>
                </FullTableContainer>
              )}
            </ModalBody>

            <ModalFooter>
              {saveError && (
                <ErrorBanner style={{ margin: 0, flex: 1 }}>
                  <Icon name="error" size="sm" />
                  {saveError}
                </ErrorBanner>
              )}
              {saveSuccess && (
                <SuccessBanner style={{ margin: 0, flex: 1 }}>
                  <Icon name="check_circle" size="sm" />
                  Cambios guardados exitosamente
                </SuccessBanner>
              )}
              <Button 
                variant="outlined"
                size="sm"
                onClick={() => setShowFullTable(false)}
              >
                Cerrar
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveFullTableChanges}
                disabled={Object.keys(fullTableChanges).length === 0 || isSaving}
                title={Object.keys(fullTableChanges).length === 0 ? 'No hay cambios para guardar' : 'Guardar cambios'}
              >
                {isSaving ? (
                  <>
                    <Icon name="hourglass_top" size="sm" />
                    Guardando…
                  </>
                ) : (
                  <>
                    Guardar cambios
                    {Object.keys(fullTableChanges).length > 0 && <ChangeIndicator />}
                  </>
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {!showFullTable && (
        <>
          <FilterBar role="group" aria-label="Filtrar por estado">
            {FILTER_OPTIONS.map(opt => (
              <FilterChip key={opt} $active={filter === opt} onClick={() => setFilter(opt)}>
                {opt}
                {opt === 'Pendientes' && stats.pendientes > 0 && ` (${stats.pendientes})`}
              </FilterChip>
            ))}
          </FilterBar>

          <TableWrapper>
            {attendanceLoading ? (
              <InlineLoader>Cargando asistencia…</InlineLoader>
            ) : (
          <Table>
            <THead>
              <tr>
                <Th>Estudiante</Th>
                <Th>Hora</Th>
                <Th>Verificación</Th>
                <Th style={{ textAlign: 'center' }}>Estado</Th>
              </tr>
            </THead>
            <tbody>
              {filtered.length === 0 ? (
                <Tr>
                  <EmptyCell colSpan={4}>
                    {records.length === 0
                      ? 'No hay registros de asistencia para esta sesión.'
                      : 'No hay estudiantes con los filtros actuales.'}
                  </EmptyCell>
                </Tr>
              ) : (
                filtered.map((r, i) => {
                  const av = avatarColor(i);
                  return (
                    <Tr key={r.listaEstudiantesId}>
                      <Td>
                        <StudentCell>
                          <Avatar $bg={av.bg} $color={av.color}>
                            {r.nombre[0]}{r.apellido[0]}
                          </Avatar>
                          <div>
                            <span style={{
                              fontWeight: theme.fontWeights.semibold,
                              color: theme.colors.onSurface,
                              display: 'block',
                            }}>
                              {r.nombre} {r.apellido}
                            </span>
                            <MonoText>{r.codigoEstudiante}</MonoText>
                          </div>
                        </StudentCell>
                      </Td>
                      <Td>
                        <span style={{ fontSize: theme.fontSizes.sm, color: theme.colors.onSurfaceVariant }}>
                          {r.horaRegistro ?? '—'}
                        </span>
                      </Td>
                      <Td>
                        <VerificationBadge status={r.estadoVerificacion} metodo={r.metodo} />
                        {r.motivo && (
                          <div style={{
                            marginTop: '.25rem',
                            fontSize: theme.fontSizes.xs,
                            color: theme.colors.outline,
                            fontStyle: 'italic',
                          }}>
                            "{r.motivo}"
                          </div>
                        )}
                      </Td>
                      <Td style={{ textAlign: 'center' }}>
                        <AttendanceStatusToggle
                          value={r.estado}
                          onChange={newEstado => handleStatusChange(r.listaEstudiantesId, newEstado)}
                        />
                      </Td>
                    </Tr>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </TableWrapper>
        </>
      )}
    </AppLayout>
  );
};

export default AttendancePage;