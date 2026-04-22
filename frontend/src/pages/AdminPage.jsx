// src/pages/AdminPage.jsx
// Tab "personas" conectado a la API real.
// Tab "académico" conectado a la API real (ya existía).
// Resto de tabs siguen con mocks.

import { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import AdminStatCard from '../components/admin/AdminStatCard';
import PersonasTable from '../components/admin/PersonasTable';
import GenericTable, { StatusDot } from '../components/admin/GenericTable';
import PersonaFormModal from '../components/admin/PersonaFormModal';
import LinkCardModal from '../components/admin/LinkCardModal';
import DeviceFormModal from '../components/admin/DeviceFormModal';
import { FacultadModal, ProgramaModal } from '../components/admin/FacultadProgramaModals';
import { AulaModal, HorarioModal } from '../components/admin/AulaHorarioModals';
import CursoModal from '../components/admin/CursoModal';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import {
  MOCK_DISPOSITIVOS,
  MOCK_AULAS, MOCK_HORARIOS, MOCK_DIAS, MOCK_CURSOS,
  MOCK_AULA_CURSO_HORARIO, ADMIN_STATS,
} from '../mocks/admin.mock';
import {
  getFacultades, createFacultad, updateFacultad, deleteFacultad,
  getProgramas, createPrograma, updatePrograma, deletePrograma,
} from '../api/academicoApi';
import {
  getPersonas, createPersona, updatePersona,
  toggleActivoPersona, linkTarjetaPersona,
} from '../api/personasApi';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'personas',     label: 'Personas',    icon: 'group'        },
  { id: 'cursos',       label: 'Cursos',       icon: 'menu_book'    },
  { id: 'academico',    label: 'Académico',    icon: 'school'       },
  { id: 'aulas',        label: 'Aulas',        icon: 'meeting_room' },
  { id: 'horarios',     label: 'Horarios',     icon: 'schedule'     },
  { id: 'dispositivos', label: 'Dispositivos', icon: 'sensors'      },
];

const ROLES_FILTRO  = ['Todos', 'docente', 'estudiante', 'administrador'];
const ESTADO_FILTRO = ['Todos', 'Activos', 'Inactivos'];

// ─── Styled ───────────────────────────────────────────────────────────────────
const PageHeader = styled.header`margin-bottom: 2.5rem;`;
const Title = styled.h1`
  font-family: ${theme.fonts.headline}; font-size: clamp(1.5rem,3vw,2.25rem);
  font-weight: ${theme.fontWeights.extrabold}; color: ${theme.colors.primary};
  letter-spacing: -.02em; margin-bottom: .375rem;
`;
const Subtitle = styled.p`font-size: ${theme.fontSizes.base}; color: ${theme.colors.onSurfaceVariant};`;
const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 2.5rem;
  @media(min-width:${theme.breakpoints.lg}){ grid-template-columns: repeat(4,1fr); }
`;
const TabsScroll = styled.div`overflow-x: auto; margin-bottom: 1.75rem; padding-bottom: .25rem;`;
const TabsBar = styled.div`
  display: flex; gap: .25rem; background: ${theme.colors.surfaceContainerHigh};
  border-radius: ${theme.radii.xl}; padding: .3rem; width: fit-content; min-width: 100%;
`;
const Tab = styled.button`
  display: flex; align-items: center; gap: .5rem; padding: .625rem 1.125rem;
  border-radius: ${theme.radii.lg}; font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold}; transition: all ${theme.transitions.base};
  white-space: nowrap; flex-shrink: 0;
  background: ${({ $a }) => $a ? theme.colors.surfaceContainerLowest : 'transparent'};
  color: ${({ $a }) => $a ? theme.colors.primary : theme.colors.onSurfaceVariant};
  box-shadow: ${({ $a }) => $a ? theme.shadows.sm : 'none'};
`;
const SectionHeader = styled.div`
  display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;
  justify-content: space-between; margin-bottom: 1.25rem;
`;
const SectionLeft = styled.div``;
const SectionTitle = styled.h2`
  font-family: ${theme.fonts.headline}; font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold}; color: ${theme.colors.primary};
