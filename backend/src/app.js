// src/app.js
// Configuración de la aplicación Express.
// No inicia el servidor aquí; eso lo hace src/index.js.

import express from 'express';
import cors    from 'cors';
import morgan  from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env }          from './config/env.js';
import { swaggerSpec }  from './config/swagger.js';
import apiRoutes        from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// ── CORS ──────────────────────────────────────────────────────
// En producción reemplazar el origen por el dominio real del frontend
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev
  'http://localhost:3001',   // Otros
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (apps móviles, Postman, ESP32)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido → ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Middlewares globales ──────────────────────────────────────
app.use(express.json());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Swagger UI ────────────────────────────────────────────────
// Disponible en: http://localhost:3000/api-docs
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'SmartClass RFID — API Docs',
    customCss: '.swagger-ui .topbar { background-color: #000666; }',
    swaggerOptions: {
      persistAuthorization: true,  // mantiene el token entre recargas
      displayRequestDuration: true,
    },
  }),
);

// Endpoint que devuelve el JSON de la especificación (útil para importar en Postman)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    name:    'SmartClass RFID API',
    version: '1.0.0',
    docs:    '/api/health',
  });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ── Manejador global de errores (debe ser el último) ──────────
app.use(errorHandler);

export default app;
