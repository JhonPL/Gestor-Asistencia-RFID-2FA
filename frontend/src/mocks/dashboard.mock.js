/**
 * Mock data del dashboard docente.
 * Toda la data simulada vive aquí para que cuando llegue la API
 * solo se cambie el origen sin tocar los componentes.
 *
 * Estructura basada en las tablas:
 *  curso, aula_curso_horario, horario, sesion_clase, asistencia
 */

export const MOCK_DOCENTE = {
  nombre: 'Carlos',
  apellido: 'Ramírez',
  correo: 'carlos.ramirez@ucc.edu.co',
  iniciales: 'CR',
};

// Colores de badge por curso (ciclan si hay más de 3)
const BADGE_VARIANTS = ['default', 'success', 'warning'];

export const MOCK_CURSOS = [
  {
    id: 1,
    codigo: 'IS-301',
    nombre: 'Ingeniería de Software II',
    aula: 'Sala 305-B',
    horario: 'Lun, Mié · 08:00 AM – 10:00 AM',
    totalEstudiantes: 32,
    badgeVariant: 'default',
  },
  {
    id: 2,
    codigo: 'BD-202',
    nombre: 'Bases de Datos II',
    aula: 'Lab Sistemas 1',
    horario: 'Mar, Jue · 02:00 PM – 04:00 PM',
    totalEstudiantes: 28,
    badgeVariant: 'success',
  },
  {
    id: 3,
    codigo: 'RS-401',
    nombre: 'Redes y Seguridad',
    aula: 'Sala 210-A',
    horario: 'Vie · 10:00 AM – 12:00 PM',
    totalEstudiantes: 19,
    badgeVariant: 'warning',
  },
];

export const MOCK_SESIONES_RECIENTES = [
  {
    id: 1,
    cursoNombre: 'Ingeniería de Software II',
    cursoCodigo: 'IS-301',
    fecha: 'Hoy',
    tasaAsistencia: 91,
    estadoGeneral: 'ok', // ok | warning | error
  },
  {
    id: 2,
    cursoNombre: 'Bases de Datos II',
    cursoCodigo: 'BD-202',
    fecha: 'Ayer',
    tasaAsistencia: 75,
    estadoGeneral: 'warning',
    nota: 'Revisar',
  },
  {
    id: 3,
    cursoNombre: 'Redes y Seguridad',
    cursoCodigo: 'RS-401',
    fecha: 'Lunes',
    tasaAsistencia: 95,
    estadoGeneral: 'ok',
  },
];

export const MOCK_PROXIMAS_CLASES = [
  {
    id: 1,
    cursoNombre: 'Bases de Datos II',
    aula: 'Lab Sistemas 1',
    horaInicio: '02:00 PM',
    minutosRestantes: 35,
    proxima: true,
  },
  {
    id: 2,
    cursoNombre: 'Comité de Programa',
    aula: 'Sala de Reuniones',
    horaInicio: '05:00 PM',
    proxima: false,
  },
];

export const MOCK_ACCIONES_RAPIDAS = [
  { id: 'justify',  icon: 'edit_note',      label: 'Justificar ausencia' },
  { id: 'export',   icon: 'download',        label: 'Exportar asistencia' },
  { id: 'students', icon: 'group',           label: 'Ver estudiantes' },
  { id: 'sessions', icon: 'history',         label: 'Historial sesiones' },
];