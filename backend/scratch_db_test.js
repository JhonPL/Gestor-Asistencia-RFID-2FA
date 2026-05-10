import { pool } from './src/config/db.js';
async function test() {
  try {
    const res = await pool.query(`
      SELECT sc.id, sc.estado, sc.fecha, h.hora_fin
      FROM sesion_clase sc
      JOIN aula_curso_horario ach ON ach.id = sc.aula_curso_horario_id
      JOIN horario h ON h.id = ach.horario_id
      WHERE sc.fecha = CURRENT_DATE
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
