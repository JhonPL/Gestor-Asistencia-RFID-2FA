// src/index.js
// Punto de entrada del servidor.
// Importa la app de Express y arranca el servidor HTTP.

import './config/env.js';    // valida las variables de entorno primero
import './config/db.js';     // verifica la conexión a PostgreSQL al iniciar
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🚀  API corriendo en http://0.0.0.0:${env.port}`);
  console.log(`📋  Entorno: ${env.nodeEnv}`);
  console.log(`🏥  Health:  http://localhost:${env.port}/api/health`);
  console.log(`📖  Swagger: http://localhost:${env.port}/api-docs`);
  console.log(`📱  En red: http://192.168.80.60:${env.port}`);
});
