// src/components/admin/CursoGestionEstudiantesTab.jsx
// Pestaña "Estudiantes" del modal de gestión de curso.
// SRP: gestiona la lista de inscritos, búsqueda individual e importación masiva.

import { useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { Input, HelperText } from '../ui/FormElements';
import theme from '../../styles/theme';

// ── Styled ────────────────────────────────────────────────────────────────────

const spin = keyframes`to { transform: rotate(360deg); }`;

const Spinner = styled.span`
  display: inline-block; width: .9rem; height: .9rem;
  border: 2px solid ${theme.colors.primaryFixed};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} .7s linear infinite;
  flex-shrink: 0;
`;

const ErrorMsg = styled.p`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.error};
  background: ${theme.colors.errorContainer};
  padding: .5rem .875rem;
  border-radius: ${theme.radii.md};
  margin-bottom: .75rem;
`;

const StudentRow = styled.div`
  display: flex; align-items: center; gap: .75rem;
  padding: .75rem 0;
  border-bottom: 1px solid ${theme.colors.surfaceContainerHigh}26;
  opacity: ${({ $inactivo }) => $inactivo ? 0.5 : 1};
`;

const Avatar = styled.div`
  width: 2.25rem; height: 2.25rem;
  border-radius: ${theme.radii.full};
  background: ${theme.colors.primaryFixed};
  color: ${theme.colors.primary};
  display: flex; align-items: center; justify-content: center;
  font-size: ${theme.fontSizes.xs}; font-weight: 700;
  flex-shrink: 0;
`;

const StudentInfo = styled.div`flex: 1; min-width: 0;`;

const SName = styled.p`
  font-size: ${theme.fontSizes.sm}; font-weight: 600;
  color: ${theme.colors.onSurface};
`;

const SMeta = styled.p`
  font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ActionBtn = styled.button`
  padding: .3rem; border-radius: ${theme.radii.md};
  color: ${({ $danger }) => $danger ? theme.colors.error : theme.colors.onSurfaceVariant};
  transition: all ${theme.transitions.fast};
  &:hover {
    background: ${({ $danger }) =>
      $danger ? theme.colors.errorContainer : theme.colors.surfaceContainerHigh};
  }
  &:disabled { opacity: .3; cursor: not-allowed; }
`;

const EmptyStudents = styled.div`
  padding: 2.5rem; text-align: center;
  color: ${theme.colors.outline}; font-size: ${theme.fontSizes.sm};
`;

const SearchDropWrap = styled.div`position: relative;`;

const DropList = styled.ul`
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
  background: ${theme.colors.surfaceContainerLowest};
  border: 1px solid ${theme.colors.outlineVariant}4D;
  border-radius: ${theme.radii.lg}; box-shadow: ${theme.shadows.md};
  max-height: 14rem; overflow-y: auto; list-style: none;
`;

const DropItem = styled.li`
  padding: .625rem 1rem; cursor: pointer; font-size: ${theme.fontSizes.sm};
  transition: background ${theme.transitions.fast};
  &:hover { background: ${theme.colors.primaryFixed}; }
`;

const DropMeta = styled.span`
  font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline};
  margin-left: .5rem;
`;

const SectionDivider = styled.div`
  display: flex; align-items: center; gap: .75rem;
  margin: 1.25rem 0 .875rem;
  font-size: ${theme.fontSizes.xs}; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em;
  color: ${theme.colors.outline};
  &::after { content: ''; flex: 1; height: 1px; background: ${theme.colors.surfaceContainerHigh}; }
`;

const ImportPanel = styled.div`
  border: 2px dashed ${theme.colors.outlineVariant};
  border-radius: ${theme.radii.xl}; padding: 1.5rem;
  background: ${theme.colors.surfaceContainerLow};
  margin-bottom: 1.25rem;
`;

const ImportDrop = styled.div`
  text-align: center; padding: 1.5rem .75rem; cursor: pointer;
  &:hover > * { color: ${theme.colors.primary}; }
