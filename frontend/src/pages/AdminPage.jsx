// frontend/src/pages/AdminPage.jsx
// Coordinador puro: monta hooks de datos, gestiona el tab activo y los modales.

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import AdminStatCard from '../components/admin/AdminStatCard';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

// API
import { getAdminStats } from '../api/statsApi';

// Hooks de datos
import { usePersonas }     from '../hooks/usePersonas';
import { useCursos }       from '../hooks/useCursos';
import { useDispositivos } from '../hooks/useDispositivos';
import { useAcademico }    from '../hooks/useAcademico';
import { useAulas }        from '../hooks/useAulas';
import { useHorarios }     from '../hooks/useHorarios';

// Tabs
import { PersonasTab }                from '../components/admin/PersonasTab';
import { DispositivosTab }            from '../components/admin/DispositivosTab';
import AcademicoTabPlaceholder        from '../components/admin/AcademicoTab';
import HorariosTabPlaceholder         from '../components/admin/HorariosTab';
import CursosTabPlaceholder           from '../components/admin/CursosTab';
import AulasTab                       from '../components/admin/AulasTab';

// Modales
import PersonaFormModal               from '../components/admin/PersonaFormModal';
import LinkCardModal                  from '../components/admin/LinkCardModal';
import DeviceFormModal                from '../components/admin/DeviceFormModal';
import { FacultadModal, ProgramaModal } from '../components/admin/FacultadProgramaModals';
import { AulaModal, HorarioModal }    from '../components/admin/AulaHorarioModals';
import CursoGestionModal              from '../components/admin/CursoGestionModal';
import { getDias }                    from '../api/horariosApi';

import { MOCK_DIAS } from '../mocks/admin.mock';

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'personas',     label: 'Personas',     icon: 'group'        },
  { id: 'cursos',       label: 'Cursos',        icon: 'menu_book'    },
  { id: 'academico',    label: 'Académico',     icon: 'school'       },
  { id: 'aulas',        label: 'Aulas',         icon: 'meeting_room' },
  { id: 'horarios',     label: 'Horarios',      icon: 'schedule'     },
  { id: 'dispositivos', label: 'Dispositivos',  icon: 'sensors'      },
];

// ─── Styled ────────────────────────────────────────────────────────────────────
const PageHeader = styled.header`margin-bottom: 2.5rem;`;
const Title      = styled.h1`
  font-family: ${theme.fonts.headline};
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: ${theme.fontWeights.extrabold};
  color: ${theme.colors.primary};
  letter-spacing: -.02em;
  margin-bottom: .375rem;
`;
const Subtitle   = styled.p`font-size: ${theme.fontSizes.base}; color: ${theme.colors.onSurfaceVariant};`;
const StatsGrid  = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
  @media(min-width: ${theme.breakpoints.lg}) { grid-template-columns: repeat(4, 1fr); }
`;
const TabsScroll = styled.div`overflow-x: auto; margin-bottom: 1.75rem; padding-bottom: .25rem;`;
const TabsBar    = styled.div`
  display: flex; gap: .25rem;
  background: ${theme.colors.surfaceContainerHigh};
  border-radius: ${theme.radii.xl};
  padding: .3rem;
  width: fit-content; min-width: 100%;
`;
const Tab = styled.button`
  display: flex; align-items: center; gap: .5rem;
  padding: .625rem 1.125rem;
  border-radius: ${theme.radii.lg};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  transition: all ${theme.transitions.base};
  white-space: nowrap; flex-shrink: 0;
  background: ${({ $a }) => $a ? theme.colors.surfaceContainerLowest : 'transparent'};
  color:      ${({ $a }) => $a ? theme.colors.primary : theme.colors.onSurfaceVariant};
  box-shadow: ${({ $a }) => $a ? theme.shadows.sm : 'none'};
