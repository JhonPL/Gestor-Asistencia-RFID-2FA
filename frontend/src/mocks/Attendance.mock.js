/**
 * Mock data — Módulo de Asistencia y Administración.
 * Tablas involucradas: asistencia, verificacion_biometrica,
 * lista_estudiantes, sesion_clase, persona, rol, aula, dispositivo_rfid,
 * facultad, programa.
 */

// ─── Colores de avatar (ciclan por índice) ───────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#e0e0ff', color: '#000666' },
  { bg: '#94f0df', color: '#006b5e' },
  { bg: '#ffdbd0', color: '#5c1800' },
  { bg: '#bdc2ff', color: '#000666' },
];
export const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

// ─── Catálogos de facultades y programas ─────────────────────────────────────
export const MOCK_FACULTADES = [
  { id: 1, nombre: 'Facultad de Ingeniería' },
  { id: 2, nombre: 'Facultad de Ciencias Económicas y Administrativas' },
  { id: 3, nombre: 'Facultad de Derecho' },
  { id: 4, nombre: 'Facultad de Ciencias de la Salud' },
  { id: 5, nombre: 'Facultad de Ciencias Sociales y Humanas' },
];

export const MOCK_PROGRAMAS = [
  { id: 1, facultad_id: 1, nombre: 'Ingeniería de Sistemas' },
  { id: 2, facultad_id: 1, nombre: 'Ingeniería Civil' },
  { id: 3, facultad_id: 1, nombre: 'Ingeniería Electrónica' },
  { id: 4, facultad_id: 1, nombre: 'Ingeniería Industrial' },
  { id: 5, facultad_id: 2, nombre: 'Administración de Empresas' },
  { id: 6, facultad_id: 2, nombre: 'Contaduría Pública' },
  { id: 7, facultad_id: 2, nombre: 'Economía' },
  { id: 8, facultad_id: 3, nombre: 'Derecho' },
  { id: 9, facultad_id: 4, nombre: 'Medicina' },
  { id: 10, facultad_id: 4, nombre: 'Enfermería' },
  { id: 11, facultad_id: 4, nombre: 'Psicología' },
  { id: 12, facultad_id: 5, nombre: 'Trabajo Social' },
  { id: 13, facultad_id: 5, nombre: 'Comunicación Social' },
];

// ─── Sesión activa de ejemplo ────────────────────────────────────────────────
export const MOCK_SESION = {
  id: 14,
  cursoCodigo: 'IS-301',
  cursoNombre: 'Ingeniería de Software II',
  aula: 'Sala 305-B',
  fecha: new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  horaInicio: '08:00 AM',
  horaFin: '10:00 AM',
  estado: 'cerrada', // activa | cerrada
};

export const MOCK_ASISTENCIA = [
  {
    id: 1, codigoEstudiante: '2021-IS-0012',
    nombre: 'Ana', apellido: 'García',
    estado: 'Presente', estadoVerificacion: 'completado',
    horaRegistro: '07:58 AM', metodo: 'fingerprint', dentroCampus: true,
  },
  {
    id: 2, codigoEstudiante: '2022-IS-0045',
    nombre: 'Luis', apellido: 'Martínez',
    estado: 'Ausente', estadoVerificacion: 'fallido',
    horaRegistro: '08:05 AM', metodo: 'fingerprint', dentroCampus: false,
  },
  {
    id: 3, codigoEstudiante: '2021-IS-0021',
    nombre: 'Camila', apellido: 'Torres',
    estado: 'Justificado', estadoVerificacion: 'completado',
    horaRegistro: '08:02 AM', metodo: 'face_id', dentroCampus: true,
    motivo: 'Incapacidad médica',
  },
  {
    id: 4, codigoEstudiante: '2023-IS-0092',
    nombre: 'David', apellido: 'Ospina',
    estado: 'Presente', estadoVerificacion: 'sin_app',
    horaRegistro: '08:10 AM', metodo: null, dentroCampus: null,
  },
  {
    id: 5, codigoEstudiante: '2022-IS-0033',
    nombre: 'Valentina', apellido: 'Ruiz',
    estado: 'Presente', estadoVerificacion: 'completado',
    horaRegistro: '07:55 AM', metodo: 'fingerprint', dentroCampus: true,
  },
  {
    id: 6, codigoEstudiante: '2021-IS-0078',
    nombre: 'Sebastián', apellido: 'Cárdenas',
    estado: 'Ausente', estadoVerificacion: 'pendiente',
    horaRegistro: '08:15 AM', metodo: null, dentroCampus: null,
  },
];

