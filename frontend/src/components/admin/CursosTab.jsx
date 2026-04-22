// src/components/admin/CursosTab.jsx
import { useMemo } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import GenericTable, { StatusDot } from './GenericTable';
import { colsCursos } from './tableColumns';
import {
  SectionHeader, SectionTitle, SectionDesc, ControlsRow,
  SearchWrap, SIcon, SearchInput, FGroup, FLabel, FChip,
  ResultCount, LoadingBox, ErrorBox, Spinner,
} from './adminUtils';

const ESTADO_FILTRO = ['Todos', 'Activos', 'Inactivos'];

export default function CursosTab({
  hook,           // useCursos() result
  search, setSearch,
  estadoF, setEstadoF,
  onEdit, onDesactivar, onNew,
}) {
  const { cursos, loading, error, load } = hook;

  const filtrados = useMemo(() => {
    let d = cursos;
    if (estadoF === 'Activos')   d = d.filter(c => c.activo);
    if (estadoF === 'Inactivos') d = d.filter(c => !c.activo);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(c =>
        [c.codigo, c.nombre, c.docente].some(v => v?.toLowerCase().includes(q))
      );
    }
    return d;
  }, [cursos, estadoF, search]);

  return (
    <section>
      <SectionHeader>
        <div>
          <SectionTitle>Cursos ({cursos.length})</SectionTitle>
          <SectionDesc>
            Materias con docente, estudiantes inscritos y asignaciones de aula+horario.
          </SectionDesc>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <Button variant="outlined" size="sm" onClick={load} title="Recargar datos">
            <Icon name="refresh" size="sm" />
          </Button>
          <Button size="sm" onClick={onNew}>
            <Icon name="add" size="sm" />Nuevo curso
          </Button>
        </div>
      </SectionHeader>

      <ControlsRow>
        <SearchWrap>
          <SIcon><Icon name="search" size="sm" /></SIcon>
          <SearchInput
            placeholder="Buscar por código, nombre o docente…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchWrap>
        <FGroup>
          <FLabel>Estado:</FLabel>
          {ESTADO_FILTRO.map(e => (
            <FChip key={e} $a={estadoF === e} onClick={() => setEstadoF(e)}>
              {e}
            </FChip>
          ))}
        </FGroup>
        {search.trim() && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            <Icon name="clear" size="sm" />Limpiar
          </Button>
        )}
      </ControlsRow>

      {loading && (
        <LoadingBox><Spinner />Cargando cursos desde la base de datos…</LoadingBox>
      )}

      {!loading && error && (
        <ErrorBox role="alert">
          <Icon name="error" size="sm" />{error}
          <Button variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto' }}>Reintentar</Button>
        </ErrorBox>
      )}

      {!loading && !error && (
        <>
          <ResultCount>
            Mostrando {filtrados.length} de {cursos.length} curso{cursos.length !== 1 ? 's' : ''}
          </ResultCount>
          <GenericTable
            columns={colsCursos}
            rows={filtrados}
            actions={[
              { icon: 'edit', title: 'Ver / editar + estudiantes', onClick: onEdit },
              { icon: 'toggle_off', title: 'Desactivar', danger: true, onClick: onDesactivar },
            ]}
            emptyMsg="No hay cursos registrados."
          />
        </>
      )}
    </section>
  );
}
