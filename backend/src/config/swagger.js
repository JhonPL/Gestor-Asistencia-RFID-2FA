// src/config/swagger.js
// Configuración de swagger-jsdoc.
// Define los metadatos globales de la API y los schemas reutilizables.
// Las anotaciones de cada endpoint viven en sus archivos de rutas.

import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SmartClass RFID API',
      version: '1.0.0',
      description: `
API REST del sistema de gestión de asistencia con tarjetas RFID y segundo factor biométrico.

**Universidad Cooperativa de Colombia — Sede Villavicencio, Meta**

### Autenticación
La mayoría de endpoints requieren un **JWT propio** que se obtiene en \`POST /api/auth/login\` (o \`/api/auth/login-dev\` en desarrollo).
Incluirlo en el header: \`Authorization: Bearer <token>\`

### Roles
| Rol | Acceso |
|---|---|
| \`docente\` | Dashboard, asistencia de sus cursos |
| \`administrador\` | Panel completo + CRUD de todas las entidades |
| \`estudiante\` | Solo app móvil (no accede a esta API directamente) |
      `,
      contact: {
        name: 'SmartClass RFID — Trabajo de grado',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Servidor de desarrollo',
      },
    ],
    // ── Esquemas reutilizables ($ref) ──────────────────────────
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT propio obtenido en POST /api/auth/login',
        },
        AzureToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de Microsoft Azure AD (solo para /api/auth/login)',
        },
      },
      schemas: {
        // ── Respuestas genéricas ──────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensaje de error descriptivo' },
          },
        },
        OkResponse: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
          },
        },

        // ── Auth ──────────────────────────────────────────────
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT propio con duración configurada en JWT_EXPIRES_IN',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: { $ref: '#/components/schemas/UserMe' },
          },
        },
        UserMe: {
          type: 'object',
          properties: {
            id:       { type: 'integer', example: 1 },
            nombre:   { type: 'string',  example: 'Carlos' },
            apellido: { type: 'string',  example: 'Ramírez' },
            correo:   { type: 'string',  example: 'carlos.ramirez@campusucc.edu.co' },
            rol:      { type: 'string',  enum: ['docente', 'estudiante', 'administrador'] },
          },
        },

        // ── Persona ───────────────────────────────────────────
        Persona: {
          type: 'object',
          properties: {
            id:             { type: 'integer', example: 1 },
            nombre:         { type: 'string',  example: 'Carlos' },
            apellido:       { type: 'string',  example: 'Ramírez' },
            correo:         { type: 'string',  example: 'carlos.ramirez@campusucc.edu.co' },
            rol:            { type: 'string',  enum: ['docente', 'estudiante', 'administrador'] },
            programa:       { type: 'string',  nullable: true, example: 'Ingeniería de Sistemas' },
            codigo_tarjeta: { type: 'string',  nullable: true, example: 'RFID-A1B2' },
            activo:         { type: 'boolean', example: true },
            created_at:     { type: 'string',  format: 'date-time' },
          },
        },
        PersonaInput: {
          type: 'object',
          required: ['nombre', 'apellido', 'correo', 'rol'],
          properties: {
            nombre:      { type: 'string', example: 'Carlos' },
            apellido:    { type: 'string', example: 'Ramírez' },
            correo:      { type: 'string', format: 'email', example: 'carlos.ramirez@campusucc.edu.co' },
            rol:         { type: 'string', enum: ['docente', 'estudiante', 'administrador'] },
            programa_id: { type: 'integer', nullable: true, example: 1 },
          },
        },

        // ── Curso ─────────────────────────────────────────────
        Curso: {
          type: 'object',
          properties: {
            id:           { type: 'integer', example: 1 },
            nombre:       { type: 'string',  example: 'Ingeniería de Software II' },
            codigo:       { type: 'string',  example: 'IS-301', nullable: true },
            fecha_inicio: { type: 'string',  format: 'date', example: '2025-02-03' },
            fecha_fin:    { type: 'string',  format: 'date', example: '2025-06-15' },
            docente:      { type: 'string',  nullable: true, example: 'Carlos Ramírez' },
            activo:       { type: 'boolean', example: true },
          },
        },
        CursoDetalle: {
          allOf: [
            { $ref: '#/components/schemas/Curso' },
            {
              type: 'object',
              properties: {
                horarios: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      aula:        { type: 'string', example: '305-B' },
                      dia:         { type: 'string', example: 'Lunes' },
                      hora_inicio: { type: 'string', example: '08:00:00' },
                      hora_fin:    { type: 'string', example: '10:00:00' },
                    },
                  },
                },
              },
            },
          ],
        },

        // ── Asistencia ────────────────────────────────────────
        RegistroAsistencia: {
          type: 'object',
          properties: {
            id:                   { type: 'integer', example: 1 },
            nombre:               { type: 'string',  example: 'Ana' },
            apellido:             { type: 'string',  example: 'García' },
            correo:               { type: 'string',  example: 'ana.garcia@campusucc.edu.co' },
            estado:               { type: 'string',  enum: ['Presente', 'Ausente', 'Justificado'] },
            estado_verificacion:  { type: 'string',  enum: ['pendiente', 'completado', 'fallido', 'sin_app'] },
            fecha_registro:       { type: 'string',  format: 'date' },
            hora_registro:        { type: 'string',  example: '08:05:00' },
            verificado_biometrico: { type: 'boolean' },
            metodo_verificacion:  { type: 'string',  enum: ['fingerprint', 'face_id', 'ubicacion'], nullable: true },
          },
        },

        // ── RFID ─────────────────────────────────────────────
        RfidScanInput: {
          type: 'object',
          required: ['codigo_dispositivo', 'codigo_tarjeta'],
          properties: {
            codigo_dispositivo: { type: 'string', example: 'ESP32-01' },
            codigo_tarjeta:     { type: 'string', example: 'RFID-A1B2' },
          },
        },
        RfidScanResponse: {
          type: 'object',
          properties: {
            accion: {
              type: 'string',
              enum: ['sesion_abierta', 'sesion_cerrada', 'pendiente_verificacion', 'sin_app', 'ya_registrado', 'rechazado'],
            },
            persona:      { type: 'string', example: 'Carlos' },
            sesion_id:    { type: 'integer', nullable: true, example: 14 },
            asistencia_id:{ type: 'integer', nullable: true, example: 42 },
            motivo:       { type: 'string',  nullable: true, example: 'No inscrito en este curso' },
          },
        },
        RfidVerificarInput: {
          type: 'object',
          required: ['asistencia_id', 'dispositivo_movil_id', 'metodo', 'exitoso', 'latitud', 'longitud'],
          properties: {
            asistencia_id:      { type: 'integer', example: 42 },
            dispositivo_movil_id: { type: 'integer', example: 5 },
            metodo:   { type: 'string', enum: ['fingerprint', 'face_id', 'ubicacion'] },
            exitoso:  { type: 'boolean', example: true },
            latitud:  { type: 'number', format: 'float', example: -4.14285 },
            longitud: { type: 'number', format: 'float', example: -73.62674 },
          },
        },
      },
    },
    // Seguridad global (se puede sobrescribir por endpoint)
    security: [{ BearerAuth: [] }],
  },
  // Archivos donde swagger-jsdoc buscará anotaciones @openapi / @swagger
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
