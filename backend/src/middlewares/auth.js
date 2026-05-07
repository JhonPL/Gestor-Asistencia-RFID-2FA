// src/middlewares/auth.js
// Flujo de autenticación en dos pasos:
//
//  1. verifyAzureToken  → valida el token de Microsoft con sus claves públicas (JWKS)
//     (Deprecado) Úsalo en POST /api/auth/login para Azure AD
//     ⚠️  Actualmente usando Google OAuth: usa POST /api/auth/google/callback
//
//  2. verifyJwt         → valida el JWT propio que este backend emite tras el login
//     Úsalo en todas las rutas protegidas

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env.js';

// ─── Cliente JWKS de Microsoft ────────────────────────────────
// Descarga y cachea las claves públicas de Azure AD
// ⚠️  Solo se inicializa si Azure AD está configurado
let jwks = null;
if (env.azure?.tenantId) {
  jwks = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${env.azure.tenantId}/discovery/v2.0/keys`,
    cache: true,
    cacheMaxAge: 60 * 60 * 1000, // 1 hora
  });
}

// Obtiene la clave pública usando el kid (key ID) del header del token
function getSigningKey(header, callback) {
  if (!jwks) {
    return callback(new Error('Azure AD no está configurado'));
  }
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

// ─── Middleware 1: Valida token de Microsoft ──────────────────
// Se usa SOLO en el endpoint POST /api/auth/login
// El frontend envía:  Authorization: Bearer <azure_token>
// ⚠️  Actualmente deshabilitado: usar Google OAuth (/api/auth/google/callback) en su lugar
export async function verifyAzureToken(req, res, next) {
  // Si Azure AD no está configurado, permitir en desarrollo (modo simulación)
  if (!env.azure?.tenantId || !env.azure?.clientId) {
    if (env.nodeEnv === 'development') {
      console.warn('⚠️  Azure AD no configurado — modo simulación activo');
      return next();
    }
    return res.status(503).json({ error: 'Autenticación de Azure no configurada. Usa Google OAuth (/api/auth/google/callback).' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(
    token,
    getSigningKey,
    {
      audience: env.azure.clientId,
      issuer: [
        `https://login.microsoftonline.com/${env.azure.tenantId}/v2.0`,
        `https://sts.windows.net/${env.azure.tenantId}/`,
      ],
      algorithms: ['RS256'],
    },
    (err, decoded) => {
      if (err) {
        console.error('Token de Azure inválido:', err.message);
        return res.status(401).json({ error: 'Token de Microsoft inválido o expirado' });
      }
      // Adjunta los claims de Microsoft al request
      // decoded.preferred_username  → correo institucional
      // decoded.oid                 → microsoft_id único del usuario
      req.azureClaims = decoded;
      next();
    },
  );
}

// ─── Middleware 2: Valida JWT propio ──────────────────────────
// Se usa en todas las rutas protegidas después del login
// El frontend envía:  Authorization: Bearer <nuestro_jwt>
export function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    // decoded contendrá: { id, correo, rol, nombre, apellido, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ─── Helper: genera nuestro propio JWT ────────────────────────
// Se llama desde auth.service.js tras verificar el correo en la BD
export function signJwt(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}
