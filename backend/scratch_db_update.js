import { pool } from './src/config/db.js';
async function run() {
  await pool.query(`UPDATE asistencia SET estado_verificacion_id = (SELECT id FROM estado_verificacion WHERE nombre = 'rechazado') WHERE estado_verificacion_id = (SELECT id FROM estado_verificacion WHERE nombre = 'registrado') AND estado_asistencia_id = (SELECT id FROM estado_asistencia WHERE nombre = 'Ausente');`);
  console.log('Updated db');
  process.exit(0);
}
run();
