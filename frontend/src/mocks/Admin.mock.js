/**
 * admin.mock.js — Datos simulados completos para el panel de administración.
 * Cubre todas las tablas de la BD v5:
 *   facultad, programa, persona, aula, dispositivo_rfid,
 *   dia_semana, horario, curso, aula_curso_horario, lista_estudiantes
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

// ─── Facultades ───────────────────────────────────────────────────────────────
export const MOCK_FACULTADES = [
  { id: 1, nombre: 'Facultad de Ingeniería', activo: true },
  { id: 2, nombre: 'Facultad de Ciencias Económicas y Administrativas', activo: true },
  { id: 3, nombre: 'Facultad de Derecho', activo: true },
  { id: 4, nombre: 'Facultad de Ciencias de la Salud', activo: true },
  { id: 5, nombre: 'Facultad de Ciencias Sociales y Humanas', activo: true },
];

// ─── Programas ────────────────────────────────────────────────────────────────
export const MOCK_PROGRAMAS = [
  { id: 1,  facultad_id: 1, nombre: 'Ingeniería de Sistemas',       activo: true },
  { id: 2,  facultad_id: 1, nombre: 'Ingeniería Civil',              activo: true },
  { id: 3,  facultad_id: 1, nombre: 'Ingeniería Electrónica',        activo: true },
  { id: 4,  facultad_id: 1, nombre: 'Ingeniería Industrial',         activo: true },
  { id: 5,  facultad_id: 2, nombre: 'Administración de Empresas',    activo: true },
  { id: 6,  facultad_id: 2, nombre: 'Contaduría Pública',            activo: true },
  { id: 7,  facultad_id: 2, nombre: 'Economía',                      activo: true },
  { id: 8,  facultad_id: 3, nombre: 'Derecho',                       activo: true },
  { id: 9,  facultad_id: 4, nombre: 'Medicina',                      activo: true },
  { id: 10, facultad_id: 4, nombre: 'Enfermería',                    activo: true },
  { id: 11, facultad_id: 4, nombre: 'Psicología',                    activo: true },
  { id: 12, facultad_id: 5, nombre: 'Trabajo Social',                activo: true },
  { id: 13, facultad_id: 5, nombre: 'Comunicación Social',           activo: false },
];

// ─── Días de la semana ────────────────────────────────────────────────────────
export const MOCK_DIAS = [
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
];

// ─── Horarios ─────────────────────────────────────────────────────────────────
export const MOCK_HORARIOS = [
  { id: 1, hora_inicio: '06:00', hora_fin: '08:00' },
  { id: 2, hora_inicio: '08:00', hora_fin: '10:00' },
  { id: 3, hora_inicio: '10:00', hora_fin: '12:00' },
  { id: 4, hora_inicio: '12:00', hora_fin: '14:00' },
  { id: 5, hora_inicio: '14:00', hora_fin: '16:00' },
  { id: 6, hora_inicio: '16:00', hora_fin: '18:00' },
  { id: 7, hora_inicio: '18:00', hora_fin: '20:00' },
  { id: 8, hora_inicio: '20:00', hora_fin: '22:00' },
];

// ─── Aulas ────────────────────────────────────────────────────────────────────
export const MOCK_AULAS = [
  { id: 1, nombre: 'Sala 101-A',      edificio: 'Bloque A', capacidad: 40, activo: true },
  { id: 2, nombre: 'Sala 210-A',      edificio: 'Bloque A', capacidad: 35, activo: true },
  { id: 3, nombre: 'Sala 305-B',      edificio: 'Bloque B', capacidad: 30, activo: true },
  { id: 4, nombre: 'Lab Sistemas 1',  edificio: 'Bloque C', capacidad: 25, activo: true },
  { id: 5, nombre: 'Lab Sistemas 2',  edificio: 'Bloque C', capacidad: 25, activo: true },
  { id: 6, nombre: 'Auditorio',       edificio: 'Bloque D', capacidad: 200, activo: true },
  { id: 7, nombre: 'Sala 402-B',      edificio: 'Bloque B', capacidad: 30, activo: false },
];

// ─── Dispositivos RFID ────────────────────────────────────────────────────────
export const MOCK_DISPOSITIVOS = [
  { id: 1, codigo: 'ESP32-01', aula_id: 3, aula: 'Sala 305-B',     ip: '192.168.1.101', mac: 'AA:BB:CC:11:22:33', estado: 'Activo',        ultimaConexion: 'Hace 5 min' },
  { id: 2, codigo: 'ESP32-02', aula_id: 4, aula: 'Lab Sistemas 1', ip: '192.168.1.102', mac: 'AA:BB:CC:44:55:66', estado: 'Activo',        ultimaConexion: 'Hace 12 min' },
  { id: 3, codigo: 'ESP32-03', aula_id: 2, aula: 'Sala 210-A',     ip: '192.168.1.103', mac: 'AA:BB:CC:77:88:99', estado: 'Inactivo',      ultimaConexion: 'Hace 2 días' },
  { id: 4, codigo: 'ESP32-04', aula_id: 1, aula: 'Sala 101-A',     ip: '192.168.1.104', mac: 'AA:BB:CC:AA:BB:CC', estado: 'Mantenimiento', ultimaConexion: 'Hace 5 días' },
];

// ─── Personas ─────────────────────────────────────────────────────────────────
export const MOCK_PERSONAS = [
  { id: 1, nombre: 'Carlos',    apellido: 'Ramírez',  correo: 'carlos.ramirez@campusucc.edu.co',  rol: 'docente',       programa_id: 1,    programa: 'Ingeniería de Sistemas',    codigoTarjeta: 'RFID-A1B2', activo: true },
  { id: 2, nombre: 'María',     apellido: 'López',    correo: 'maria.lopez@campusucc.edu.co',      rol: 'estudiante',    programa_id: 1,    programa: 'Ingeniería de Sistemas',    codigoTarjeta: 'RFID-C3D4', activo: true },
  { id: 3, nombre: 'Jorge',     apellido: 'Peña',     correo: 'jorge.pena@campusucc.edu.co',       rol: 'docente',       programa_id: 2,    programa: 'Ingeniería Civil',          codigoTarjeta: null,        activo: true },
  { id: 4, nombre: 'Laura',     apellido: 'Vargas',   correo: 'laura.vargas@campusucc.edu.co',     rol: 'estudiante',    programa_id: 5,    programa: 'Administración de Empresas',codigoTarjeta: 'RFID-E5F6', activo: false },
  { id: 5, nombre: 'Admin',     apellido: 'Sistema',  correo: 'admin@campusucc.edu.co',            rol: 'administrador', programa_id: null, programa: null,                        codigoTarjeta: null,        activo: true },
  { id: 6, nombre: 'Sandra',    apellido: 'Gómez',    correo: 'sandra.gomez@campusucc.edu.co',     rol: 'estudiante',    programa_id: 8,    programa: 'Derecho',                   codigoTarjeta: 'RFID-G7H8', activo: true },
  { id: 7, nombre: 'Pedro',     apellido: 'Castro',   correo: 'pedro.castro@campusucc.edu.co',     rol: 'docente',       programa_id: 4,    programa: 'Ingeniería Industrial',     codigoTarjeta: 'RFID-I9J0', activo: true },
  { id: 8, nombre: 'Valentina', apellido: 'Ruiz',     correo: 'valentina.ruiz@campusucc.edu.co',   rol: 'estudiante',    programa_id: 1,    programa: 'Ingeniería de Sistemas',    codigoTarjeta: 'RFID-K1L2', activo: true },
  { id: 9, nombre: 'Andrés',    apellido: 'Morales',  correo: 'andres.morales@campusucc.edu.co',   rol: 'estudiante',    programa_id: 1,    programa: 'Ingeniería de Sistemas',    codigoTarjeta: null,        activo: true },
];

// ─── Cursos ───────────────────────────────────────────────────────────────────
export const MOCK_CURSOS = [
  {
    id: 1, codigo: 'IS-301', nombre: 'Ingeniería de Software II',
    programa_id: 1, programa: 'Ingeniería de Sistemas',
    docente_id: 1,  docente: 'Carlos Ramírez',
    creditos: 3,    semestre: 6,  activo: true,
    totalEstudiantes: 32,
  },
  {
    id: 2, codigo: 'BD-202', nombre: 'Bases de Datos II',
    programa_id: 1, programa: 'Ingeniería de Sistemas',
    docente_id: 1,  docente: 'Carlos Ramírez',
    creditos: 3,    semestre: 4,  activo: true,
    totalEstudiantes: 28,
  },
  {
    id: 3, codigo: 'RS-401', nombre: 'Redes y Seguridad',
    programa_id: 1, programa: 'Ingeniería de Sistemas',
    docente_id: 7,  docente: 'Pedro Castro',
    creditos: 3,    semestre: 7,  activo: true,
    totalEstudiantes: 19,
  },
  {
    id: 4, codigo: 'IC-201', nombre: 'Cálculo Diferencial',
    programa_id: 2, programa: 'Ingeniería Civil',
    docente_id: 3,  docente: 'Jorge Peña',
    creditos: 4,    semestre: 2,  activo: true,
    totalEstudiantes: 45,
  },
  {
    id: 5, codigo: 'AD-101', nombre: 'Fundamentos de Administración',
    programa_id: 5, programa: 'Administración de Empresas',
    docente_id: null, docente: null,
    creditos: 3,    semestre: 1,  activo: false,
    totalEstudiantes: 0,
  },
];

// ─── Aula-Curso-Horario (N:M entre curso, aula y horario) ─────────────────────
export const MOCK_AULA_CURSO_HORARIO = [
  { id: 1, curso_id: 1, aula_id: 3, horario_id: 2, dia_id: 1, curso: 'IS-301 – Ing. Software II', aula: 'Sala 305-B', horario: '08:00–10:00', dia: 'Lunes' },
  { id: 2, curso_id: 1, aula_id: 3, horario_id: 2, dia_id: 3, curso: 'IS-301 – Ing. Software II', aula: 'Sala 305-B', horario: '08:00–10:00', dia: 'Miércoles' },
  { id: 3, curso_id: 2, aula_id: 4, horario_id: 5, dia_id: 2, curso: 'BD-202 – Bases de Datos II', aula: 'Lab Sistemas 1', horario: '14:00–16:00', dia: 'Martes' },
  { id: 4, curso_id: 2, aula_id: 4, horario_id: 5, dia_id: 4, curso: 'BD-202 – Bases de Datos II', aula: 'Lab Sistemas 1', horario: '14:00–16:00', dia: 'Jueves' },
  { id: 5, curso_id: 3, aula_id: 2, horario_id: 3, dia_id: 5, curso: 'RS-401 – Redes y Seguridad', aula: 'Sala 210-A', horario: '10:00–12:00', dia: 'Viernes' },
];

// ─── Stats del admin ──────────────────────────────────────────────────────────
export const ADMIN_STATS = [
  { id: 'personas',     label: 'Personas registradas', value: 248, icon: 'group',     delta: '+12 este mes' },
  { id: 'cursos',       label: 'Cursos activos',        value: 34,  icon: 'menu_book', delta: 'Semestre actual' },
  { id: 'dispositivos', label: 'Dispositivos RFID',     value: 12,  icon: 'sensors',   delta: '10 activos' },
  { id: 'sesiones',     label: 'Sesiones hoy',          value: 18,  icon: 'today',     delta: '6 en curso' },
];