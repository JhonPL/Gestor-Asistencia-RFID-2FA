import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import AttendanceStatusToggle from '../components/attendance/AttendanceStatusToggle';
import VerificationBadge from '../components/attendance/VerificationBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { MOCK_SESION, MOCK_ASISTENCIA, avatarColor } from '../mocks/attendance.mock';
import { MOCK_CURSOS } from '../mocks/dashboard.mock';

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

const AttendancePage = ({ onLogout }) => {
  const navigate         = useNavigate();
  const { cursoId }      = useParams();
  const { user }         = useAuth();
  const [records, setRecords] = useState(MOCK_ASISTENCIA);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('Todos');

  // Encuentra el curso por id (mock)
  const curso = MOCK_CURSOS.find(c => String(c.id) === String(cursoId)) ?? MOCK_CURSOS[0];

  const stats = useMemo(() => {
    const presentes    = records.filter(r => r.estado === 'Presente').length;
    const ausentes     = records.filter(r => r.estado === 'Ausente').length;
    const justificados = records.filter(r => r.estado === 'Justificado').length;
    const pendientes   = records.filter(r => ['pendiente','sin_app'].includes(r.estadoVerificacion)).length;
    return { total: records.length, presentes, ausentes, justificados, pendientes, tasa: Math.round((presentes / records.length) * 100) };
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

  const handleStatusChange = (id, newEstado) => {
    setRecords(prev => prev.map(r => r.id !== id ? r : {
      ...r, estado: newEstado,
      estadoVerificacion: newEstado === 'Presente' && r.estadoVerificacion === 'sin_app' ? 'completado' : r.estadoVerificacion,
    }));
  };

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Breadcrumb onClick={() => navigate('/dashboard')}>
          <Icon name="arrow_back" size="sm" /><span>Mis cursos</span>
        </Breadcrumb>
        <HeaderRow>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'.375rem'}}>
              <Badge variant="default">{curso.codigo}</Badge>
              <Badge variant={MOCK_SESION.estado === 'activa' ? 'active' : 'default'}>{MOCK_SESION.estado}</Badge>
            </div>
            <CourseTitle>{curso.nombre}</CourseTitle>
            <SessionMeta>{MOCK_SESION.aula} · {MOCK_SESION.fecha} · {MOCK_SESION.horaInicio} – {MOCK_SESION.horaFin}</SessionMeta>
          </div>
          <DateNav>
            <DateNavBtn aria-label="Sesión anterior"><Icon name="chevron_left" size="sm" /></DateNavBtn>
            <DateLabel>
              <Icon name="calendar_month" size="sm" style={{color:theme.colors.primary}}/>
              <span>{new Date().toLocaleDateString('es-CO',{day:'numeric',month:'short'})}</span>
            </DateLabel>
            <DateNavBtn aria-label="Sesión siguiente"><Icon name="chevron_right" size="sm" /></DateNavBtn>
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
          <Button variant="outlined" size="sm" onClick={() => alert('Exportar — pendiente de API')}>
            <Icon name="download" size="sm" />Exportar
          </Button>
          <Button size="sm" onClick={() => alert('Guardado — pendiente de API')}>Guardar cambios</Button>
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
            {filtered.length === 0
              ? <tr><EmptyCell colSpan={5}>No hay estudiantes con los filtros actuales.</EmptyCell></tr>
              : filtered.map((r, i) => {
                  const av = avatarColor(i);
                  return (
                    <Tr key={r.id}>
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
                        <AttendanceStatusToggle value={r.estado} onChange={newEstado => handleStatusChange(r.id, newEstado)} />
                      </Td>
                    </Tr>
                  );
                })
            }
          </tbody>
        </Table>
      </TableWrapper>
    </AppLayout>
  );
};

export default AttendancePage;