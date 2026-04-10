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
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { MOCK_PERSONAS, MOCK_DISPOSITIVOS, ADMIN_STATS } from '../mocks/Attendance.mock';

const TABS = [
  { id: 'personas',     label: 'Personas',          icon: 'group'   },
  { id: 'dispositivos', label: 'Dispositivos RFID',  icon: 'sensors' },
];

/* ── Styled ── */
const PageHeader = styled.header`margin-bottom:2.5rem;`;
const Title = styled.h1`
  font-family:${theme.fonts.headline};font-size:clamp(1.5rem,3vw,2.25rem);
  font-weight:${theme.fontWeights.extrabold};color:${theme.colors.primary};
  letter-spacing:-.02em;margin-bottom:.375rem;
`;
const Subtitle = styled.p`font-size:${theme.fontSizes.base};color:${theme.colors.onSurfaceVariant};`;
const StatsGrid = styled.div`
  display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:2.5rem;
  @media(min-width:${theme.breakpoints.lg}){grid-template-columns:repeat(4,1fr)}
`;
const TabsBar = styled.div`
  display:flex;gap:.25rem;background-color:${theme.colors.surfaceContainerHigh};
  border-radius:${theme.radii.xl};padding:.3rem;width:fit-content;margin-bottom:1.75rem;
`;
const Tab = styled.button`
  display:flex;align-items:center;gap:.5rem;padding:.625rem 1.25rem;
  border-radius:${theme.radii.lg};font-size:${theme.fontSizes.sm};
  font-weight:${theme.fontWeights.semibold};transition:all ${theme.transitions.base};
  background-color:${({ $active }) => $active ? theme.colors.surfaceContainerLowest : 'transparent'};
  color:${({ $active }) => $active ? theme.colors.primary : theme.colors.onSurfaceVariant};
  box-shadow:${({ $active }) => $active ? theme.shadows.sm : 'none'};
  &:hover:not([aria-selected="true"]){background-color:${theme.colors.surfaceContainerLowest}cc}
`;
const SectionHeader = styled.div`
  display:flex;flex-direction:column;gap:1rem;margin-bottom:1.25rem;
  @media(min-width:${theme.breakpoints.sm}){flex-direction:row;align-items:center;justify-content:space-between}
`;
const SectionTitle = styled.h2`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes.xl};
  font-weight:${theme.fontWeights.bold};color:${theme.colors.primary};
`;
const SearchWrapper = styled.div`position:relative;width:100%;max-width:22rem;`;
const SearchIconWrap = styled.span`
  position:absolute;left:.875rem;top:50%;transform:translateY(-50%);
  color:${theme.colors.outline};pointer-events:none;display:flex;
`;
const SearchInput = styled.input`
  width:100%;padding:.75rem 1rem .75rem 2.75rem;
  background-color:${theme.colors.surfaceContainerLow};border:none;
  border-radius:${theme.radii.xl};font-family:${theme.fonts.body};
  font-size:${theme.fontSizes.sm};color:${theme.colors.onSurface};outline:none;
  &::placeholder{color:${theme.colors.outline};opacity:.6}
  &:focus{box-shadow:0 0 0 2px ${theme.colors.primary}33}
`;
const RightGroup = styled.div`display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;`;

