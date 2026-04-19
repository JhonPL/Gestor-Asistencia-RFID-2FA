/**
 * mocks.js — Datos simulados de la app móvil SmartClass.
 * Estructura idéntica a lo que devolverá la API real.
 * Para activar la API real, reemplaza las importaciones en cada pantalla.
 */

export const MOCK_STUDENT = {
  id: 5,
  nombre: 'Ana',
  apellido: 'García',
  iniciales: 'AG',
  correo: 'ana.garcia@ucc.edu.co',
  programa: 'Ingeniería de Sistemas',
  codigoTarjeta: 'RFID-C3D4',
};

/**
 * Estado de la sesión actual del estudiante.
 * Cambia este valor para ver los distintos estados de la UI:
 *   'sin_clase'  → no hay clase activa
 *   'pendiente'  → tarjeta pasada, esperando confirmar en app
 *   'completado' → biometría + GPS validados
 *   'fallido'    → biometría o GPS fallaron
 */
export const MOCK_SESION_ACTIVA = {
  estado: 'pendiente',            // ← cambia esto para probar la UI
  asistenciaId: 42,
  curso: {
    id: 1,
    codigo: 'IS-301',
    nombre: 'Ingeniería de Software II',
  },
  docente: 'Carlos Ramírez',
  aula: 'Sala 305-B',
  horaInicio: '08:00 AM',
  horaFin: '10:00 AM',
  fecha: new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  }),
};

export const MOCK_CLASES_HOY = [
  {
    id: 1,
    codigo: 'IS-301',
    nombre: 'Ingeniería de Software II',
    aula: 'Sala 305-B',
    horaInicio: '08:00',
    horaFin: '10:00',
    estado: 'pendiente', // pendiente | completado | sin_registrar
  },
  {
    id: 2,
    codigo: 'BD-202',
    nombre: 'Bases de Datos II',
    aula: 'Lab Sistemas 1',
    horaInicio: '14:00',
    horaFin: '16:00',
    estado: 'sin_registrar',
  },
];

export const MOCK_HISTORIAL = [
  {
    id: 1,
    curso: { codigo: 'IS-301', nombre: 'Ingeniería de Software II' },
    fecha: '2025-07-07',
    fechaFormateada: 'Lunes, 7 de julio',
    horaRegistro: '07:58 AM',
    estado: 'Presente',
    estadoVerificacion: 'completado',
    metodo: 'fingerprint',
    dentroCampus: true,
  },
  {
    id: 2,
    curso: { codigo: 'BD-202', nombre: 'Bases de Datos II' },
    fecha: '2025-07-07',
    fechaFormateada: 'Lunes, 7 de julio',
    horaRegistro: '14:05 AM',
    estado: 'Presente',
    estadoVerificacion: 'completado',
    metodo: 'face_id',
    dentroCampus: true,
  },
  {
    id: 3,
    curso: { codigo: 'IS-301', nombre: 'Ingeniería de Software II' },
    fecha: '2025-07-04',
    fechaFormateada: 'Viernes, 4 de julio',
    horaRegistro: '08:12 AM',
    estado: 'Ausente',
    estadoVerificacion: 'fallido',
    metodo: 'fingerprint',
    dentroCampus: false,
  },
  {
    id: 4,
    curso: { codigo: 'RS-401', nombre: 'Redes y Seguridad' },
    fecha: '2025-07-04',
    fechaFormateada: 'Viernes, 4 de julio',
    horaRegistro: '10:02 AM',
    estado: 'Justificado',
    estadoVerificacion: 'completado',
    metodo: 'ubicacion',
    dentroCampus: true,
    motivo: 'Actividad institucional',
  },
  {
    id: 5,
    curso: { codigo: 'BD-202', nombre: 'Bases de Datos II' },
    fecha: '2025-07-02',
    fechaFormateada: 'Miércoles, 2 de julio',
    horaRegistro: null,
    estado: 'Ausente',
    estadoVerificacion: 'sin_app',
    metodo: null,
    dentroCampus: null,
  },
];

export const MOCK_STATS = {
  totalClases: 18,
  presentes: 14,
  ausentes: 2,
  justificados: 2,
  tasaAsistencia: 89,
};