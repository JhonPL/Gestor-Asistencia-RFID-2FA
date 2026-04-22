// src/components/admin/DispositivosTab.jsx

import { useMemo } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import GenericTable from './GenericTable';
import { colsDevices } from './tableColumns';
import {
  SectionHeader, SectionTitle, SectionDesc, ControlsRow,
  SearchWrap, SIcon, SearchInput, FGroup, FLabel, FChip,
  ResultCount, LoadingBox, ErrorBox, Spinner,
} from './adminUtils';

const ESTADOS_FILTRO = ['Todos', 'Activo', 'Inactivo', 'Mantenimiento'];

export function DispositivosTab({ hook, search, setSearch, onEdit }) {
  const { devices, loading, error, load, cambiarEstado } = hook;

  const [estadoF, setEstadoF] = useMemo(() => {
    // Estado interno del filtro de estado
    const state = { value: 'Todos' };
    const setter = (v) => { state.value = v; };
    return [state, setter];
  }, []);

  // Para filtros locales en este tab usamos estado propio
  return (
    <DispositivosTabInner
      devices={devices} loading={loading} error={error}
      load={load} cambiarEstado={cambiarEstado}
      search={search} setSearch={setSearch}
      onEdit={onEdit}
    />
  );
}

// Inner con estado propio de filtro de estado
import { useState } from 'react';

function DispositivosTabInner({ devices, loading, error, load, cambiarEstado, search, setSearch, onEdit }) {
  const [estadoF, setEstadoF] = useState('Todos');

  const filtrados = useMemo(() => {
    let d = devices;
    if (estadoF !== 'Todos') d = d.filter(dev => dev.estado === estadoF);
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(dev =>
        dev.codigo?.toLowerCase().includes(q) ||
        dev.aula?.toLowerCase().includes(q) ||
        dev.ip_address?.toLowerCase().includes(q) ||
        dev.mac_address?.toLowerCase().includes(q)
      );
    }
    return d;
  }, [devices, estadoF, search]);

  const handleCambiarEstado = async (device, nuevoEstado) => {
    const accion = nuevoEstado === 'Inactivo' ? 'desactivar' : `cambiar a "${nuevoEstado}"`;
    if (!window.confirm(`¿Deseas ${accion} el dispositivo "${device.codigo}"?`)) return;
    try {
      await cambiarEstado(device, nuevoEstado);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <section>
      <SectionHeader>
        <div>
          <SectionTitle>Dispositivos RFID ({devices.length})</SectionTitle>
          <SectionDesc>
            Lectores ESP32 instalados en las aulas. Usa <strong>Inactivo</strong> en lugar de eliminar.
          </SectionDesc>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <Button variant="outlined" size="sm" onClick={load} title="Recargar datos">
            <Icon name="refresh" size="sm" />
          </Button>
          <Button size="sm" onClick={() => onEdit(null)}>
            <Icon name="add" size="sm" />Agregar dispositivo
          </Button>
        </div>
      </SectionHeader>

      <ControlsRow>
        <SearchWrap>
          <SIcon><Icon name="search" size="sm" /></SIcon>
          <SearchInput
            placeholder="Buscar por código, aula, IP o MAC…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchWrap>
        <FGroup>
          <FLabel>Estado:</FLabel>
          {ESTADOS_FILTRO.map(est => (
            <FChip key={est} $a={estadoF === est} onClick={() => setEstadoF(est)}>{est}</FChip>
          ))}
        </FGroup>
        {(search.trim() || estadoF !== 'Todos') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setEstadoF('Todos'); }}>
            <Icon name="clear" size="sm" />Limpiar
          </Button>
        )}
      </ControlsRow>

      {loading && <LoadingBox><Spinner />Cargando dispositivos desde la base de datos…</LoadingBox>}

      {!loading && error && (
        <ErrorBox role="alert">
          <Icon name="error" size="sm" />{error}
          <Button variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto' }}>Reintentar</Button>
        </ErrorBox>
      )}

      {!loading && !error && (
        <>
          <ResultCount>
            Mostrando {filtrados.length} de {devices.length} dispositivo{devices.length !== 1 ? 's' : ''}
            {(search.trim() || estadoF !== 'Todos') && ' (filtrado)'}
          </ResultCount>
          <GenericTable
            columns={colsDevices}
            rows={filtrados}
            actions={[
              { icon: 'edit',       title: 'Editar',             onClick: onEdit },
              { icon: 'toggle_off', title: 'Cambiar a Inactivo', danger: true,
                onClick: (r) => handleCambiarEstado(r, 'Inactivo') },
            ]}
            emptyMsg={devices.length === 0 ? 'No hay dispositivos registrados.' : 'No hay dispositivos con los filtros actuales.'}
          />
        </>
      )}
    </section>
  );
}