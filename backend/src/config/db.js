// src/config/db.js
// Pool de conexiones PostgreSQL usando pg (node-postgres).
// Se exporta el pool para usar en los servicios: pool.query(sql, params)

import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host:     env.db.host,
  port:     env.db.port,
  database: env.db.database,
  user:     env.db.user,
  password: env.db.password,
  // Máximo de conexiones simultáneas (ajustar según el servidor)
  max: 10,
  // Tiempo máximo que una conexión inactiva permanece en el pool (ms)
  idleTimeoutMillis: 30_000,
  // Tiempo máximo esperando una conexión libre (ms)
  connectionTimeoutMillis: 5_000,
});

// Verifica la conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  }
  release();
  console.log(`✅  PostgreSQL conectado → ${env.db.database}@${env.db.host}:${env.db.port}`);
});

// Helper para transacciones
// Uso: const { query, end } = await getTransaction();
//      await query('INSERT ...');  await end();
export async function getTransaction() {
  const client = await pool.connect();
  return {
    query: (text, params) => client.query(text, params),
    commit:   async () => { await client.query('COMMIT');   client.release(); },
    rollback: async () => { await client.query('ROLLBACK'); client.release(); },
    begin:    async () => { await client.query('BEGIN'); },
  };
}
