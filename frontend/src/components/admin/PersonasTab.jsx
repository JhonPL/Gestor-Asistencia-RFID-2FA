// src/components/admin/PersonasTab.jsx
// Tab de personas extraído de AdminPage para mantener SRP.
// Recibe el hook de personas y los modales como props.

import { useMemo } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import PersonasTable from './PersonasTable';
import {
  SectionHeader, SectionTitle, SectionDesc, ControlsRow,
  SearchWrap, SIcon, SearchInput, FGroup, FLabel, FChip,
  ResultCount, LoadingBox, ErrorBox, Spinner,
} from './adminUtils';

const ROLES_FILTRO  = ['Todos', 'docente', 'estudiante', 'administrador'];
const ESTADO_FILTRO = ['Todos', 'Activos', 'Inactivos'];

export function PersonasTab({
  hook,           // usePersonas() result
  search, setSearch,
  rolF, setRolF,
  estadoF, setEstadoF,
  onEdit, onLinkCard,
}) {
  const { personas, loading, error, load, toggleActivo } = hook;

  const filtradas = useMemo(() => {
    let d = personas;
    if (rolF    !== 'Todos')    d = d.filter(p => p.rol === rolF);
    if (estadoF === 'Activos')  d = d.filter(p => p.activo);
    if (estadoF === 'Inactivos')d = d.filter(p => !p.activo);
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

  const hayFiltro = search.trim() || rolF !== 'Todos' || estadoF !== 'Todos';

  const handleToggleActivo = async (persona) => {
    const accion = persona.activo ? 'Desactivar' : 'Activar';
    if (!window.confirm(`¿${accion} a ${persona.nombre} ${persona.apellido}?`)) return;
    try {
      await toggleActivo(persona);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <section>
      <SectionHeader>
        <div>
          <SectionTitle>Personas ({personas.length})</SectionTitle>
          <SectionDesc>Docentes, estudiantes y administradores registrados en el sistema.</SectionDesc>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <Button variant="outlined" size="sm" onClick={load} title="Recargar datos">
            <Icon name="refresh" size="sm" />
          </Button>
          <Button size="sm" onClick={() => onEdit(null)}>
            <Icon name="person_add" size="sm" />Nueva persona
          </Button>
        </div>
      </SectionHeader>

      {!loading && error && (
        <ErrorBox role="alert">
          <Icon name="error" size="sm" />{error}
          <Button variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto' }}>Reintentar</Button>
        </ErrorBox>
      )}

      {loading ? (
        <LoadingBox><Spinner />Cargando personas desde la base de datos…</LoadingBox>
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
            {hayFiltro && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setRolF('Todos'); setEstadoF('Todos'); }}>
                <Icon name="clear" size="sm" />Limpiar
              </Button>
            )}
          </ControlsRow>
          <ResultCount>
            Mostrando {filtradas.length} de {personas.length} personas{hayFiltro && ' (filtrado)'}
          </ResultCount>
          <PersonasTable
            personas={filtradas}
            onEdit={onEdit}
            onToggleActivo={handleToggleActivo}
            onLinkCard={onLinkCard}
          />
        </>
      )}
    </section>
  );
}