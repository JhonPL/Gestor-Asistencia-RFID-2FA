/**
 * admin.mock.js — Datos simulados 100% fieles a BD v5
 *
 * Tablas cubiertas:
 *   rol, facultad, programa, persona,
 *   dia_semana, horario, aula, dispositivo_rfid,
 *   curso, aula_curso_horario, lista_estudiantes
 *
 * Notas clave de la BD:
 *   - horario tiene: dia_semana_id + hora_inicio + hora_fin (duración libre)
 *   - aula tiene: numero (UNIQUE), nombre, edificio, piso, capacidad
 *   - programa tiene: codigo (UNIQUE opcional) + nombre + facultad_id
 *   - curso tiene: fecha_inicio + fecha_fin (DATE) + persona_id (docente) + activo
 *     NO tiene semestre ni programa_id (el programa va por docente/contexto)
 *   - dispositivo_rfid: ip_address, mac_address, estado_dispositivo_id (FK)
 *   - aula_curso_horario: solo aula_id + curso_id + horario_id
 */

// ─── Colores de avatar ────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#e0e0ff', color: '#000666' },
  { bg: '#94f0df', color: '#006b5e' },
  { bg: '#ffdbd0', color: '#5c1800' },
  { bg: '#bdc2ff', color: '#000666' },
  { bg: '#d0f0ff', color: '#004a66' },
  { bg: '#fff0d0', color: '#664a00' },
];
export const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

// ─── Catálogos fijos ──────────────────────────────────────────────────────────
export const ESTADOS_DISPOSITIVO = ['Activo', 'Inactivo', 'Mantenimiento'];

// ─── Días de la semana (tabla dia_semana) ─────────────────────────────────────
export const MOCK_DIAS = [
  { id: 1, nombre: 'Lunes'     },
  { id: 2, nombre: 'Martes'    },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves'    },
  { id: 5, nombre: 'Viernes'   },
  { id: 6, nombre: 'Sábado'    },
  { id: 7, nombre: 'Domingo'   },
];

// ─── Facultades (tabla facultad) ──────────────────────────────────────────────
export const MOCK_FACULTADES = [
  { id: 1, nombre: 'Facultad de Ingeniería' },
  { id: 2, nombre: 'Facultad de Ciencias Económicas y Administrativas' },
  { id: 3, nombre: 'Facultad de Derecho' },
  { id: 4, nombre: 'Facultad de Ciencias de la Salud' },
  { id: 5, nombre: 'Facultad de Ciencias Sociales y Humanas' },
];

// ─── Programas (tabla programa) ───────────────────────────────────────────────
// Campos BD: id, nombre, codigo (UNIQUE, nullable), facultad_id
export const MOCK_PROGRAMAS = [
  { id: 1,  nombre: 'Ingeniería de Sistemas',          codigo: 'ING-SIS',  facultad_id: 1 },
  { id: 2,  nombre: 'Ingeniería Civil',                codigo: 'ING-CIV',  facultad_id: 1 },
  { id: 3,  nombre: 'Ingeniería Electrónica',          codigo: 'ING-ELC',  facultad_id: 1 },
  { id: 4,  nombre: 'Ingeniería Industrial',           codigo: 'ING-IND',  facultad_id: 1 },
  { id: 5,  nombre: 'Administración de Empresas',      codigo: 'ADM-EMP',  facultad_id: 2 },
  { id: 6,  nombre: 'Contaduría Pública',              codigo: 'CON-PUB',  facultad_id: 2 },
  { id: 7,  nombre: 'Economía',                        codigo: 'ECO-001',  facultad_id: 2 },
  { id: 8,  nombre: 'Derecho',                         codigo: 'DER-001',  facultad_id: 3 },
  { id: 9,  nombre: 'Medicina',                        codigo: 'MED-001',  facultad_id: 4 },
  { id: 10, nombre: 'Enfermería',                      codigo: 'ENF-001',  facultad_id: 4 },
  { id: 11, nombre: 'Psicología',                      codigo: 'PSI-001',  facultad_id: 4 },
  { id: 12, nombre: 'Trabajo Social',                  codigo: 'TRA-SOC',  facultad_id: 5 },
  { id: 13, nombre: 'Comunicación Social',             codigo: null,        facultad_id: 5 },
];

