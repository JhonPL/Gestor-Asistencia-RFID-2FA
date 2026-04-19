import { useState, useMemo } from 'react';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import AdminStatCard from '../components/admin/AdminStatCard';
import PersonasTable from '../components/admin/PersonasTable';
import DevicesTable from '../components/admin/DevicesTable';
import PersonaFormModal from '../components/admin/PersonaFormModal';
import LinkCardModal from '../components/admin/LinkCardModal';
import DeviceFormModal from '../components/admin/DeviceFormModal';
import GenericTable, { StatusDot } from '../components/admin/GenericTable';
import { FacultadModal, ProgramaModal } from '../components/admin/FacultadProgramaModals';
import { AulaModal, HorarioModal } from '../components/admin/AulaHorarioModals';
import CursoModal from '../components/admin/CursoModal';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import {
  MOCK_PERSONAS, MOCK_DISPOSITIVOS, MOCK_FACULTADES, MOCK_PROGRAMAS,
  MOCK_AULAS, MOCK_HORARIOS, MOCK_DIAS, MOCK_CURSOS,
  MOCK_AULA_CURSO_HORARIO, ADMIN_STATS,
} from '../mocks/admin.mock';

// ─── Tabs de navegación ───────────────────────────────────────────────────────
const TABS = [
  { id: 'personas',     label: 'Personas',      icon: 'group'       },
  { id: 'cursos',       label: 'Cursos',         icon: 'menu_book'   },
  { id: 'academico',    label: 'Académico',      icon: 'school'      },
  { id: 'aulas',        label: 'Aulas',          icon: 'meeting_room'},
  { id: 'horarios',     label: 'Horarios',       icon: 'schedule'    },
  { id: 'dispositivos', label: 'Dispositivos',   icon: 'sensors'     },
];

const ROLES_FILTRO  = ['Todos', 'docente', 'estudiante', 'administrador'];
const ESTADO_FILTRO = ['Todos', 'Activos', 'Inactivos'];

// ─── Styled components ────────────────────────────────────────────────────────
const PageHeader = styled.header`margin-bottom: 2.5rem;`;

const Title = styled.h1`
  font-family: ${theme.fonts.headline};
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: ${theme.fontWeights.extrabold};
  color: ${theme.colors.primary};
  letter-spacing: -.02em;
  margin-bottom: .375rem;
`;

const Subtitle = styled.p`
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.onSurfaceVariant};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
  @media(min-width: ${theme.breakpoints.lg}) { grid-template-columns: repeat(4, 1fr); }
`;

const TabsScroll = styled.div`
  overflow-x: auto;
  margin-bottom: 1.75rem;
  padding-bottom: .25rem;
`;

const TabsBar = styled.div`
  display: flex;
  gap: .25rem;
  background: ${theme.colors.surfaceContainerHigh};
  border-radius: ${theme.radii.xl};
  padding: .3rem;
  width: fit-content;
  min-width: 100%;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .625rem 1.125rem;
  border-radius: ${theme.radii.lg};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  transition: all ${theme.transitions.base};
  white-space: nowrap;
  flex-shrink: 0;
  background: ${({ $active }) => $active ? theme.colors.surfaceContainerLowest : 'transparent'};
  color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.onSurfaceVariant};
  box-shadow: ${({ $active }) => $active ? theme.shadows.sm : 'none'};
  &:hover { background: ${({ $active }) => $active ? theme.colors.surfaceContainerLowest : theme.colors.surfaceContainerLowest + 'cc'}; }
`;

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const SectionLeft = styled.div``;

const SectionTitle = styled.h2`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
`;

const SectionDesc = styled.p`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.onSurfaceVariant};
  margin-top: .25rem;
`;

const ControlsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const SearchWrapper = styled.div`position: relative; flex: 1; min-width: 220px; max-width: 26rem;`;
const SearchIcon = styled.span`position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); color: ${theme.colors.outline}; pointer-events: none; display: flex;`;
const SearchInput = styled.input`
  width: 100%;
  padding: .75rem 1rem .75rem 2.75rem;
  background: ${theme.colors.surfaceContainerLow};
  border: none;
  border-radius: ${theme.radii.xl};
  font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.onSurface};
  outline: none;
  &::placeholder { color: ${theme.colors.outline}; opacity: .6; }
  &:focus { box-shadow: 0 0 0 2px ${theme.colors.primary}33; }
`;

