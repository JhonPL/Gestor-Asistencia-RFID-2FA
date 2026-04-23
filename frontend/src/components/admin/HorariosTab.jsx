// src/components/admin/HorariosTab.jsx
import { useMemo, useState, useEffect } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import GenericTable from './GenericTable';
import { colsHorarios } from './tableColumns';
import {
  SectionHeader, SectionTitle, SectionDesc, ControlsRow,
  SearchWrap, SIcon, SearchInput,
  ResultCount, LoadingBox, ErrorBox, Spinner,
} from './adminUtils';

export default function HorariosTab({
  hook,           // useHorarios() result
  search, setSearch,
  onNew, onEdit, onDelete,
}) {
  const { horarios, loading, error, load } = hook;

  useEffect(() => {
    // Cargar horarios cuando el componente se monta
    load();
  }, [load]);

  const filtrados = useMemo(() => {
    if (!search.trim()) return horarios;
    const q = search.toLowerCase();
    return horarios.filter(h =>
      h.dia?.toLowerCase().includes(q) ||
      h.hora_inicio?.includes(q) ||
      h.hora_fin?.includes(q)
    );
  }, [horarios, search]);

  return (
    <section>
      <SectionHeader>
        <div>
          <SectionTitle>Franjas horarias ({horarios.length})</SectionTitle>
          <SectionDesc>
            Cada franja combina un día de la semana con hora de inicio y fin. Se usan para asignar aulas a cursos.
          </SectionDesc>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={load} title="Recargar datos">
            <Icon name="refresh" size="sm" />Actualizar
          </Button>
          <Button size="sm" onClick={onNew}>
            <Icon name="add" size="sm" />Nueva franja
          </Button>
        </div>
      </SectionHeader>

      <ControlsRow>
        <SearchWrap>
          <SIcon><Icon name="search" size="sm" /></SIcon>
          <SearchInput
            placeholder="Buscar por día u hora…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchWrap>
        {search.trim() && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            <Icon name="clear" size="sm" />Limpiar
          </Button>
        )}
      </ControlsRow>

      {search.trim() && (
        <ResultCount>
          Mostrando {filtrados.length} de {horarios.length} franjas (filtrado)
        </ResultCount>
      )}

      {loading && (
        <LoadingBox><Spinner />Cargando horarios desde la base de datos…</LoadingBox>
      )}

      {!loading && error && (
        <ErrorBox role="alert">
          <Icon name="error" size="sm" />{error}
          <Button variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto' }}>Reintentar</Button>
        </ErrorBox>
      )}

      {!loading && !error && (
        horarios.length === 0 && !search.trim() ? (
          <LoadingBox>
            <Icon name="schedule" size="lg" style={{ opacity: 0.4 }} />
            No hay franjas horarias registradas. Crea la primera.
          </LoadingBox>
        ) : (
          <GenericTable
            columns={colsHorarios}
            rows={filtrados}
            actions={[
              { icon: 'edit', title: 'Editar', onClick: onEdit },
              {
                icon: 'delete',
                title: 'Eliminar',
                danger: true,
                onClick: onDelete,
              },
            ]}
            emptyMsg={search.trim() ? 'No hay resultados para la búsqueda.' : 'No hay franjas horarias.'}
          />
        )
      )}
    </section>
  );
}