`;

// ─── Stats iniciales vacíos ─────────────────────────────────────────────────
const EMPTY_STATS = [
  { id: 'personas',     label: 'Personas registradas', value: '—', icon: 'group',     delta: 'Cargando…' },
  { id: 'cursos',       label: 'Cursos activos',        value: '—', icon: 'menu_book', delta: 'Cargando…' },
  { id: 'dispositivos', label: 'Dispositivos RFID',     value: '—', icon: 'sensors',   delta: 'Cargando…' },
  { id: 'sesiones',     label: 'Sesiones hoy',          value: '—', icon: 'today',     delta: 'Cargando…' },
];

// ─── Componente ────────────────────────────────────────────────────────────────
const AdminPage = ({ onLogout }) => {
  const { user, token } = useAuth();

  // Estado de UI
  const [tab,     setTab]     = useState('personas');
  const [search,  setSearch]  = useState('');
  const [rolF,    setRolF]    = useState('Todos');
  const [estadoF, setEstadoF] = useState('Todos');
  const [modal,   setModal]   = useState({ type: null, data: null });
  const [dias,    setDias]    = useState([]);

  // Stats reales
  const [stats, setStats] = useState(EMPTY_STATS);

  // Hooks de datos
  const personasHook     = usePersonas(token);
  const cursosHook       = useCursos(token);
  const dispositivosHook = useDispositivos(token);
  const academicoHook    = useAcademico(token);
  const aulasHook        = useAulas(token);
  const horariosHook     = useHorarios(token);

  // ── Cargar stats reales al montar ──────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getAdminStats(token);
      setStats([
        {
          id: 'personas',
          label: 'Personas registradas',
          value: data.personas.value,
          icon: 'group',
          delta: data.personas.delta,
        },
        {
          id: 'cursos',
          label: 'Cursos activos',
          value: data.cursos.value,
          icon: 'menu_book',
          delta: data.cursos.delta,
        },
        {
          id: 'dispositivos',
          label: 'Dispositivos RFID',
          value: data.dispositivos.value,
          icon: 'sensors',
          delta: data.dispositivos.delta,
        },
        {
          id: 'sesiones',
          label: 'Sesiones hoy',
          value: data.sesiones.value,
          icon: 'today',
          delta: data.sesiones.delta,
        },
      ]);
    } catch (err) {
      console.error('Error cargando stats:', err.message);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [token]);

  // ── Cargar datos al cambiar de tab ─────────────────────────────────────────
  useEffect(() => {
    const loaders = {
      personas:     personasHook.load,
      cursos:       cursosHook.load,
      dispositivos: dispositivosHook.load,
      academico:    academicoHook.load,
      horarios:     horariosHook.load,
      aulas:        aulasHook.load,
    };
    loaders[tab]?.();

    // Aulas también son necesarias para modales de dispositivos y cursos
    if (tab === 'dispositivos' || tab === 'cursos') {
      aulasHook.load();
    }
    // Horarios también necesarios para el modal de cursos
    if (tab === 'cursos') {
      horariosHook.load();
    }

    setSearch('');
    setRolF('Todos');
    setEstadoF('Todos');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Cargar días cuando se abre el modal de horarios ────────────────────────
  useEffect(() => {
    if (modal.type === 'horario' && token && dias.length === 0) {
      getDias(token)
        .then(setDias)
        .catch(err => console.error('Error cargando días:', err));
    }
  }, [modal.type, token, dias.length]);

  // ── Cargar aulas + horarios cuando se abre el modal de curso ───────────────
  useEffect(() => {
    if (modal.type === 'curso' && token) {
      aulasHook.load();
      horariosHook.load();
    }
  }, [modal.type, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cargar aulas cuando se abre modal de dispositivo ───────────────────────
  useEffect(() => {
    if (modal.type === 'device' && token && aulasHook.aulas.length === 0) {
      aulasHook.load();
    }
  }, [modal.type, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cargar programas/facultades cuando se abre modal de persona ────────────
  useEffect(() => {
    if (modal.type === 'persona' && token && academicoHook.programas.length === 0) {
      academicoHook.load();
    }
  }, [modal.type, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const openM  = (type, data = null) => setModal({ type, data });
  const closeM = () => setModal({ type: null, data: null });

  // ── Handlers de guardado ───────────────────────────────────────────────────
  const handleSavePersona = async (formData) => {
    try {
      await personasHook.save(formData);
      closeM();
      loadStats(); // refrescar contador
    } catch (err) { alert(`Error al guardar persona: ${err.message}`); }
  };

  const handleLinkCard = async (personaId, codigoTarjeta) => {
    try { await personasHook.linkCard(personaId, codigoTarjeta); }
    catch (err) { alert(`Error al vincular tarjeta: ${err.message}`); }
  };

  const handleSaveCurso = async (id, payload) => {
    try {
      await cursosHook.save(id, payload);
      closeM();
      loadStats(); // refrescar contador de cursos
    } catch (err) { alert(`Error al guardar curso: ${err.message}`); }
  };

  const handleDesactivarCurso = async (item) => {
    if (!item.activo) { alert('El curso ya está inactivo.'); return; }
    if (!window.confirm(`¿Desactivar "${item.nombre}"?`)) return;
    try {
      await cursosHook.desactivar(item);
      loadStats();
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleEditCurso = async (item) => {
    try { const full = await cursosHook.loadOne(item.id); openM('curso', full); }
    catch  { openM('curso', item); }
  };

  const handleSaveDevice = async (formData) => {
    try {
      await dispositivosHook.save(formData);
      closeM();
      loadStats();
    } catch (err) { alert(`Error al guardar dispositivo: ${err.message}`); }
  };

  const handleSaveFacultad = async (data) => {
    try { await academicoHook.saveFacultad(data); closeM(); }
    catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDeleteFacultad = async (item) => {
    if (!window.confirm(`¿Eliminar la facultad "${item.nombre}" y todos sus programas?`)) return;
    try { await academicoHook.deleteFacultadById(item); }
    catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleSavePrograma = async (data) => {
    try { await academicoHook.savePrograma(data); closeM(); }
    catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleDeletePrograma = async (item) => {
    if (!window.confirm(`¿Eliminar el programa "${item.nombre}"?`)) return;
    try { await academicoHook.deleteProgramaById(item); }
    catch (err) { alert(`Error: ${err.message}`); }
  };

  const handleSaveAula = async (data) => {
    try {
      const { id, ...payload } = data;
      await aulasHook.save(id, payload);
      closeM();
    } catch (err) { alert(`Error al guardar aula: ${err.message}`); }
  };

  const handleSaveHorario = async (data) => {
    try {
      const { id, ...payload } = data;
      await horariosHook.save(id, payload);
      closeM();
    } catch (err) { alert(`Error al guardar horario: ${err.message}`); }
  };

  const handleDeleteHorario = async (item) => {
    if (!window.confirm(`¿Eliminar la franja "${item.dia} ${item.hora_inicio}–${item.hora_fin}"?`)) return;
    try { await horariosHook.deleteById(item); }
    catch (err) { alert(`Error al eliminar horario: ${err.message}`); }
  };

  const docentesList = personasHook.personas.filter(p => p.rol === 'docente' && p.activo);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Title>Panel de Administración</Title>
        <Subtitle>Gestión completa de la base de datos — SmartClass RFID</Subtitle>
      </PageHeader>

      {/* Stats reales */}
      <StatsGrid>
        {stats.map(s => <AdminStatCard key={s.id} stat={s} />)}
      </StatsGrid>

      <TabsScroll>
        <TabsBar>
          {TABS.map(t => (
            <Tab key={t.id} $a={tab === t.id} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size="sm" />{t.label}
            </Tab>
          ))}
        </TabsBar>
      </TabsScroll>

      {/* Tabs */}
      {tab === 'personas' && (
        <PersonasTab
          hook={personasHook}
          search={search} setSearch={setSearch}
          rolF={rolF} setRolF={setRolF}
          estadoF={estadoF} setEstadoF={setEstadoF}
          onEdit={(p) => openM('persona', p)}
          onLinkCard={(p) => openM('linkCard', p)}
        />
      )}

      {tab === 'cursos' && (
        <CursosTabPlaceholder
          hook={cursosHook}
          search={search} setSearch={setSearch}
          estadoF={estadoF} setEstadoF={setEstadoF}
          onEdit={handleEditCurso}
          onDesactivar={handleDesactivarCurso}
          onNew={() => openM('curso')}
        />
      )}

      {tab === 'academico' && (
        <AcademicoTabPlaceholder
          hook={academicoHook}
          onEditFacultad={(r) => openM('facultad', r)}
          onDeleteFacultad={handleDeleteFacultad}
          onEditPrograma={(r) => openM('programa', r)}
          onDeletePrograma={handleDeletePrograma}
          onNewFacultad={() => openM('facultad')}
          onNewPrograma={() => openM('programa')}
        />
      )}

      {tab === 'horarios' && (
        <HorariosTabPlaceholder
          hook={horariosHook}
          search={search} setSearch={setSearch}
          onNew={() => openM('horario')}
          onEdit={(r) => openM('horario', r)}
          onDelete={handleDeleteHorario}
        />
      )}

      {tab === 'aulas' && (
        <AulasTab
          hook={aulasHook}
          onNew={() => openM('aula')}
          onEdit={(r) => openM('aula', r)}
        />
      )}

      {tab === 'dispositivos' && (
        <DispositivosTab
          hook={dispositivosHook}
          search={search} setSearch={setSearch}
          onEdit={(r) => openM('device', r)}
        />
      )}

      {/* Modales */}
      <PersonaFormModal
        isOpen={modal.type === 'persona'} onClose={closeM}
        persona={modal.data} onSave={handleSavePersona}
        programas={academicoHook.programas} facultades={academicoHook.facultades}
      />
      <LinkCardModal
        isOpen={modal.type === 'linkCard'} onClose={closeM}
        persona={modal.data}
        onSave={(id, code) => handleLinkCard(id, code)}
      />
      <DeviceFormModal
        isOpen={modal.type === 'device'} onClose={closeM}
        device={modal.data} onSave={handleSaveDevice} aulas={aulasHook.aulas}
      />
      <FacultadModal
        isOpen={modal.type === 'facultad'} onClose={closeM}
        item={modal.data} onSave={handleSaveFacultad}
      />
      <ProgramaModal
        isOpen={modal.type === 'programa'} onClose={closeM}
        item={modal.data} onSave={handleSavePrograma}
        facultades={academicoHook.facultades}
      />
      <AulaModal
        isOpen={modal.type === 'aula'} onClose={closeM}
        item={modal.data} onSave={handleSaveAula}
      />
      <HorarioModal
        isOpen={modal.type === 'horario'} onClose={closeM}
        item={modal.data} onSave={handleSaveHorario}
        dias={dias.length > 0 ? dias : MOCK_DIAS}
      />
      <CursoGestionModal
        isOpen={modal.type === 'curso'} onClose={closeM}
        item={modal.data} onSave={handleSaveCurso}
        docentes={docentesList}
        aulas={aulasHook.aulas}
        horarios={horariosHook.horarios}
      />
    </AppLayout>
  );
};

export default AdminPage;