`;

const PreviewTable = styled.div`
  max-height: 14rem; overflow-y: auto; margin-top: .75rem;
  border-radius: ${theme.radii.md};
  border: 1px solid ${theme.colors.surfaceContainerHigh};
`;

const PTable = styled.table`
  width: 100%; border-collapse: collapse; font-size: ${theme.fontSizes.xs};
`;

const PTh = styled.th`
  padding: .5rem .75rem; text-align: left;
  background: ${theme.colors.surfaceContainerLow};
  color: ${theme.colors.outline}; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  position: sticky; top: 0;
`;

const PTd = styled.td`
  padding: .5rem .75rem;
  border-top: 1px solid ${theme.colors.surfaceContainerHigh}26;
  color: ${({ $error }) => $error ? theme.colors.error : theme.colors.onSurface};
`;

const ResultBanner = styled.div`
  padding: .875rem 1rem; border-radius: ${theme.radii.lg};
  background: ${theme.colors.secondaryFixed}; color: ${theme.colors.secondary};
  font-size: ${theme.fontSizes.sm}; display: flex; flex-direction: column; gap: .25rem;
  margin-top: .875rem;
`;

const FileTypeBadge = styled.span`
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .2rem .65rem; border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.xs}; font-weight: 700; text-transform: uppercase;
  background: ${({ $csv }) => $csv ? theme.colors.secondaryFixed : theme.colors.primaryFixed};
  color: ${({ $csv }) => $csv ? theme.colors.secondary : theme.colors.primary};