`;
const SectionDesc = styled.p`font-size: ${theme.fontSizes.sm}; color: ${theme.colors.onSurfaceVariant}; margin-top: .25rem;`;
const ControlsRow = styled.div`display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; margin-bottom: 1rem;`;
const SearchWrap = styled.div`position: relative; flex: 1; min-width: 220px; max-width: 26rem;`;
const SIcon = styled.span`position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); color: ${theme.colors.outline}; pointer-events: none; display: flex;`;
const SearchInput = styled.input`
  width: 100%; padding: .75rem 1rem .75rem 2.75rem;
  background: ${theme.colors.surfaceContainerLow}; border: none;
  border-radius: ${theme.radii.xl}; font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.sm}; color: ${theme.colors.onSurface}; outline: none;
  &::placeholder { color: ${theme.colors.outline}; opacity: .6; }
  &:focus { box-shadow: 0 0 0 2px ${theme.colors.primary}33; }
`;
const FGroup = styled.div`display: flex; align-items: center; gap: .375rem; flex-wrap: wrap;`;
const FLabel = styled.span`font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline}; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;`;
const FChip = styled.button`
  padding: .3rem .875rem; border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.xs}; font-weight: 600; text-transform: capitalize;
  transition: all ${theme.transitions.fast}; border: none; cursor: pointer;
  background: ${({ $a }) => $a ? theme.colors.primary : theme.colors.surfaceContainerHigh};
  color: ${({ $a }) => $a ? 'white' : theme.colors.onSurfaceVariant};
`;
const ResultCount = styled.p`font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline}; margin-bottom: .75rem;`;
const SubTabsBar = styled.div`display: flex; gap: .5rem; margin-bottom: 1.5rem; border-bottom: 2px solid ${theme.colors.surfaceContainerHigh}; padding-bottom: .5rem;`;
const SubTab = styled.button`
  display: flex; align-items: center; gap: .375rem; padding: .5rem 1rem;
  border-radius: ${theme.radii.lg} ${theme.radii.lg} 0 0; font-size: ${theme.fontSizes.sm};
  font-weight: 600; transition: all ${theme.transitions.fast};
  border-bottom: 3px solid ${({ $a }) => $a ? theme.colors.primary : 'transparent'};
  color: ${({ $a }) => $a ? theme.colors.primary : theme.colors.onSurfaceVariant};
  background: ${({ $a }) => $a ? theme.colors.primaryFixed : 'transparent'};
`;
const LoadingBox = styled.div`
  padding: 3rem; text-align: center; color: ${theme.colors.outline};
  font-size: ${theme.fontSizes.sm};
  display: flex; flex-direction: column; align-items: center; gap: .75rem;
`;
const ErrorBox = styled.div`
  padding: 1rem 1.25rem; border-radius: ${theme.radii.lg};
  background: ${theme.colors.errorContainer}; color: ${theme.colors.error};
  font-size: ${theme.fontSizes.sm}; display: flex; align-items: center; gap: .5rem;
  margin-bottom: 1rem;
`;
const Spinner = styled.div`
  width: 1.5rem; height: 1.5rem;
  border: 2px solid ${theme.colors.primaryFixed};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const durTexto = (inicio, fin) => {
  if (!inicio || !fin) return '';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min <= 0) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
};

// Normaliza persona de la API al shape que esperan PersonasTable y PersonaFormModal
// API devuelve: { id, nombre, apellido, correo, codigo_tarjeta, activo, rol, programa }
// Componentes esperan: { ..., codigoTarjeta }
function normalizePersona(p) {
  return {
    ...p,
    codigoTarjeta: p.codigo_tarjeta ?? null,
    programa_id:   p.programa_id   ?? null,
  };
}

