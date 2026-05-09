// src/index.js
// Punto de entrada del servidor.
// Importa la app de Express y arranca el servidor HTTP.

import './config/env.js';    // valida las variables de entorno primero
import './config/db.js';     // verifica la conexión a PostgreSQL al iniciar
import app from './app.js';
import { env } from './config/env.js';

import { getTransaction } from './config/db.js';
import { insertarAusentes } from './routes/rfid.routes.js';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`🚀  API corriendo en http://0.0.0.0:${env.port}`);
  console.log(`📋  Entorno: ${env.nodeEnv}`);
  console.log(`🏥  Health:  http://localhost:${env.port}/api/health`);
  console.log(`📖  Swagger: http://localhost:${env.port}/api-docs`);
  console.log(`📱  En red: http://192.168.80.60:${env.port}`);
  
  setInterval(async () => {
    let tx;
    try {
      tx = await getTransaction();
      await tx.begin();
      
      const sesionesVencidas = await tx.query(
        `SELECT sc.id
         FROM sesion_clase sc
         JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
         JOIN horario h ON h.id = ach.horario_id
         WHERE sc.estado = 'activa'
           AND sc.fecha = CURRENT_DATE
           AND h.hora_fin < CURRENT_TIME`
      );

      for (const sesion of sesionesVencidas.rows) {
        await tx.query(
          `UPDATE sesion_clase SET estado = 'cerrada', hora_fin_real = CURRENT_TIME WHERE id = $1`,
          [sesion.id]
        );
        await insertarAusentes(sesion.id, tx);
        console.log(`[Auto-Close] Sesión expirada cerrada automáticamente: ${sesion.id}`);
      }

      await tx.commit();
    } catch (err) {
      if (tx) await tx.rollback();
      console.error('[Auto-Close] Error cerrando clases expiradas:', err);
    }
  }, 60000);
});
