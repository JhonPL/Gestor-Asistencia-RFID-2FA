import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormGroup, Label, Input, Select, FormRow, FormActions, HelperText } from '../ui/FormElements';

/**
 * PersonaFormModal — crea o edita una persona (RF-10).
 * SRP: gestiona el formulario de persona; la persistencia la hace el padre.
 * OCP: `onSave` recibe el objeto completo sin que el modal conozca la API.
 *
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {object|null} persona - null = crear, objeto = editar
 * @param {Function} onSave(personaData)
 */

const EMPTY = {
  nombre: '', apellido: '', correo: '',
  rol: 'estudiante', programa: '', codigoTarjeta: '', activo: true,
};

const PersonaFormModal = ({ isOpen, onClose, persona = null, onSave }) => {
  const [form, setForm] = useState(EMPTY);
  const isEditing = !!persona;

  // Rellena el formulario cuando se abre en modo edición
  useEffect(() => {
    setForm(persona ? { ...EMPTY, ...persona } : EMPTY);
  }, [persona, isOpen]);

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()) return;
    onSave?.({ ...form, id: persona?.id ?? Date.now() });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar persona' : 'Nueva persona'}
    >
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
          <Input id="pm-correo" type="email" value={form.correo} onChange={set('correo')} placeholder="nombre@ucc.edu.co" required />
          <HelperText>Debe ser un correo @ucc.edu.co. Se usa para el login con Microsoft.</HelperText>
        </FormGroup>

        <FormRow>
          <FormGroup>
            <Label htmlFor="pm-rol">Rol *</Label>
            <Select id="pm-rol" value={form.rol} onChange={set('rol')}>
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="administrador">Administrador</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="pm-programa">Programa académico</Label>
            <Input id="pm-programa" value={form.programa} onChange={set('programa')} placeholder="Ej. Ingeniería de Sistemas" />
            <HelperText>Solo aplica para estudiantes.</HelperText>
          </FormGroup>
        </FormRow>

        <FormGroup>
          <Label htmlFor="pm-tarjeta">Código tarjeta RFID</Label>
          <Input id="pm-tarjeta" value={form.codigoTarjeta} onChange={set('codigoTarjeta')} placeholder="Ej. RFID-A1B2C3" />
          <HelperText>Déjalo vacío si aún no tiene tarjeta asignada. Puedes vincularlo después.</HelperText>
        </FormGroup>

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

        <FormActions>
          <Button variant="outlined" size="sm" type="button" onClick={onClose}>Cancelar</Button>
          <Button size="sm" type="submit">{isEditing ? 'Guardar cambios' : 'Crear persona'}</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default PersonaFormModal;