const FilterGroup = styled.div`display: flex; align-items: center; gap: .375rem; flex-wrap: wrap;`;
const FilterLabel = styled.span`font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline}; font-weight: ${theme.fontWeights.bold}; text-transform: uppercase; letter-spacing: .08em;`;
const FilterChip = styled.button`
  padding: .3rem .875rem;
  border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  text-transform: capitalize;
  transition: all ${theme.transitions.fast};
  border: none; cursor: pointer;
  background: ${({ $active }) => $active ? theme.colors.primary : theme.colors.surfaceContainerHigh};
  color: ${({ $active }) => $active ? 'white' : theme.colors.onSurfaceVariant};
  &:hover { background: ${({ $active }) => $active ? theme.colors.primaryContainer : theme.colors.surfaceContainer}; }
`;

const ResultCount = styled.p`font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline}; margin-bottom: .75rem;`;

const SubTabsBar = styled.div`
  display: flex;
  gap: .5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid ${theme.colors.surfaceContainerHigh};
  padding-bottom: .5rem;
`;

const SubTab = styled.button`
  display: flex;
  align-items: center;
  gap: .375rem;
  padding: .5rem 1rem;
  border-radius: ${theme.radii.lg} ${theme.radii.lg} 0 0;
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  transition: all ${theme.transitions.fast};
  border-bottom: 3px solid ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.onSurfaceVariant};
  background: ${({ $active }) => $active ? theme.colors.primaryFixed : 'transparent'};
  &:hover { background: ${theme.colors.surfaceContainerLow}; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROL_BADGE = { docente: 'default', estudiante: 'success', administrador: 'active' };

const TogglePill = styled.button`
  display: inline-flex; align-items: center; gap: .375rem;
  padding: .25rem .625rem; border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.xs}; font-weight: ${theme.fontWeights.bold};
  cursor: pointer; border: none; transition: all ${theme.transitions.fast};
  background: ${({ $active }) => $active ? `${theme.colors.secondary}22` : `${theme.colors.outline}22`};
  color: ${({ $active }) => $active ? theme.colors.secondary : theme.colors.outline};
  &:hover {
    background: ${({ $active }) => $active ? theme.colors.errorContainer : theme.colors.secondaryFixed};
    color: ${({ $active }) => $active ? theme.colors.error : theme.colors.secondary};
  }
  &::before { content: ''; width: .45rem; height: .45rem; border-radius: 50%; background: currentColor; }
