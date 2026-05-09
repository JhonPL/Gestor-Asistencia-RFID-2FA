import { pool } from './src/config/db.js';

async function run() {
  try {
    const res = await pool.query(`
      INSERT INTO verificacion_biometrica (asistencia_id, dispositivo_movil_id, metodo_verificacion_id, exitoso, latitud, longitud, dentro_campus)
      VALUES (1, 1, 1, false, 0, 0, false) RETURNING *
    `);
    console.log(res.rows);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    process.exit(0);
  }
}
run();
