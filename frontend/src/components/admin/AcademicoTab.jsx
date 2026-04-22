// src/components/admin/AcademicoTab.jsx
import { useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import GenericTable from './GenericTable';
import { colsFacultades, colsProgramas } from './tableColumns';
import {
  SectionHeader, SectionTitle, SectionDesc, SubTabsBar, SubTab,
  LoadingBox, ErrorBox, Spinner,
} from './adminUtils';
import theme from '../../styles/theme';

export default function AcademicoTab({
  hook,           // useAcademico() result
  onEditFacultad, onDeleteFacultad,
  onEditPrograma, onDeletePrograma,
  onNewFacultad,  onNewPrograma,
}) {
  const { facultades, programas, loading, error, load } = hook;
  const [acSub, setAcSub] = useState('facultades');

  return (
    <section>
      <SectionHeader>
        <div>
          <SectionTitle>Estructura académica</SectionTitle>
          <SectionDesc>
            Facultades y programas académicos registrados en la base de datos.
          </SectionDesc>
        </div>
        <Button
          size="sm"
          onClick={acSub === 'facultades' ? onNewFacultad : onNewPrograma}
        >
          <Icon name="add" size="sm" />
          {acSub === 'facultades' ? 'Nueva facultad' : 'Nuevo programa'}
        </Button>
      </SectionHeader>

      <SubTabsBar>
        <SubTab $a={acSub === 'facultades'} onClick={() => setAcSub('facultades')}>
          <Icon name="account_balance" size="sm" />
          Facultades ({facultades.length})
        </SubTab>
        <SubTab $a={acSub === 'programas'} onClick={() => setAcSub('programas')}>
          <Icon name="school" size="sm" />
          Programas ({programas.length})
        </SubTab>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          style={{ marginLeft: 'auto' }}
          title="Recargar datos"
        >
          <Icon name="refresh" size="sm" />Actualizar
        </Button>
      </SubTabsBar>

      {loading && (
        <LoadingBox><Spinner />Cargando desde la base de datos…</LoadingBox>
      )}

      {!loading && error && (
        <ErrorBox role="alert">
          <Icon name="error" size="sm" />{error}
          <Button variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto' }}>Reintentar</Button>
        </ErrorBox>
      )}

      {/* ── Facultades ──────────────────────────────────────────────────────── */}
      {!loading && !error && acSub === 'facultades' && (
        facultades.length === 0 ? (
          <LoadingBox>
            <Icon name="account_balance" size="lg" style={{ color: theme.colors.outline, opacity: 0.4 }} />
            No hay facultades registradas. Crea la primera.
          </LoadingBox>
        ) : (
          <GenericTable
            columns={colsFacultades}
            rows={facultades}
            actions={[
              { icon: 'edit',   title: 'Editar',   onClick: onEditFacultad   },
              { icon: 'delete', title: 'Eliminar', danger: true, onClick: onDeleteFacultad },
            ]}
            emptyMsg="No hay facultades."
          />
        )
      )}

      {/* ── Programas ───────────────────────────────────────────────────────── */}
      {!loading && !error && acSub === 'programas' && (
        programas.length === 0 ? (
          <LoadingBox>
            <Icon name="school" size="lg" style={{ color: theme.colors.outline, opacity: 0.4 }} />
            No hay programas registrados.
            {facultades.length === 0 && ' Primero crea una facultad.'}
          </LoadingBox>
        ) : (
          <GenericTable
            columns={colsProgramas}
            rows={programas}
            actions={[
              { icon: 'edit',   title: 'Editar',   onClick: onEditPrograma   },
              { icon: 'delete', title: 'Eliminar', danger: true, onClick: onDeletePrograma },
            ]}
            emptyMsg="No hay programas."
          />
        )
      )}
    </section>
  );
}