// ─── Aulas (tabla aula) ───────────────────────────────────────────────────────
// Campos BD: id, numero (UNIQUE), nombre, edificio, piso, capacidad
export const MOCK_AULAS = [
  { id: 1, numero: '101-A', nombre: 'Sala de Sistemas',    edificio: 'Bloque A', piso: 1, capacidad: 40 },
  { id: 2, numero: '210-A', nombre: 'Sala de Conferencias',edificio: 'Bloque A', piso: 2, capacidad: 35 },
  { id: 3, numero: '305-B', nombre: 'Aula Magistral',       edificio: 'Bloque B', piso: 3, capacidad: 30 },
  { id: 4, numero: 'LAB-1', nombre: 'Laboratorio Sistemas 1', edificio: 'Bloque C', piso: 1, capacidad: 25 },
  { id: 5, numero: 'LAB-2', nombre: 'Laboratorio Sistemas 2', edificio: 'Bloque C', piso: 1, capacidad: 25 },
  { id: 6, numero: 'AUD-1', nombre: 'Auditorio Principal',  edificio: 'Bloque D', piso: 1, capacidad: 200 },
  { id: 7, numero: '402-B', nombre: 'Sala de Reuniones',    edificio: 'Bloque B', piso: 4, capacidad: 20 },
];

// ─── Horarios (tabla horario) ─────────────────────────────────────────────────
// Campos BD: id, dia_semana_id (FK), hora_inicio (TIME), hora_fin (TIME)
// Duración libre: 1h, 2h, 3h, etc.
export const MOCK_HORARIOS = [
  { id: 1,  dia_semana_id: 1, dia: 'Lunes',     hora_inicio: '06:00', hora_fin: '08:00' }, // 2h
  { id: 2,  dia_semana_id: 1, dia: 'Lunes',     hora_inicio: '08:00', hora_fin: '10:00' }, // 2h
  { id: 3,  dia_semana_id: 1, dia: 'Lunes',     hora_inicio: '10:00', hora_fin: '12:00' }, // 2h
  { id: 4,  dia_semana_id: 1, dia: 'Lunes',     hora_inicio: '14:00', hora_fin: '16:00' }, // 2h
  { id: 5,  dia_semana_id: 1, dia: 'Lunes',     hora_inicio: '16:00', hora_fin: '18:00' }, // 2h
  { id: 6,  dia_semana_id: 2, dia: 'Martes',    hora_inicio: '07:00', hora_fin: '09:00' }, // 2h
  { id: 7,  dia_semana_id: 2, dia: 'Martes',    hora_inicio: '09:00', hora_fin: '10:00' }, // 1h
  { id: 8,  dia_semana_id: 2, dia: 'Martes',    hora_inicio: '14:00', hora_fin: '17:00' }, // 3h
  { id: 9,  dia_semana_id: 3, dia: 'Miércoles', hora_inicio: '08:00', hora_fin: '10:00' }, // 2h
  { id: 10, dia_semana_id: 3, dia: 'Miércoles', hora_inicio: '10:00', hora_fin: '13:00' }, // 3h
  { id: 11, dia_semana_id: 4, dia: 'Jueves',    hora_inicio: '14:00', hora_fin: '16:00' }, // 2h
  { id: 12, dia_semana_id: 4, dia: 'Jueves',    hora_inicio: '16:00', hora_fin: '19:00' }, // 3h
  { id: 13, dia_semana_id: 5, dia: 'Viernes',   hora_inicio: '10:00', hora_fin: '12:00' }, // 2h
  { id: 14, dia_semana_id: 5, dia: 'Viernes',   hora_inicio: '15:00', hora_fin: '16:00' }, // 1h
  { id: 15, dia_semana_id: 6, dia: 'Sábado',    hora_inicio: '08:00', hora_fin: '12:00' }, // 4h
];