`;

// ─── Componente principal ─────────────────────────────────────────────────────
const AdminPage = ({ onLogout }) => {
  const { user } = useAuth();

  // ── Estado global por sección ──
  const [activeTab, setActiveTab]       = useState('personas');
  const [academicSub, setAcademicSub]   = useState('facultades'); // 'facultades' | 'programas'

  // ── Datos ──
  const [personas,     setPersonas]     = useState(MOCK_PERSONAS);
  const [devices,      setDevices]      = useState(MOCK_DISPOSITIVOS);
  const [facultades,   setFacultades]   = useState(MOCK_FACULTADES);
  const [programas,    setProgramas]    = useState(MOCK_PROGRAMAS);
  const [aulas,        setAulas]        = useState(MOCK_AULAS);
  const [horarios,     setHorarios]     = useState(MOCK_HORARIOS);
  const [cursos,       setCursos]       = useState(MOCK_CURSOS);

  // ── Búsqueda y filtros ──
  const [search,        setSearch]       = useState('');
  const [rolFiltro,     setRolFiltro]    = useState('Todos');
  const [estadoFiltro,  setEstadoFiltro] = useState('Todos');

  // ── Modales ──
  const [modal, setModal] = useState({ type: null, data: null });
  const openModal = (type, data = null) => setModal({ type, data });
  const closeModal = () => setModal({ type: null, data: null });

  // ── Helpers CRUD genérico ──
  const upsert = (setter, item) =>
    setter(prev => {
      const exists = prev.find(x => x.id === item.id);
      return exists ? prev.map(x => x.id === item.id ? item : x) : [...prev, item];
    });

  const toggleActivo = (setter, item) =>
    setter(prev => prev.map(x => x.id === item.id ? { ...x, activo: !x.activo } : x));

  // ── Filtrado personas ──
  const filteredPersonas = useMemo(() => {
    let data = personas;
    if (rolFiltro    !== 'Todos')   data = data.filter(p => p.rol === rolFiltro);
    if (estadoFiltro === 'Activos')  data = data.filter(p => p.activo);
    if (estadoFiltro === 'Inactivos')data = data.filter(p => !p.activo);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
        p.correo.toLowerCase().includes(q) ||
        p.rol.toLowerCase().includes(q) ||
        (p.programa?.toLowerCase().includes(q)) ||
        (p.codigoTarjeta?.toLowerCase().includes(q))
      );
    }
    return data;
  }, [personas, rolFiltro, estadoFiltro, search]);

  const hayFiltros = search.trim() || rolFiltro !== 'Todos' || estadoFiltro !== 'Todos';

  const resetFiltros = () => { setSearch(''); setRolFiltro('Todos'); setEstadoFiltro('Todos'); };

  const docentesList = personas.filter(p => p.rol === 'docente' && p.activo);

  // ─── Definición de columnas por sección ──────────────────────────────────
  const colsFacultades = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'activo', label: 'Estado', render: (v) => <StatusDot active={v} /> },
  ];

  const colsProgramas = [
    { key: 'nombre', label: 'Programa' },
    {
      key: 'facultad_id',
      label: 'Facultad',
      render: (v) => facultades.find(f => f.id === v)?.nombre ?? '—',
    },
    { key: 'activo', label: 'Estado', render: (v) => <StatusDot active={v} /> },
  ];

  const colsAulas = [
    { key: 'nombre',    label: 'Aula' },
    { key: 'edificio',  label: 'Edificio' },
    { key: 'capacidad', label: 'Cap.', align: 'center' },
    { key: 'activo',    label: 'Estado', render: (v) => <StatusDot active={v} /> },
  ];

  const colsHorarios = [
    {
      key: 'hora_inicio',
      label: 'Franja',
      render: (v, row) => `${v} – ${row.hora_fin}`,
    },
  ];

  const colsCursos = [
    { key: 'codigo',   label: 'Código' },
    { key: 'nombre',   label: 'Nombre' },
    { key: 'programa', label: 'Programa' },
    { key: 'docente',  label: 'Docente', render: (v) => v ?? <span style={{ color: theme.colors.error, fontSize: theme.fontSizes.xs }}>Sin asignar</span> },
    { key: 'semestre', label: 'Sem.', align: 'center', render: (v) => v ? `${v}°` : '—' },
    { key: 'totalEstudiantes', label: 'Estudiantes', align: 'center' },
    { key: 'activo',   label: 'Estado', render: (v) => <StatusDot active={v} /> },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Title>Panel de Administración</Title>
        <Subtitle>Gestión completa de la base de datos del sistema SmartClass RFID</Subtitle>
      </PageHeader>

      <StatsGrid>
        {ADMIN_STATS.map(stat => <AdminStatCard key={stat.id} stat={stat} />)}
      </StatsGrid>

      {/* ── Tabs principales ── */}
      <TabsScroll>
        <TabsBar role="tablist">
          {TABS.map(tab => (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => { setActiveTab(tab.id); resetFiltros(); }}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </Tab>
          ))}
        </TabsBar>
      </TabsScroll>

      {/* ══════════════════════════════════════════════════════════════
          TAB: PERSONAS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'personas' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Personas ({personas.length})</SectionTitle>
              <SectionDesc>Docentes, estudiantes y administradores del sistema.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openModal('persona')}>
              <Icon name="person_add" size="sm" />Nueva persona
            </Button>
          </SectionHeader>

          <ControlsRow>
            <SearchWrapper>
              <SearchIcon><Icon name="search" size="sm" /></SearchIcon>
              <SearchInput
                type="text"
                placeholder="Buscar por nombre, correo, rol, programa…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </SearchWrapper>
            <FilterGroup>
              <FilterLabel>Rol:</FilterLabel>
              {ROLES_FILTRO.map(r => (
                <FilterChip key={r} $active={rolFiltro === r} onClick={() => setRolFiltro(r)}>{r}</FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Estado:</FilterLabel>
              {ESTADO_FILTRO.map(e => (
                <FilterChip key={e} $active={estadoFiltro === e} onClick={() => setEstadoFiltro(e)}>{e}</FilterChip>
              ))}
            </FilterGroup>
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={resetFiltros}>
                <Icon name="clear" size="sm" />Limpiar
              </Button>
            )}
          </ControlsRow>

          <ResultCount>Mostrando {filteredPersonas.length} de {personas.length} personas{hayFiltros && ' (filtrado)'}</ResultCount>

          <PersonasTable
            personas={filteredPersonas}
            onEdit={(p) => openModal('persona', p)}
            onToggleActivo={(p) => {
              const accion = p.activo ? 'desactivar' : 'activar';
              if (window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${p.nombre} ${p.apellido}?`))
                toggleActivo(setPersonas, p);
            }}
            onLinkCard={(p) => openModal('linkCard', p)}
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: CURSOS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'cursos' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Cursos ({cursos.length})</SectionTitle>
              <SectionDesc>Materias, docentes asignados y franjas horarias.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openModal('curso')}>
              <Icon name="add" size="sm" />Nuevo curso
            </Button>
          </SectionHeader>

          <ControlsRow>
            <SearchWrapper>
              <SearchIcon><Icon name="search" size="sm" /></SearchIcon>
              <SearchInput
                type="text"
                placeholder="Buscar por código, nombre, programa o docente…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </SearchWrapper>
          </ControlsRow>

          <GenericTable
            columns={colsCursos}
            rows={cursos.filter(c => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (
                c.codigo.toLowerCase().includes(q) ||
                c.nombre.toLowerCase().includes(q) ||
                c.programa?.toLowerCase().includes(q) ||
                c.docente?.toLowerCase().includes(q)
              );
            })}
            actions={[
              { icon: 'edit',  title: 'Editar',              onClick: (r) => openModal('curso', r) },
              {
                icon: 'toggle_on',
                title: 'Cambiar estado',
                onClick: (r) => {
                  const accion = r.activo ? 'desactivar' : 'activar';
                  if (window.confirm(`¿${accion} el curso "${r.nombre}"?`))
                    toggleActivo(setCursos, r);
                },
              },
            ]}
            emptyMsg="No hay cursos registrados."
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: ACADÉMICO (Facultades + Programas)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'academico' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Estructura académica</SectionTitle>
              <SectionDesc>Gestión de facultades y programas académicos.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openModal(academicSub === 'facultades' ? 'facultad' : 'programa')}>
              <Icon name="add" size="sm" />
              {academicSub === 'facultades' ? 'Nueva facultad' : 'Nuevo programa'}
            </Button>
          </SectionHeader>

          <SubTabsBar>
            <SubTab $active={academicSub === 'facultades'} onClick={() => setAcademicSub('facultades')}>
              <Icon name="account_balance" size="sm" />Facultades ({facultades.length})
            </SubTab>
            <SubTab $active={academicSub === 'programas'} onClick={() => setAcademicSub('programas')}>
              <Icon name="school" size="sm" />Programas ({programas.length})
            </SubTab>
          </SubTabsBar>

          {academicSub === 'facultades' && (
            <GenericTable
              columns={colsFacultades}
              rows={facultades}
              actions={[
                { icon: 'edit', title: 'Editar', onClick: (r) => openModal('facultad', r) },
                {
                  icon: 'toggle_on',
                  title: 'Cambiar estado',
                  onClick: (r) => {
                    if (window.confirm(`¿${r.activo ? 'Desactivar' : 'Activar'} "${r.nombre}"?`))
                      toggleActivo(setFacultades, r);
                  },
                },
              ]}
              emptyMsg="No hay facultades registradas."
            />
          )}

          {academicSub === 'programas' && (
            <GenericTable
              columns={colsProgramas}
              rows={programas}
              actions={[
                { icon: 'edit', title: 'Editar', onClick: (r) => openModal('programa', r) },
                {
                  icon: 'toggle_on',
                  title: 'Cambiar estado',
                  onClick: (r) => {
                    if (window.confirm(`¿${r.activo ? 'Desactivar' : 'Activar'} "${r.nombre}"?`))
                      toggleActivo(setProgramas, r);
                  },
                },
              ]}
              emptyMsg="No hay programas registrados."
            />
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: AULAS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'aulas' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Aulas ({aulas.length})</SectionTitle>
              <SectionDesc>Salones y laboratorios donde se realizan las clases.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openModal('aula')}>
              <Icon name="add" size="sm" />Nueva aula
            </Button>
          </SectionHeader>

          <GenericTable
            columns={colsAulas}
            rows={aulas}
            actions={[
              { icon: 'edit', title: 'Editar', onClick: (r) => openModal('aula', r) },
              {
                icon: 'toggle_on',
                title: 'Cambiar estado',
                onClick: (r) => {
                  if (window.confirm(`¿${r.activo ? 'Desactivar' : 'Activar'} "${r.nombre}"?`))
                    toggleActivo(setAulas, r);
                },
              },
            ]}
            emptyMsg="No hay aulas registradas."
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: HORARIOS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'horarios' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Franjas horarias ({horarios.length})</SectionTitle>
              <SectionDesc>Bloques de tiempo disponibles para asignar a cursos y aulas.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openModal('horario')}>
              <Icon name="add" size="sm" />Nueva franja
            </Button>
          </SectionHeader>

          <GenericTable
            columns={colsHorarios}
            rows={horarios}
            actions={[
              { icon: 'edit',   title: 'Editar',    onClick: (r) => openModal('horario', r) },
              {
                icon: 'delete',
                title: 'Eliminar',
                danger: true,
                onClick: (r) => {
                  if (window.confirm(`¿Eliminar la franja ${r.hora_inicio}–${r.hora_fin}?`))
                    setHorarios(prev => prev.filter(h => h.id !== r.id));
                },
              },
            ]}
            emptyMsg="No hay franjas horarias registradas."
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: DISPOSITIVOS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'dispositivos' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Dispositivos RFID ({devices.length})</SectionTitle>
              <SectionDesc>Lectores ESP32 instalados en cada aula.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openModal('device')}>
              <Icon name="add" size="sm" />Agregar dispositivo
            </Button>
          </SectionHeader>
          <DevicesTable devices={devices} onEdit={(d) => openModal('device', d)} />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════════════════════ */}

      <PersonaFormModal
        isOpen={modal.type === 'persona'}
        onClose={closeModal}
        persona={modal.data}
        onSave={(d) => upsert(setPersonas, d)}
      />

      <LinkCardModal
        isOpen={modal.type === 'linkCard'}
        onClose={closeModal}
        persona={modal.data}
        onSave={(id, codigo) =>
          setPersonas(prev => prev.map(p => p.id === id ? { ...p, codigoTarjeta: codigo } : p))
        }
      />

      <DeviceFormModal
        isOpen={modal.type === 'device'}
        onClose={closeModal}
        device={modal.data}
        onSave={(d) => upsert(setDevices, d)}
      />

      <FacultadModal
        isOpen={modal.type === 'facultad'}
        onClose={closeModal}
        item={modal.data}
        onSave={(d) => upsert(setFacultades, d)}
      />

      <ProgramaModal
        isOpen={modal.type === 'programa'}
        onClose={closeModal}
        item={modal.data}
        onSave={(d) => upsert(setProgramas, d)}
        facultades={facultades}
      />

      <AulaModal
        isOpen={modal.type === 'aula'}
        onClose={closeModal}
        item={modal.data}
        onSave={(d) => upsert(setAulas, d)}
      />

      <HorarioModal
        isOpen={modal.type === 'horario'}
        onClose={closeModal}
        item={modal.data}
        onSave={(d) => upsert(setHorarios, d)}
      />

      <CursoModal
        isOpen={modal.type === 'curso'}
        onClose={closeModal}
        item={modal.data}
        onSave={(d) => upsert(setCursos, d)}
        programas={programas}
        docentes={docentesList}
        aulas={aulas}
        horarios={horarios}
        dias={MOCK_DIAS}
      />
    </AppLayout>
  );
};

export default AdminPage;