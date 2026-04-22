// src/config/env.js
// Valida y exporta variables de entorno.
// Si falta una variable crítica, el proceso muere con un mensaje claro.

import 'dotenv/config';

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌  Variable de entorno faltante: ${key}`);
    process.exit(1);
  }
}

export const env = {
  // Servidor
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Base de datos
  db: {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  },

  // Azure AD
  azure: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    tenantId: process.env.AZURE_TENANT_ID || '',
  },

  // JWT propio
  jwt: {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  // Campus UCC Villavicencio
  campus: {
    lat:           parseFloat(process.env.CAMPUS_LAT    || '-4.142900'),
    lng:           parseFloat(process.env.CAMPUS_LNG    || '-73.626700'),
    radiusMeters:  parseInt(process.env.CAMPUS_RADIUS_METERS || '200', 10),
  },
};