// ─── Personas (tabla persona) ─────────────────────────────────────────────────
// Campos BD: id, microsoft_id, rol_id, nombre, apellido, correo,
//            codigo_tarjeta, programa_id, activo
export const MOCK_PERSONAS = [
  {
    id: 1, microsoft_id: null, rol: 'docente', rol_id: 1,
    nombre: 'Carlos',    apellido: 'Ramírez',
    correo: 'carlos.ramirez@campusucc.edu.co',
    codigo_tarjeta: 'RFID-A1B2', programa_id: 1, programa: 'Ingeniería de Sistemas', activo: true,
  },
  {
    id: 2, microsoft_id: null, rol: 'estudiante', rol_id: 2,
    nombre: 'María',     apellido: 'López',
    correo: 'maria.lopez@campusucc.edu.co',
    codigo_tarjeta: 'RFID-C3D4', programa_id: 1, programa: 'Ingeniería de Sistemas', activo: true,
  },
  {
    id: 3, microsoft_id: null, rol: 'docente', rol_id: 1,
    nombre: 'Jorge',     apellido: 'Peña',
    correo: 'jorge.pena@campusucc.edu.co',
    codigo_tarjeta: null, programa_id: 2, programa: 'Ingeniería Civil', activo: true,
  },
  {
    id: 4, microsoft_id: null, rol: 'estudiante', rol_id: 2,
    nombre: 'Laura',     apellido: 'Vargas',
    correo: 'laura.vargas@campusucc.edu.co',
    codigo_tarjeta: 'RFID-E5F6', programa_id: 5, programa: 'Administración de Empresas', activo: false,
  },
  {
    id: 5, microsoft_id: null, rol: 'administrador', rol_id: 3,
    nombre: 'Admin',     apellido: 'Sistema',
    correo: 'admin@campusucc.edu.co',
    codigo_tarjeta: null, programa_id: null, programa: null, activo: true,
  },
  {
    id: 6, microsoft_id: null, rol: 'estudiante', rol_id: 2,
    nombre: 'Sandra',    apellido: 'Gómez',
    correo: 'sandra.gomez@campusucc.edu.co',
    codigo_tarjeta: 'RFID-G7H8', programa_id: 8, programa: 'Derecho', activo: true,
  },
  {
    id: 7, microsoft_id: null, rol: 'docente', rol_id: 1,
    nombre: 'Pedro',     apellido: 'Castro',
    correo: 'pedro.castro@campusucc.edu.co',
    codigo_tarjeta: 'RFID-I9J0', programa_id: 4, programa: 'Ingeniería Industrial', activo: true,
  },
  {
    id: 8, microsoft_id: null, rol: 'estudiante', rol_id: 2,
    nombre: 'Valentina', apellido: 'Ruiz',
    correo: 'valentina.ruiz@campusucc.edu.co',
    codigo_tarjeta: 'RFID-K1L2', programa_id: 1, programa: 'Ingeniería de Sistemas', activo: true,
  },
];

// ─── Dispositivos RFID (tabla dispositivo_rfid) ───────────────────────────────
// Campos BD: id, codigo, aula_id, ip_address, mac_address, estado_dispositivo_id, ultima_conexion
export const MOCK_DISPOSITIVOS = [
  { id: 1, codigo: 'ESP32-01', aula_id: 3, aula: '305-B – Aula Magistral',        ip_address: '192.168.1.101', mac_address: 'AA:BB:CC:11:22:33', estado_dispositivo_id: 1, estado: 'Activo',        ultima_conexion: '2025-07-14 08:05:00' },
  { id: 2, codigo: 'ESP32-02', aula_id: 4, aula: 'LAB-1 – Laboratorio Sistemas 1', ip_address: '192.168.1.102', mac_address: 'AA:BB:CC:44:55:66', estado_dispositivo_id: 1, estado: 'Activo',        ultima_conexion: '2025-07-14 07:58:00' },
  { id: 3, codigo: 'ESP32-03', aula_id: 2, aula: '210-A – Sala de Conferencias',   ip_address: '192.168.1.103', mac_address: 'AA:BB:CC:77:88:99', estado_dispositivo_id: 2, estado: 'Inactivo',      ultima_conexion: '2025-07-12 14:00:00' },
  { id: 4, codigo: 'ESP32-04', aula_id: 1, aula: '101-A – Sala de Sistemas',       ip_address: '192.168.1.104', mac_address: 'AA:BB:CC:AA:BB:CC', estado_dispositivo_id: 3, estado: 'Mantenimiento', ultima_conexion: '2025-07-09 09:30:00' },
];