// ─── AdminPage ────────────────────────────────────────────────────────────────
const AdminPage = ({ onLogout }) => {
  const { user, token } = useAuth();

  const [tab,     setTab]     = useState('personas');
  const [acSub,   setAcSub]   = useState('facultades');
  const [search,  setSearch]  = useState('');
  const [rolF,    setRolF]    = useState('Todos');
  const [estadoF, setEstadoF] = useState('Todos');

  // ── Datos mock (tabs sin API aún) ──────────────────────────────────────────
  const [devices,   setDevices]   = useState(MOCK_DISPOSITIVOS);
  const [aulas,     setAulas]     = useState(MOCK_AULAS);
  const [horarios,  setHorarios]  = useState(MOCK_HORARIOS);
  const [cursos,    setCursos]    = useState(MOCK_CURSOS);
  const [achs,      setAchs]      = useState(MOCK_AULA_CURSO_HORARIO);

  // ── Datos reales: Personas ─────────────────────────────────────────────────
  const [personas,    setPersonas]    = useState([]);
  const [persLoading, setPersLoading] = useState(false);
  const [persError,   setPersError]   = useState(null);

  const loadPersonas = useCallback(async () => {
    if (!token) return;
    setPersLoading(true);
    setPersError(null);
    try {
      const data = await getPersonas(token);
      setPersonas(data.map(normalizePersona));
    } catch (err) {
      setPersError(err.message);
    } finally {
      setPersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === 'personas') loadPersonas();
  }, [tab, loadPersonas]);

  // ── Datos reales: Académico ────────────────────────────────────────────────
  const [facultades, setFacultades] = useState([]);
  const [programas,  setProgramas]  = useState([]);
  const [acLoading,  setAcLoading]  = useState(false);
  const [acError,    setAcError]    = useState(null);

  const loadAcademico = useCallback(async () => {
    if (!token) return;
    setAcLoading(true);
    setAcError(null);
    try {
      const [facs, progs] = await Promise.all([
        getFacultades(token),
        getProgramas(token),
      ]);
      setFacultades(facs);
      setProgramas(progs);
    } catch (err) {
      setAcError(err.message);
    } finally {
      setAcLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === 'academico') loadAcademico();
  }, [tab, loadAcademico]);

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState({ type: null, data: null });
  const openM  = (type, data = null) => setModal({ type, data });
  const closeM = () => setModal({ type: null, data: null });

  // ── Handlers REALES: Personas ──────────────────────────────────────────────
  const handleSavePersona = async (formData) => {
    // Si tiene id numérico real (no Date.now()) es edición; sino es creación
    const isEdit = formData.id && Number.isInteger(formData.id);
    try {
      if (isEdit) {
        const { nombre, apellido, correo, activo, programa_id } = formData;
        const updated = await updatePersona(token, formData.id, {
          nombre, apellido, correo, activo,
          programa_id: programa_id || null,
        });
        setPersonas(prev =>
          prev.map(p => p.id === updated.id ? normalizePersona({ ...p, ...updated }) : p)
        );
      } else {
        const { nombre, apellido, correo, rol, programa_id } = formData;
        const created = await createPersona(token, {
          nombre, apellido, correo, rol,
          programa_id: programa_id || null,
        });
        setPersonas(prev => [...prev, normalizePersona(created)]);
      }
      closeM();
    } catch (err) {
      alert(`Error al guardar persona: ${err.message}`);
    }
  };

  const handleToggleActivo = async (persona) => {
    const accion = persona.activo ? 'Desactivar' : 'Activar';
    if (!window.confirm(`¿${accion} a ${persona.nombre} ${persona.apellido}?`)) return;
    try {
      const updated = await toggleActivoPersona(token, persona.id, !persona.activo);
      setPersonas(prev =>
        prev.map(p => p.id === updated.id ? normalizePersona({ ...p, ...updated }) : p)
      );
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleLinkCard = async (personaId, codigoTarjeta) => {
    try {
      const updated = await linkTarjetaPersona(token, personaId, codigoTarjeta);
      setPersonas(prev =>
        prev.map(p =>
          p.id === updated.id
            ? { ...p, codigo_tarjeta: updated.codigo_tarjeta, codigoTarjeta: updated.codigo_tarjeta }
            : p
        )
      );
    } catch (err) {
      alert(`Error al vincular tarjeta: ${err.message}`);
    }
  };

  // ── Handlers REALES: Facultades ────────────────────────────────────────────
  const handleSaveFacultad = async (data) => {
    try {
      if (data.id) {
        const updated = await updateFacultad(token, data.id, { nombre: data.nombre });
        setFacultades(p => p.map(f => f.id === updated.id ? { ...f, ...updated } : f));
      } else {
        const created = await createFacultad(token, { nombre: data.nombre });
        setFacultades(p => [...p, { ...created, total_programas: 0 }]);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    closeM();
  };

  const handleDeleteFacultad = async (item) => {
    if (!window.confirm(`¿Eliminar la facultad "${item.nombre}" y todos sus programas?`)) return;
    try {
      await deleteFacultad(token, item.id);
      setFacultades(p => p.filter(f => f.id !== item.id));
      setProgramas(p => p.filter(pr => pr.facultad_id !== item.id));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Handlers REALES: Programas ─────────────────────────────────────────────
  const handleSavePrograma = async (data) => {
    try {
      if (data.id) {
        const updated = await updatePrograma(token, data.id, {
          nombre: data.nombre,
          codigo: data.codigo || null,
          facultad_id: data.facultad_id,
        });
        setProgramas(p => p.map(pr => pr.id === updated.id ? updated : pr));
        setFacultades(prev => prev.map(f => ({
          ...f,
          total_programas: programas.filter(pr =>
            (pr.id === updated.id ? updated.facultad_id : pr.facultad_id) === f.id
          ).length,
        })));
      } else {
        const created = await createPrograma(token, {
          nombre: data.nombre,
          codigo: data.codigo || null,
          facultad_id: data.facultad_id,
        });
        setProgramas(p => [...p, created]);
        setFacultades(prev => prev.map(f =>
          f.id === created.facultad_id
            ? { ...f, total_programas: (f.total_programas ?? 0) + 1 }
            : f
        ));
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    closeM();
  };

  const handleDeletePrograma = async (item) => {
    if (!window.confirm(`¿Eliminar el programa "${item.nombre}"?`)) return;
    try {
      await deletePrograma(token, item.id);
      setProgramas(p => p.filter(pr => pr.id !== item.id));
      setFacultades(prev => prev.map(f =>
        f.id === item.facultad_id
          ? { ...f, total_programas: Math.max(0, (f.total_programas ?? 1) - 1) }
          : f
      ));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Handlers mock (tabs sin API) ───────────────────────────────────────────
  const upsert = (setter, item) =>
    setter(p => p.find(x => x.id === item.id) ? p.map(x => x.id === item.id ? item : x) : [...p, item]);

  const confirmToggle = (setter, item, nombre) => {
    if (window.confirm(`¿${item.activo ? 'Desactivar' : 'Activar'} "${nombre}"?`))
      setter(p => p.map(x => x.id === item.id ? { ...x, activo: !x.activo } : x));
  };

  // ── Filtrado local de personas ─────────────────────────────────────────────
  const filtPersonas = useMemo(() => {
    let d = personas;
    if (rolF !== 'Todos')        d = d.filter(p => p.rol === rolF);
    if (estadoF === 'Activos')   d = d.filter(p => p.activo);
    if (estadoF === 'Inactivos') d = d.filter(p => !p.activo);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
        p.correo.toLowerCase().includes(q) ||
        p.rol?.toLowerCase().includes(q) ||
        p.programa?.toLowerCase().includes(q) ||
        p.codigoTarjeta?.toLowerCase().includes(q)
      );
    }
    return d;
  }, [personas, rolF, estadoF, search]);

  const hayF = search.trim() || rolF !== 'Todos' || estadoF !== 'Todos';
  const reset = () => { setSearch(''); setRolF('Todos'); setEstadoF('Todos'); };

  // ── Columnas tablas ────────────────────────────────────────────────────────
  const colsFacultades = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'total_programas', label: 'Programas', align: 'center', render: (v) => (
      <span style={{ color: theme.colors.outline, fontSize: theme.fontSizes.xs }}>
        {v ?? 0} programa{(v ?? 0) !== 1 ? 's' : ''}
      </span>
    )},
    { key: 'created_at', label: 'Creada', render: (v) => v
      ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—'
    },
  ];

  const colsProgramas = [
    { key: 'nombre',  label: 'Programa' },
    { key: 'codigo',  label: 'Código', render: (v) => v
      ? <code style={{ fontSize: theme.fontSizes.xs, background: theme.colors.surfaceContainerLow, padding: '2px 6px', borderRadius: 4 }}>{v}</code>
      : <span style={{ color: theme.colors.outline }}>—</span>
    },
    { key: 'facultad', label: 'Facultad' },
  ];

  const colsAulas = [
    { key: 'numero',    label: 'Número' },
    { key: 'nombre',    label: 'Nombre' },
    { key: 'edificio',  label: 'Edificio' },
    { key: 'piso',      label: 'Piso',      align: 'center' },
    { key: 'capacidad', label: 'Capacidad', align: 'center', render: (v) => v ? `${v} pers.` : '—' },
  ];

  const colsHorarios = [
    { key: 'dia',         label: 'Día' },
    { key: 'hora_inicio', label: 'Inicio' },
    { key: 'hora_fin',    label: 'Fin' },
    { key: 'hora_inicio', label: 'Duración', render: (v, row) => {
      const d = durTexto(row.hora_inicio, row.hora_fin);
      return d
        ? <span style={{ background: theme.colors.primaryFixed, color: theme.colors.primary, padding: '2px 8px', borderRadius: 99, fontSize: theme.fontSizes.xs, fontWeight: 600 }}>⏱ {d}</span>
        : '—';
    }},
  ];

  const colsCursos = [
    { key: 'codigo',       label: 'Código' },
    { key: 'nombre',       label: 'Nombre' },
    { key: 'docente',      label: 'Docente', render: (v) =>
      v ? v : <span style={{ color: theme.colors.error, fontSize: theme.fontSizes.xs }}>Sin asignar</span>
    },
    { key: 'fecha_inicio', label: 'Inicio' },
    { key: 'fecha_fin',    label: 'Fin' },
    { key: 'activo',       label: 'Estado', render: (v) => <StatusDot active={v} /> },
  ];

  const colsDevices = [
    { key: 'codigo',      label: 'Código' },
    { key: 'aula',        label: 'Aula' },
    { key: 'ip_address',  label: 'IP' },
    { key: 'mac_address', label: 'MAC' },
    { key: 'estado',      label: 'Estado', render: (v) => (
      <span style={{
        background: v === 'Activo' ? theme.colors.secondaryFixed : v === 'Mantenimiento' ? theme.colors.tertiaryFixed : theme.colors.errorContainer,
        color: v === 'Activo' ? theme.colors.secondary : v === 'Mantenimiento' ? '#7b2e12' : theme.colors.error,
        padding: '2px 8px', borderRadius: 99, fontSize: theme.fontSizes.xs, fontWeight: 700,
      }}>{v}</span>
    )},
  ];

  const achDeCurso = (cursoId) => achs.filter(a => a.curso_id === cursoId);

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Title>Panel de Administración</Title>
        <Subtitle>Gestión completa de la base de datos — SmartClass RFID</Subtitle>
      </PageHeader>

      <StatsGrid>
        {ADMIN_STATS.map(s => <AdminStatCard key={s.id} stat={s} />)}
      </StatsGrid>

      {/* Tabs */}
      <TabsScroll>
        <TabsBar>
          {TABS.map(t => (
            <Tab key={t.id} $a={tab === t.id} onClick={() => { setTab(t.id); reset(); }}>
              <Icon name={t.icon} size="sm" />{t.label}
            </Tab>
          ))}
        </TabsBar>
      </TabsScroll>

      {/* ══ PERSONAS (API REAL) ══ */}
      {tab === 'personas' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Personas ({personas.length})</SectionTitle>
              <SectionDesc>Docentes, estudiantes y administradores registrados en el sistema.</SectionDesc>
            </SectionLeft>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <Button variant="outlined" size="sm" onClick={loadPersonas} title="Recargar datos">
                <Icon name="refresh" size="sm" />
              </Button>
              <Button size="sm" onClick={() => openM('persona')}>
                <Icon name="person_add" size="sm" />Nueva persona
              </Button>
            </div>
          </SectionHeader>

          {!persLoading && persError && (
            <ErrorBox role="alert">
              <Icon name="error" size="sm" />
              {persError}
              <Button variant="ghost" size="sm" onClick={loadPersonas} style={{ marginLeft: 'auto' }}>
                Reintentar
              </Button>
            </ErrorBox>
          )}

          {persLoading ? (
            <LoadingBox>
              <Spinner />
              Cargando personas desde la base de datos…
            </LoadingBox>
          ) : (
            <>
              <ControlsRow>
                <SearchWrap>
                  <SIcon><Icon name="search" size="sm" /></SIcon>
                  <SearchInput
                    placeholder="Buscar por nombre, correo, rol, programa…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </SearchWrap>
                <FGroup>
                  <FLabel>Rol:</FLabel>
                  {ROLES_FILTRO.map(r => <FChip key={r} $a={rolF === r} onClick={() => setRolF(r)}>{r}</FChip>)}
                </FGroup>
                <FGroup>
                  <FLabel>Estado:</FLabel>
                  {ESTADO_FILTRO.map(e => <FChip key={e} $a={estadoF === e} onClick={() => setEstadoF(e)}>{e}</FChip>)}
                </FGroup>
                {hayF && (
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <Icon name="clear" size="sm" />Limpiar
                  </Button>
                )}
              </ControlsRow>
              <ResultCount>
                Mostrando {filtPersonas.length} de {personas.length} personas{hayF && ' (filtrado)'}
              </ResultCount>
              <PersonasTable
                personas={filtPersonas}
                onEdit={(p) => openM('persona', p)}
                onToggleActivo={handleToggleActivo}
                onLinkCard={(p) => openM('linkCard', p)}
              />
            </>
          )}
        </section>
      )}

      {/* ══ CURSOS ══ */}
      {tab === 'cursos' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Cursos ({cursos.length})</SectionTitle>
              <SectionDesc>Materias con docente, fechas de vigencia y asignaciones de aula+horario.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openM('curso')}>
              <Icon name="add" size="sm" />Nuevo curso
            </Button>
          </SectionHeader>
          <ControlsRow>
            <SearchWrap>
              <SIcon><Icon name="search" size="sm" /></SIcon>
              <SearchInput placeholder="Buscar por código, nombre o docente…" value={search} onChange={e => setSearch(e.target.value)} />
            </SearchWrap>
          </ControlsRow>
          <GenericTable
            columns={colsCursos}
            rows={cursos.filter(c => !search.trim() || [c.codigo, c.nombre, c.docente].some(v => v?.toLowerCase().includes(search.toLowerCase())))}
            actions={[
              { icon: 'edit', title: 'Editar', onClick: (r) => openM('curso', r) },
              { icon: 'toggle_on', title: 'Cambiar estado', onClick: (r) => confirmToggle(setCursos, r, r.nombre) },
            ]}
            emptyMsg="No hay cursos registrados."
          />
        </section>
      )}

      {/* ══ ACADÉMICO (API REAL) ══ */}
      {tab === 'academico' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Estructura académica</SectionTitle>
              <SectionDesc>Facultades y programas académicos registrados en la base de datos.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openM(acSub === 'facultades' ? 'facultad' : 'programa')}>
              <Icon name="add" size="sm" />
              {acSub === 'facultades' ? 'Nueva facultad' : 'Nuevo programa'}
            </Button>
          </SectionHeader>

          <SubTabsBar>
            <SubTab $a={acSub === 'facultades'} onClick={() => setAcSub('facultades')}>
              <Icon name="account_balance" size="sm" />Facultades ({facultades.length})
            </SubTab>
            <SubTab $a={acSub === 'programas'} onClick={() => setAcSub('programas')}>
              <Icon name="school" size="sm" />Programas ({programas.length})
            </SubTab>
            <Button variant="ghost" size="sm" onClick={loadAcademico} style={{ marginLeft: 'auto' }} title="Recargar datos">
              <Icon name="refresh" size="sm" />Actualizar
            </Button>
          </SubTabsBar>

          {acLoading && <LoadingBox><Spinner />Cargando desde la base de datos…</LoadingBox>}
          {!acLoading && acError && (
            <ErrorBox role="alert">
              <Icon name="error" size="sm" />
              {acError}
              <Button variant="ghost" size="sm" onClick={loadAcademico} style={{ marginLeft: 'auto' }}>Reintentar</Button>
            </ErrorBox>
          )}
          {!acLoading && !acError && acSub === 'facultades' && (
            facultades.length === 0 ? (
              <LoadingBox>
                <Icon name="account_balance" size="lg" style={{ color: theme.colors.outline, opacity: .4 }} />
                No hay facultades registradas. Crea la primera.
              </LoadingBox>
            ) : (
              <GenericTable columns={colsFacultades} rows={facultades}
                actions={[
                  { icon: 'edit',   title: 'Editar',   onClick: (r) => openM('facultad', r) },
                  { icon: 'delete', title: 'Eliminar', danger: true, onClick: handleDeleteFacultad },
                ]}
                emptyMsg="No hay facultades." />
            )
          )}
          {!acLoading && !acError && acSub === 'programas' && (
            programas.length === 0 ? (
              <LoadingBox>
                <Icon name="school" size="lg" style={{ color: theme.colors.outline, opacity: .4 }} />
                No hay programas registrados.{facultades.length === 0 && ' Primero crea una facultad.'}
              </LoadingBox>
            ) : (
              <GenericTable columns={colsProgramas} rows={programas}
                actions={[
                  { icon: 'edit',   title: 'Editar',   onClick: (r) => openM('programa', r) },
                  { icon: 'delete', title: 'Eliminar', danger: true, onClick: handleDeletePrograma },
                ]}
                emptyMsg="No hay programas." />
            )
          )}
        </section>
      )}

      {/* ══ AULAS ══ */}
      {tab === 'aulas' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Aulas ({aulas.length})</SectionTitle>
              <SectionDesc>Salones y laboratorios.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openM('aula')}><Icon name="add" size="sm" />Nueva aula</Button>
          </SectionHeader>
          <GenericTable columns={colsAulas} rows={aulas}
            actions={[{ icon: 'edit', title: 'Editar', onClick: (r) => openM('aula', r) }]}
            emptyMsg="No hay aulas registradas." />
        </section>
      )}

      {/* ══ HORARIOS ══ */}
      {tab === 'horarios' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Franjas horarias ({horarios.length})</SectionTitle>
              <SectionDesc>Cada franja combina un día de la semana con hora de inicio y fin.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openM('horario')}><Icon name="add" size="sm" />Nueva franja</Button>
          </SectionHeader>
          <GenericTable columns={colsHorarios} rows={horarios}
            actions={[
              { icon: 'edit',   title: 'Editar',   onClick: (r) => openM('horario', r) },
              { icon: 'delete', title: 'Eliminar', danger: true, onClick: (r) => {
                if (window.confirm(`¿Eliminar la franja "${r.dia} ${r.hora_inicio}–${r.hora_fin}"?`))
                  setHorarios(p => p.filter(h => h.id !== r.id));
              }},
            ]}
            emptyMsg="No hay franjas horarias." />
        </section>
      )}

      {/* ══ DISPOSITIVOS ══ */}
      {tab === 'dispositivos' && (
        <section>
          <SectionHeader>
            <SectionLeft>
              <SectionTitle>Dispositivos RFID ({devices.length})</SectionTitle>
              <SectionDesc>Lectores ESP32 instalados en las aulas.</SectionDesc>
            </SectionLeft>
            <Button size="sm" onClick={() => openM('device')}><Icon name="add" size="sm" />Agregar dispositivo</Button>
          </SectionHeader>
          <GenericTable columns={colsDevices} rows={devices}
            actions={[{ icon: 'edit', title: 'Editar', onClick: (r) => openM('device', r) }]}
            emptyMsg="No hay dispositivos registrados." />
        </section>
      )}

      {/* ══ MODALES ══ */}

      <PersonaFormModal
        isOpen={modal.type === 'persona'}
        onClose={closeM}
        persona={modal.data}
        onSave={handleSavePersona}
        programas={programas}
        facultades={facultades}
      />

      <LinkCardModal
        isOpen={modal.type === 'linkCard'}
        onClose={closeM}
        persona={modal.data}
        onSave={(id, code) => handleLinkCard(id, code)}
      />

      <DeviceFormModal
        isOpen={modal.type === 'device'} onClose={closeM}
        device={modal.data} onSave={(d) => upsert(setDevices, d)}
        aulas={aulas}
      />

      <FacultadModal
        isOpen={modal.type === 'facultad'} onClose={closeM}
        item={modal.data}
        onSave={handleSaveFacultad}
      />
      <ProgramaModal
        isOpen={modal.type === 'programa'} onClose={closeM}
        item={modal.data}
        onSave={handleSavePrograma}
        facultades={facultades}
      />

      <AulaModal
        isOpen={modal.type === 'aula'} onClose={closeM}
        item={modal.data} onSave={(d) => upsert(setAulas, d)}
      />
      <HorarioModal
        isOpen={modal.type === 'horario'} onClose={closeM}
        item={modal.data} onSave={(d) => upsert(setHorarios, d)}
        dias={MOCK_DIAS}
      />
      <CursoModal
        isOpen={modal.type === 'curso'} onClose={closeM}
        item={modal.data}
        onSave={(d) => { upsert(setCursos, d); }}
        docentes={personas.filter(p => p.rol === 'docente' && p.activo)}
        aulas={aulas}
        horarios={horarios}
        achExistentes={modal.data ? achDeCurso(modal.data.id) : []}
      />
    </AppLayout>
  );
};

export default AdminPage;
