// src/components/admin/PersonaFormModal.jsx
// Actualizado: recibe `programas` y `facultades` como props (datos de la API)
// en lugar de importar los mocks. Compatible con backend real.

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';

/**
 * PersonaFormModal — crea o edita una persona.
 * - Programa: Select dinámico agrupado por facultad (datos de la API)
 * - Activo/inactivo en lugar de eliminar
 *
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {object}   persona     - persona a editar (null para crear)
 * @param {Function} onSave      - recibe el objeto con los datos del formulario
 * @param {Array}    programas   - lista de programas [{id, nombre, facultad_id, facultad}]
 * @param {Array}    facultades  - lista de facultades [{id, nombre}]
 */

const EMPTY = {
  nombre: '', apellido: '', correo: '',
  rol: 'estudiante', programa_id: '', codigoTarjeta: '', activo: true,
};

const PersonaFormModal = ({
  isOpen,
  onClose,
  persona = null,
  onSave,
  onImport,
  programas = [],
  facultades = [],
  onResetDevice,
  onResetCard,
}) => {
  const [form, setForm] = useState(EMPTY);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const importFileInput = useRef(null);
  const isEditing = !!persona;

  useEffect(() => {
    if (!isOpen) return;
    setShowImport(false);
    setImportRows([]);
    setImportError(null);
    setImportResult(null);
    setDeviceStatus(persona?.app_movil_vinculada
      ? {
          linked: true,
          active: persona.app_movil_activa,
          platform: persona.app_movil_plataforma,
          lastSession: persona.app_movil_ultima_sesion,
        }
      : { linked: false });
    setForm(
      persona
        ? {
            ...EMPTY,
            ...persona,
            programa_id:   persona.programa_id   ?? '',
            codigoTarjeta: persona.codigoTarjeta ?? persona.codigo_tarjeta ?? '',
          }
        : EMPTY
    );
  }, [persona, isOpen]);

  const set = (k) => (e) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);
    setImportResult(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!rawRows.length) throw new Error('El archivo no contiene filas para importar.');

      const rows = rawRows.map((raw, index) => {
        const row = Object.fromEntries(Object.entries(raw).map(([key, value]) => [
          key.toLowerCase().trim().replace(/\s+/g, '_'), value,
        ]));
        const nombre = String(row.nombre ?? '').trim();
        const apellido = String(row.apellido ?? '').trim();
        const correo = String(row.correo ?? '').trim().toLowerCase();
        const rol = String(row.rol ?? '').trim().toLowerCase();
        const programaRaw = String(row.programa_id ?? '').trim();
        const programa_id = programaRaw ? Number(programaRaw) : null;
        const errores = [];

        if (!nombre) errores.push('Falta nombre');
        if (!apellido) errores.push('Falta apellido');
        if (!correo) errores.push('Falta correo');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.push('Correo inválido');
        if (!['estudiante', 'docente', 'administrador'].includes(rol)) errores.push('Rol inválido');
        if (programa_id !== null && (!Number.isInteger(programa_id) || programa_id <= 0)) {
          errores.push('programa_id inválido');
        }

        return { fila: index + 2, nombre, apellido, correo, rol, programa_id, errores };
      });

      const correos = new Set();
      rows.forEach(row => {
        if (!row.correo) return;
        if (correos.has(row.correo)) row.errores.push('Correo repetido en el archivo');
        correos.add(row.correo);
      });
      setImportRows(rows);
    } catch (err) {
      setImportRows([]);
      setImportError(err.message || 'No se pudo leer el archivo.');
    }
  };

  const handleImport = async () => {
    if (!onImport || !importRows.length || importRows.some(row => row.errores.length)) return;
    setImporting(true);
    setImportError(null);
    try {
      const personas = importRows.map(row => ({
        nombre: row.nombre,
        apellido: row.apellido,
        correo: row.correo,
        rol: row.rol,
        programa_id: row.programa_id,
      }));
      const result = await onImport(personas);
      setImportResult(result.importadas);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadCsvTemplate = () => {
    const content = '\uFEFFnombre,apellido,correo,rol,programa_id\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_personas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([['nombre', 'apellido', 'correo', 'rol', 'programa_id']]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Personas');
    XLSX.writeFile(workbook, 'plantilla_personas.xlsx');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()) return;

    const prog = programas.find(p => String(p.id) === String(form.programa_id));

    onSave({
      ...form,
      id:          persona?.id ?? null,
      programa_id: form.programa_id ? Number(form.programa_id) : null,
      programa:    prog?.nombre ?? null,
    });
  };

  const handleResetDevice = async () => {
    if (!onResetDevice || !persona) return;
    await onResetDevice(persona);
    setDeviceStatus({ linked: false });
  };

  const handleResetCard = async () => {
    if (!onResetCard || !persona || !window.confirm('¿Liberar la tarjeta RFID actual? El estudiante podrá recibir una tarjeta nueva.')) return;
    const reset = await onResetCard(persona);
    if (reset !== false) {
      setForm(current => ({ ...current, codigoTarjeta: '' }));
    }
  };

  const requierePrograma = form.rol === 'estudiante' || form.rol === 'docente';
  const cardLinked = Boolean(persona?.codigoTarjeta ?? persona?.codigo_tarjeta);

  // Si tenemos facultades, agrupamos programas por facultad para el <optgroup>
  // Si no tenemos facultades (aún cargando), mostramos lista plana
  const tieneFacultades = facultades.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar persona' : 'Nueva persona'}>
      <form onSubmit={handleSubmit} noValidate>
        {!isEditing && (
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #c6c5d4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}>
              <div>
                <strong>Importación masiva (opcional)</strong>
                <HelperText>También puedes crear personas una por una con el formulario.</HelperText>
              </div>
              <Button type="button" variant="outlined" size="sm" onClick={() => setShowImport(value => !value)}>
                <Icon name="upload_file" size="sm" />{showImport ? 'Ocultar' : 'Importar archivo'}
              </Button>
            </div>

            {showImport && (
              <div style={{ display: 'grid', gap: '.75rem', marginTop: '.75rem' }}>
                <HelperText>
                  Acepta CSV, XLSX y XLS. Encabezados obligatorios: <code>nombre, apellido, correo, rol</code>.
                  <code> programa_id</code> es opcional y debe ser el ID existente en Académico.
                  Roles válidos: <code>estudiante</code>, <code>docente</code> o <code>administrador</code>.
                  El correo debe ser único. La tarjeta RFID se vincula después desde Personas.
                </HelperText>
                <HelperText>
                  Ejemplo: <code>Ana,García,ana@campusucc.edu.co,estudiante,1</code>.
                  En Excel, usa esos encabezados en la primera hoja. Si no aplica programa, deja <code>programa_id</code> vacío.
                </HelperText>
                <HelperText>Máximo 500 filas. La importación es completa: si una fila falla, no se inserta ninguna persona.</HelperText>

                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  <Button type="button" variant="outlined" size="sm" onClick={() => importFileInput.current?.click()}>
                    <Icon name="upload_file" size="sm" />Seleccionar archivo
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={downloadCsvTemplate}>
                    <Icon name="download" size="sm" />Plantilla CSV
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={downloadExcelTemplate}>
                    <Icon name="download" size="sm" />Plantilla Excel
                  </Button>
                  <input
                    ref={importFileInput}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImportFile}
                    style={{ display: 'none' }}
                  />
                </div>

                {importRows.length > 0 && (
                  <div style={{ maxHeight: '13rem', overflow: 'auto', border: '1px solid #c6c5d4', borderRadius: '.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
                      <thead>
                        <tr>{['Fila', 'Nombre', 'Apellido', 'Correo', 'Rol', 'Programa ID', 'Validación'].map(label => (
                          <th key={label} style={{ position: 'sticky', top: 0, textAlign: 'left', padding: '.5rem', background: '#f3f3f7' }}>{label}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {importRows.slice(0, 30).map(row => (
                          <tr key={row.fila}>
                            <td style={{ padding: '.5rem' }}>{row.fila}</td>
                            <td style={{ padding: '.5rem' }}>{row.nombre || '—'}</td>
                            <td style={{ padding: '.5rem' }}>{row.apellido || '—'}</td>
                            <td style={{ padding: '.5rem' }}>{row.correo || '—'}</td>
                            <td style={{ padding: '.5rem' }}>{row.rol || '—'}</td>
                            <td style={{ padding: '.5rem' }}>{row.programa_id ?? '—'}</td>
                            <td style={{ padding: '.5rem', color: row.errores.length ? '#b3261e' : '#287a52' }}>
                              {row.errores.join(', ') || 'Lista'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {importRows.length > 30 && (
                  <HelperText>Vista previa de 30 de {importRows.length} filas.</HelperText>
                )}
                {importError && <HelperText style={{ color: '#b3261e' }}>{importError}</HelperText>}
                {importResult !== null && (
                  <HelperText style={{ color: '#287a52' }}>{importResult} persona(s) importada(s).</HelperText>
                )}
                {importRows.length > 0 && importResult === null && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleImport}
                    disabled={importing || importRows.some(row => row.errores.length > 0)}
                  >
                    {importing ? 'Importando…' : `Importar ${importRows.length} persona(s)`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <FormRow>
          <FormGroup>
            <Label htmlFor="pm-nombre">Nombre *</Label>
            <Input
              id="pm-nombre"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Ej. Carlos"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="pm-apellido">Apellido *</Label>
            <Input
              id="pm-apellido"
              value={form.apellido}
              onChange={set('apellido')}
              placeholder="Ej. Ramírez"
              required
            />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="pm-correo">Correo institucional *</Label>
          <Input
            id="pm-correo"
            type="email"
            value={form.correo}
            onChange={set('correo')}
            placeholder="nombre@campusucc.edu.co"
            required
          />
          <HelperText>Debe ser @campusucc.edu.co · se usa para el login con Microsoft.</HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="pm-rol">Rol *</Label>
          <Select id="pm-rol" value={form.rol} onChange={set('rol')}>
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="administrador">Administrador</option>
          </Select>
        </FormGroup>

        {requierePrograma && (
          <FormGroup>
            <Label htmlFor="pm-programa">Programa académico</Label>
            <Select id="pm-programa" value={form.programa_id} onChange={set('programa_id')}>
              <option value="">— Seleccionar programa —</option>
              {tieneFacultades
                ? facultades.map(fac => {
                    const progs = programas.filter(p => p.facultad_id === fac.id);
                    if (!progs.length) return null;
                    return (
                      <optgroup key={fac.id} label={fac.nombre}>
                        {progs.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </optgroup>
                    );
                  })
                : programas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.facultad ? `[${p.facultad}] ` : ''}{p.nombre}
                    </option>
                  ))
              }
            </Select>
            {programas.length === 0 && (
              <HelperText>Sin programas disponibles. Ve al tab Académico para crearlos.</HelperText>
            )}
          </FormGroup>
        )}

        <FormGroup>
          <Label htmlFor="pm-tarjeta">Código tarjeta RFID</Label>
          <Input
            id="pm-tarjeta"
            value={form.codigoTarjeta}
            onChange={set('codigoTarjeta')}
            placeholder="Ej. RFID-A1B2C3"
          />
          <HelperText>Déjalo vacío si no tiene tarjeta. Puedes vincularlo después.</HelperText>
        </FormGroup>

        {isEditing && form.rol === 'estudiante' && (
          <FormGroup>
            <Label>Tarjeta RFID</Label>
            <div style={{
              border: '1px solid #c6c5d4',
              borderRadius: '.75rem',
              padding: '.75rem',
              display: 'grid',
              gap: '.5rem',
            }}>
              <strong>{cardLinked ? 'Tarjeta vinculada' : 'Sin tarjeta vinculada'}</strong>
              {cardLinked && (
                <HelperText>Código: {persona?.codigoTarjeta ?? persona?.codigo_tarjeta}</HelperText>
              )}
              {cardLinked ? (
                <Button type="button" variant="outlined" size="sm" onClick={handleResetCard}>
                  Liberar tarjeta
                </Button>
              ) : (
                <HelperText>El administrador puede vincular una tarjeta nueva desde la acción RFID de la tabla.</HelperText>
              )}
            </div>
          </FormGroup>
        )}

        <FormGroup>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.625rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={set('activo')}
              style={{ width: '1rem', height: '1rem', accentColor: '#000666' }}
            />
            <span style={{ fontSize: '.875rem', fontWeight: 500 }}>Cuenta activa</span>
          </label>
          <HelperText>Las cuentas inactivas no pueden iniciar sesión.</HelperText>
        </FormGroup>

        {isEditing && form.rol === 'estudiante' && (
          <FormGroup>
            <Label>Aplicación móvil</Label>
            <div style={{
              border: '1px solid #c6c5d4',
              borderRadius: '.75rem',
              padding: ' .75rem',
              display: 'grid',
              gap: '.5rem',
            }}>
              <strong>
                {deviceStatus?.linked
                  ? deviceStatus.active ? 'Dispositivo vinculado' : 'Dispositivo liberado'
                  : 'Sin dispositivo vinculado'}
              </strong>
              {deviceStatus?.linked && (
                <HelperText>
                  Plataforma: {deviceStatus.platform ?? 'No disponible'}
                  {deviceStatus.lastSession
                    ? ` · Último acceso: ${new Date(deviceStatus.lastSession).toLocaleString()}`
                    : ''}
                </HelperText>
              )}
              {deviceStatus?.linked && (
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  onClick={handleResetDevice}
                >
                  Liberar dispositivo
                </Button>
              )}
              {!deviceStatus?.linked && (
                <HelperText>
                  El estudiante podrá vincular un celular al iniciar sesión.
                </HelperText>
              )}
            </div>
          </FormGroup>
        )}

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" type="submit">
            {isEditing ? 'Guardar cambios' : 'Crear persona'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default PersonaFormModal;