// ─── Cursos (tabla curso) ─────────────────────────────────────────────────────
// Campos BD: id, nombre, codigo, fecha_inicio (DATE), fecha_fin (DATE),
//            persona_id (docente FK), activo
// NOTA: NO tiene programa_id ni semestre en la BD
export const MOCK_CURSOS = [
  {
    id: 1, codigo: 'IS-301', nombre: 'Ingeniería de Software II',
    fecha_inicio: '2025-02-03', fecha_fin: '2025-06-15',
    persona_id: 1, docente: 'Carlos Ramírez',
    activo: true,
  },
  {
    id: 2, codigo: 'BD-202', nombre: 'Bases de Datos II',
    fecha_inicio: '2025-02-03', fecha_fin: '2025-06-15',
    persona_id: 1, docente: 'Carlos Ramírez',
    activo: true,
  },
  {
    id: 3, codigo: 'RS-401', nombre: 'Redes y Seguridad',
    fecha_inicio: '2025-02-03', fecha_fin: '2025-06-15',
    persona_id: 7, docente: 'Pedro Castro',
    activo: true,
  },
  {
    id: 4, codigo: 'IC-201', nombre: 'Cálculo Diferencial',
    fecha_inicio: '2025-02-03', fecha_fin: '2025-06-15',
    persona_id: 3, docente: 'Jorge Peña',
    activo: true,
  },
  {
    id: 5, codigo: 'AD-101', nombre: 'Fundamentos de Administración',
    fecha_inicio: '2025-07-14', fecha_fin: '2025-11-30',
    persona_id: null, docente: null,
    activo: false,
  },
];

// ─── Aula-Curso-Horario (tabla aula_curso_horario) ────────────────────────────
// Campos BD: id, aula_id, curso_id, horario_id
// El día de la semana ya está en horario.dia_semana_id
export const MOCK_AULA_CURSO_HORARIO = [
  { id: 1, curso_id: 1, aula_id: 3, horario_id: 2  }, // IS-301 | 305-B | Lunes 08:00-10:00
  { id: 2, curso_id: 1, aula_id: 3, horario_id: 9  }, // IS-301 | 305-B | Miércoles 08:00-10:00
  { id: 3, curso_id: 2, aula_id: 4, horario_id: 11 }, // BD-202 | LAB-1 | Jueves 14:00-16:00
  { id: 4, curso_id: 2, aula_id: 4, horario_id: 6  }, // BD-202 | LAB-1 | Martes 07:00-09:00
  { id: 5, curso_id: 3, aula_id: 2, horario_id: 13 }, // RS-401 | 210-A | Viernes 10:00-12:00
  { id: 6, curso_id: 4, aula_id: 1, horario_id: 8  }, // IC-201 | 101-A | Martes 14:00-17:00 (3h)
];

// ─── Stats del admin ──────────────────────────────────────────────────────────
export const ADMIN_STATS = [
  { id: 'personas',     label: 'Personas registradas', value: 248, icon: 'group',     delta: '+12 este mes' },
  { id: 'cursos',       label: 'Cursos activos',        value: 34,  icon: 'menu_book', delta: 'Semestre actual' },
  { id: 'dispositivos', label: 'Dispositivos RFID',     value: 12,  icon: 'sensors',   delta: '10 activos' },
  { id: 'sesiones',     label: 'Sesiones hoy',          value: 18,  icon: 'today',     delta: '6 en curso' },
];