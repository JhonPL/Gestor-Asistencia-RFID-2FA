import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';
import { MOCK_PROGRAMAS, MOCK_FACULTADES } from '../../mocks/admin.mock';

/**
 * PersonaFormModal — crea o edita una persona (RF-10).
 * - Programa: Select dinámico agrupado por facultad
 * - Activo/inactivo en lugar de eliminar
 */

const EMPTY = {
  nombre: '', apellido: '', correo: '',
  rol: 'estudiante', programa_id: '', codigoTarjeta: '', activo: true,
};

const PersonaFormModal = ({ isOpen, onClose, persona = null, onSave }) => {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!persona;

  useEffect(() => {
    setForm(persona ? { ...EMPTY, ...persona, programa_id: persona.programa_id ?? '' } : EMPTY);
  }, [persona, isOpen]);

  const set = (k) => (e) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()) return;
    const prog = MOCK_PROGRAMAS.find(p => String(p.id) === String(form.programa_id));
    onSave({
      ...form,
      id:          persona?.id ?? Date.now(),
      programa_id: form.programa_id ? Number(form.programa_id) : null,
      programa:    prog?.nombre ?? null,
    });
    onClose();
  };

  const requierePrograma = form.rol === 'estudiante' || form.rol === 'docente';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar persona' : 'Nueva persona'}>
      <form onSubmit={handleSubmit} noValidate>
        <FormRow>
          <FormGroup>
            <Label htmlFor="pm-nombre">Nombre *</Label>
            <Input id="pm-nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Carlos" required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="pm-apellido">Apellido *</Label>
            <Input id="pm-apellido" value={form.apellido} onChange={set('apellido')} placeholder="Ej. Ramírez" required />
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="pm-correo">Correo institucional *</Label>
          <Input id="pm-correo" type="email" value={form.correo} onChange={set('correo')} placeholder="nombre@campusucc.edu.co" required />
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
              {MOCK_FACULTADES.map(fac => {
                const progs = MOCK_PROGRAMAS.filter(p => p.facultad_id === fac.id && p.activo);
                if (!progs.length) return null;
                return (
                  <optgroup key={fac.id} label={fac.nombre}>
                    {progs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </optgroup>
                );
              })}
            </Select>
          </FormGroup>
        )}

        <FormGroup>
          <Label htmlFor="pm-tarjeta">Código tarjeta RFID</Label>
          <Input id="pm-tarjeta" value={form.codigoTarjeta} onChange={set('codigoTarjeta')} placeholder="Ej. RFID-A1B2C3" />
          <HelperText>Déjalo vacío si no tiene tarjeta. Puedes vincularlo después.</HelperText>
        </FormGroup>

        <FormGroup>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.625rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.activo} onChange={set('activo')} style={{ width: '1rem', height: '1rem', accentColor: '#000666' }} />
            <span style={{ fontSize: '.875rem', fontWeight: 500 }}>Cuenta activa</span>
          </label>
          <HelperText>Las cuentas inactivas no pueden iniciar sesión.</HelperText>
        </FormGroup>

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar cambios' : 'Crear persona'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default PersonaFormModal;