/* ── Component ── */
const AdminPage = ({ onLogout }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab]   = useState('personas');
  const [search, setSearch]         = useState('');
  const [personas, setPersonas]     = useState(MOCK_PERSONAS);
  const [devices, setDevices]       = useState(MOCK_DISPOSITIVOS);

  // ── Estado de modales ──
  const [personaModal, setPersonaModal]   = useState({ open: false, data: null });
  const [linkCardModal, setLinkCardModal] = useState({ open: false, data: null });
  const [deviceModal, setDeviceModal]     = useState({ open: false, data: null });

  // ── Handlers de personas ──
  const openNewPersona  = ()   => setPersonaModal({ open: true, data: null });
  const openEditPersona = (p)  => setPersonaModal({ open: true, data: p });
  const openLinkCard    = (p)  => setLinkCardModal({ open: true, data: p });

  const handleSavePersona = (data) => {
    setPersonas(prev => {
      const exists = prev.find(p => p.id === data.id);
      return exists ? prev.map(p => p.id === data.id ? data : p) : [...prev, data];
    });
  };

  const handleDeletePersona = (persona) => {
    if (!window.confirm(`¿Eliminar a ${persona.nombre} ${persona.apellido}?`)) return;
    setPersonas(prev => prev.filter(p => p.id !== persona.id));
  };

  const handleSaveLinkCard = (personaId, codigoTarjeta) => {
    setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, codigoTarjeta } : p));
  };

  // ── Handlers de dispositivos ──
  const openNewDevice  = ()  => setDeviceModal({ open: true, data: null });
  const openEditDevice = (d) => setDeviceModal({ open: true, data: d });

  const handleSaveDevice = (data) => {
    setDevices(prev => {
      const exists = prev.find(d => d.id === data.id);
      return exists ? prev.map(d => d.id === data.id ? data : d) : [...prev, data];
    });
  };

  // ── Filtrado ──
  const filteredPersonas = useMemo(() => {
    if (!search.trim()) return personas;
    const q = search.toLowerCase();
    return personas.filter(p =>
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
      p.correo.toLowerCase().includes(q) ||
      p.rol.toLowerCase().includes(q)
    );
  }, [personas, search]);

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Title>Panel de Administración</Title>
        <Subtitle>Gestión de personas, cursos, aulas y dispositivos RFID</Subtitle>
      </PageHeader>

      <StatsGrid>
        {ADMIN_STATS.map(stat => <AdminStatCard key={stat.id} stat={stat} />)}
      </StatsGrid>

      <TabsBar role="tablist">
        {TABS.map(tab => (
          <Tab key={tab.id} $active={activeTab === tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(''); }}
            role="tab" aria-selected={activeTab === tab.id}>
            <Icon name={tab.icon} size="sm" />{tab.label}
          </Tab>
        ))}
      </TabsBar>

      {/* ── Tab Personas ── */}
      {activeTab === 'personas' && (
        <section>
          <SectionHeader>
            <SectionTitle>Personas registradas ({personas.length})</SectionTitle>
            <RightGroup>
              <SearchWrapper>
                <SearchIconWrap><Icon name="search" size="sm" /></SearchIconWrap>
                <SearchInput type="text" placeholder="Buscar por nombre, correo o rol…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </SearchWrapper>
              <Button size="sm" onClick={openNewPersona}>
                <Icon name="person_add" size="sm" />Nueva persona
              </Button>
            </RightGroup>
          </SectionHeader>

          <PersonasTable
            personas={filteredPersonas}
            onEdit={openEditPersona}
            onDelete={handleDeletePersona}
            onLinkCard={openLinkCard}
          />
        </section>
      )}

      {/* ── Tab Dispositivos ── */}
      {activeTab === 'dispositivos' && (
        <section>
          <SectionHeader>
            <SectionTitle>Dispositivos RFID ({devices.length})</SectionTitle>
            <Button size="sm" onClick={openNewDevice}>
              <Icon name="add" size="sm" />Agregar dispositivo
            </Button>
          </SectionHeader>

          <DevicesTable devices={devices} onEdit={openEditDevice} />
        </section>
      )}

      {/* ── Modales ── */}
      <PersonaFormModal
        isOpen={personaModal.open}
        onClose={() => setPersonaModal({ open: false, data: null })}
        persona={personaModal.data}
        onSave={handleSavePersona}
      />

      <LinkCardModal
        isOpen={linkCardModal.open}
        onClose={() => setLinkCardModal({ open: false, data: null })}
        persona={linkCardModal.data}
        onSave={handleSaveLinkCard}
      />

      <DeviceFormModal
        isOpen={deviceModal.open}
        onClose={() => setDeviceModal({ open: false, data: null })}
        device={deviceModal.data}
        onSave={handleSaveDevice}
      />
    </AppLayout>
  );
};

export default AdminPage;