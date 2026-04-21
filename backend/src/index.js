// src/index.js
// Punto de entrada del servidor.
// Importa la app de Express y arranca el servidor HTTP.

import './config/env.js';    // valida las variables de entorno primero
import './config/db.js';     // verifica la conexión a PostgreSQL al iniciar
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`🚀  API corriendo en http://localhost:${env.port}`);
  console.log(`📋  Entorno: ${env.nodeEnv}`);
  console.log(`🏥  Health:  http://localhost:${env.port}/api/health`);
  console.log(`📖  Swagger: http://localhost:${env.port}/api-docs`);
});