// ─── Admin: listado de personas ──────────────────────────────────────────────
export const MOCK_PERSONAS = [
  { id: 1, nombre: 'Carlos', apellido: 'Ramírez', correo: 'carlos.ramirez@campusucc.edu.co', rol: 'docente',        programa_id: 1,  programa: 'Ingeniería de Sistemas', codigoTarjeta: 'RFID-A1B2', activo: true  },
  { id: 2, nombre: 'María',  apellido: 'López',   correo: 'maria.lopez@campusucc.edu.co',    rol: 'estudiante',     programa_id: 1,  programa: 'Ingeniería de Sistemas', codigoTarjeta: 'RFID-C3D4', activo: true  },
  { id: 3, nombre: 'Jorge',  apellido: 'Peña',    correo: 'jorge.pena@campusucc.edu.co',     rol: 'docente',        programa_id: 2,  programa: 'Ingeniería Civil',       codigoTarjeta: null,        activo: true  },
  { id: 4, nombre: 'Laura',  apellido: 'Vargas',  correo: 'laura.vargas@campusucc.edu.co',   rol: 'estudiante',     programa_id: 5,  programa: 'Administración de Empresas', codigoTarjeta: 'RFID-E5F6', activo: false },
  { id: 5, nombre: 'Admin',  apellido: 'Sistema', correo: 'admin@campusucc.edu.co',          rol: 'administrador',  programa_id: null, programa: null,                codigoTarjeta: null,        activo: true  },
  { id: 6, nombre: 'Sandra', apellido: 'Gómez',   correo: 'sandra.gomez@campusucc.edu.co',   rol: 'estudiante',     programa_id: 8,  programa: 'Derecho',                codigoTarjeta: 'RFID-G7H8', activo: true  },
  { id: 7, nombre: 'Pedro',  apellido: 'Castro',  correo: 'pedro.castro@campusucc.edu.co',   rol: 'docente',        programa_id: 4,  programa: 'Ingeniería Industrial',  codigoTarjeta: 'RFID-I9J0', activo: true  },
];

export const MOCK_DISPOSITIVOS = [
  { id: 1, codigo: 'ESP32-01', aula: 'Sala 305-B',     ip: '192.168.1.101', mac: 'AA:BB:CC:11:22:33', estado: 'Activo',        ultimaConexion: 'Hace 5 min' },
  { id: 2, codigo: 'ESP32-02', aula: 'Lab Sistemas 1', ip: '192.168.1.102', mac: 'AA:BB:CC:44:55:66', estado: 'Activo',        ultimaConexion: 'Hace 12 min' },
  { id: 3, codigo: 'ESP32-03', aula: 'Sala 210-A',     ip: '192.168.1.103', mac: 'AA:BB:CC:77:88:99', estado: 'Inactivo',      ultimaConexion: 'Hace 2 días' },
  { id: 4, codigo: 'ESP32-04', aula: 'Sala 101-C',     ip: '192.168.1.104', mac: 'AA:BB:CC:AA:BB:CC', estado: 'Mantenimiento', ultimaConexion: 'Hace 5 días' },
];

export const ADMIN_STATS = [
  { id: 'personas',     label: 'Personas registradas', value: 248,  icon: 'group',     delta: '+12 este mes' },
  { id: 'cursos',       label: 'Cursos activos',        value: 34,   icon: 'menu_book', delta: 'Semestre actual' },
  { id: 'dispositivos', label: 'Dispositivos RFID',     value: 12,   icon: 'sensors',   delta: '10 activos' },
  { id: 'sesiones',     label: 'Sesiones hoy',          value: 18,   icon: 'today',     delta: '6 en curso' },
];