`;

// ── Componente ────────────────────────────────────────────────────────────────

const CursoGestionEstudiantesTab = ({ isEditing, hook }) => {
  const fileInputRef = useRef(null);

  const {
    estudiantes,
    estudiantesFiltrados,
    studLoading,
    studError,
    studSearch,
    setStudSearch,
    addSearch,
    addResults,
    addLoading,
    showDrop,
    setShowDrop,
    showImport,
    importRows,
    importResult,
    importing,
    fileType,
    loadEstudiantes,
    toggleImportPanel,
    clearImport,
    handleAddSearchChange,
    handleInscribir,
    handleToggle,
    handleEliminar,
    handleFileChange,
    handleConfirmarImport,
    descargarPlantillaExcel,
    descargarPlantillaCSV,
  } = hook;

  if (!isEditing) {
    return (
      <EmptyStudents>
        Guarda el curso primero para gestionar estudiantes.
      </EmptyStudents>
    );
  }

  return (
    <div>
      {/* ── Barra superior: buscar + importar ── */}
      <div style={{
        display: 'flex', gap: '.75rem', alignItems: 'flex-start',
        marginBottom: '1rem', flexWrap: 'wrap',
      }}>
        <SearchDropWrap style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '.875rem', top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.outline, display: 'flex', pointerEvents: 'none',
            }}>
              {addLoading ? <Spinner /> : <Icon name="person_search" size="sm" />}
            </span>
            <Input
              value={addSearch}
              onChange={handleAddSearchChange}
              onFocus={() => addResults.length && setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="Buscar estudiante para inscribir…"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>

          {showDrop && addResults.length > 0 && (
            <DropList>
              {addResults.map(p => (
                <DropItem key={p.id} onMouseDown={() => handleInscribir(p)}>
                  {p.nombre} {p.apellido}
                  <DropMeta>{p.correo}</DropMeta>
                  {p.programa && <DropMeta>· {p.programa}</DropMeta>}
                </DropItem>
              ))}
            </DropList>
          )}
          {showDrop && addResults.length === 0 && !addLoading && (
            <DropList>
              <DropItem style={{ cursor: 'default', color: theme.colors.outline }}>
                Sin resultados
              </DropItem>
            </DropList>
          )}
        </SearchDropWrap>

        <Button variant="outlined" size="sm" onClick={toggleImportPanel}>
          <Icon name="upload_file" size="sm" />
          {showImport ? 'Cerrar import' : 'Importar archivo'}
        </Button>
      </div>

      {/* ── Panel de importación ── */}
      {showImport && (
        <ImportPanel>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '.875rem',
            flexWrap: 'wrap', gap: '.5rem',
          }}>
            <p style={{ fontSize: theme.fontSizes.sm, fontWeight: 600, color: theme.colors.onSurface }}>
              Importación masiva
            </p>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <Button variant="ghost" size="sm" onClick={descargarPlantillaExcel}>
                <Icon name="download" size="sm" />Plantilla Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={descargarPlantillaCSV}>
                <Icon name="download" size="sm" />Plantilla CSV
              </Button>
            </div>
          </div>

          <HelperText style={{ marginBottom: '.875rem' }}>
            Acepta <strong>.xlsx</strong>, <strong>.xls</strong> y <strong>.csv</strong>.
            Columnas requeridas: <code>correo</code>, <code>nombre</code>, <code>apellido</code>.
            Opcional: <code>codigo_tarjeta</code>.
            El CSV puede usar <code>,</code> o <code>;</code> como separador.
          </HelperText>

          {importRows.length === 0 ? (
            <ImportDrop onClick={() => fileInputRef.current?.click()}>
              <Icon
                name="cloud_upload"
                size="lg"
                style={{ color: theme.colors.outline, marginBottom: '.5rem' }}
              />
              <p style={{ fontSize: theme.fontSizes.sm, color: theme.colors.outline }}>
                Clic para seleccionar archivo (.xlsx, .xls o .csv)
              </p>
            </ImportDrop>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '.75rem' }}>
                <FileTypeBadge $csv={fileType === 'csv'}>
                  <Icon name={fileType === 'csv' ? 'description' : 'table_chart'} size="sm" />
                  {fileType === 'csv' ? 'CSV' : 'Excel'}
                </FileTypeBadge>
                <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.outline }}>
                  {importRows.length} fila(s) detectadas
                </span>
              </div>

              <PreviewTable>
                <PTable>
                  <thead>
                    <tr>
                      <PTh>#</PTh>
                      <PTh>Correo</PTh>
                      <PTh>Nombre</PTh>
                      <PTh>Apellido</PTh>
                      <PTh>Tarjeta</PTh>
                      <PTh>Estado</PTh>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 30).map((r, i) => {
                      const faltante = !r.correo || !r.nombre || !r.apellido;
                      return (
                        <tr key={i}>
                          <PTd $error={faltante}>{i + 1}</PTd>
                          <PTd $error={!r.correo}>{r.correo || '—'}</PTd>
                          <PTd $error={!r.nombre}>{r.nombre || '—'}</PTd>
                          <PTd $error={!r.apellido}>{r.apellido || '—'}</PTd>
                          <PTd>{r.codigo_tarjeta || '—'}</PTd>
                          <PTd $error={faltante}>{faltante ? '⚠ Incompleto' : '✓'}</PTd>
                        </tr>
                      );
                    })}
                  </tbody>
                </PTable>
              </PreviewTable>

              {importRows.length > 30 && (
                <p style={{ fontSize: theme.fontSizes.xs, color: theme.colors.outline, marginTop: '.375rem' }}>
                  … y {importRows.length - 30} fila(s) más
                </p>
              )}

              {importResult && (
                <ResultBanner>
                  <strong>Resultado de la importación:</strong>
                  <span>
                    ✓ {importResult.inscritos} inscrito(s) nuevos
                    {importResult.creados > 0 && ` · ${importResult.creados} persona(s) creadas`}
                    {importResult.reactivados > 0 && ` · ${importResult.reactivados} reactivado(s)`}
                  </span>
                  <span>— {importResult.ya_inscritos ?? importResult.duplicados ?? 0} ya estaban inscritos</span>
                  {importResult.errores?.length > 0 && (
                    <span style={{ color: theme.colors.error }}>
                      ✗ {importResult.errores.length} error(es):&nbsp;
                      {importResult.errores.slice(0, 3).map(e => `${e.correo}: ${e.motivo}`).join(' | ')}
                    </span>
                  )}
                </ResultBanner>
              )}

              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.875rem' }}>
                <Button variant="ghost" size="sm" onClick={clearImport}>
                  Limpiar
                </Button>
                {!importResult && (
                  <Button size="sm" onClick={handleConfirmarImport} disabled={importing}>
                    {importing && <Spinner />}
                    Confirmar importación ({importRows.length})
                  </Button>
                )}
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </ImportPanel>
      )}

      {/* ── Filtro de la lista ── */}
      <div style={{ position: 'relative', marginBottom: '.875rem' }}>
        <span style={{
          position: 'absolute', left: '.875rem', top: '50%',
          transform: 'translateY(-50%)',
          color: theme.colors.outline, display: 'flex', pointerEvents: 'none',
        }}>
          <Icon name="search" size="sm" />
        </span>
        <Input
          value={studSearch}
          onChange={e => setStudSearch(e.target.value)}
          placeholder="Filtrar por nombre o correo…"
          style={{ paddingLeft: '2.75rem' }}
        />
      </div>

      {/* ── Lista de estudiantes ── */}
      {studLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner style={{ width: '1.5rem', height: '1.5rem' }} />
        </div>
      ) : studError ? (
        <ErrorMsg>{studError}</ErrorMsg>
      ) : estudiantesFiltrados.length === 0 ? (
        <EmptyStudents>
          <Icon name="group" size="lg" style={{ opacity: .3, marginBottom: '.5rem' }} />
          <p>
            {estudiantes.length === 0
              ? 'No hay estudiantes inscritos.'
              : 'Sin resultados para ese filtro.'}
          </p>
        </EmptyStudents>
      ) : (
        <div style={{ maxHeight: '22rem', overflowY: 'auto' }}>
          {['activos', 'inactivos'].map(grupo => {
            const lista = estudiantesFiltrados.filter(e =>
              grupo === 'activos' ? e.activo : !e.activo
            );
            if (!lista.length) return null;
            return (
              <div key={grupo}>
                <SectionDivider>
                  {grupo === 'activos'
                    ? `Inscritos (${lista.length})`
                    : `Inactivos (${lista.length})`}
                </SectionDivider>
                {lista.map(est => (
                  <StudentRow key={est.lista_id} $inactivo={!est.activo}>
                    <Avatar>{est.nombre[0]}{est.apellido[0]}</Avatar>
                    <StudentInfo>
                      <SName>{est.nombre} {est.apellido}</SName>
                      <SMeta>
                        {est.correo}{est.programa ? ` · ${est.programa}` : ''}
                      </SMeta>
                    </StudentInfo>
                    {est.total_asistencias > 0 && (
                      <span style={{
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.outline,
                        background: theme.colors.surfaceContainerHigh,
                        padding: '2px 8px', borderRadius: 99, flexShrink: 0,
                      }}>
                        {est.total_asistencias} asist.
                      </span>
                    )}
                    <ActionBtn
                      title={est.activo ? 'Desactivar inscripción' : 'Reactivar inscripción'}
                      onClick={() => handleToggle(est)}
                    >
                      <Icon name={est.activo ? 'toggle_on' : 'toggle_off'} size="sm" />
                    </ActionBtn>
                    <ActionBtn
                      $danger
                      title="Eliminar / retirar del curso"
                      onClick={() => handleEliminar(est)}
                    >
                      <Icon name="person_remove" size="sm" />
                    </ActionBtn>
                  </StudentRow>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="sm" onClick={loadEstudiantes}>
          <Icon name="refresh" size="sm" />Actualizar
        </Button>
      </div>
    </div>
  );
};

export default CursoGestionEstudiantesTab;