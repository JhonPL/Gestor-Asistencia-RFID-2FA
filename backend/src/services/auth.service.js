// src/services/auth.service.js
// Lógica de negocio del login:
//  1. Recibe claims de Google OAuth (correo + google_id)
//  2. Busca a la persona en la BD por correo
//  3. Si el google_id no está guardado todavía, lo guarda (primer login)
//  4. Devuelve un JWT propio con los datos del usuario

import { pool } from '../config/db.js';
import { signJwt } from '../middlewares/auth.js';
import { createError } from '../middlewares/errorHandler.js';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';

const googleClient = new OAuth2Client(
  env.google.clientId,
  env.google.clientSecret,
  env.google.redirectUri,
);

export async function loginWithAzure({ correo, microsoftId }) {
  // Busca la persona por correo institucional
  const { rows } = await pool.query(
    `SELECT
       p.id, p.nombre, p.apellido, p.correo,
       p.google_id, p.activo,
       r.nombre AS rol
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     WHERE p.correo = $1`,
    [correo],
  );

  if (rows.length === 0) {
    throw createError(403, 'Acceso denegado: correo no registrado en el sistema');
  }

  const persona = rows[0];

  if (!persona.activo) {
    throw createError(403, 'Cuenta desactivada. Contacta al administrador.');
  }

  // Guarda el google_id en el primer login (aún no lo tenía)
  if (!persona.google_id && microsoftId) {
    await pool.query(
      'UPDATE persona SET google_id = $1 WHERE id = $2',
      [microsoftId, persona.id],
    );
  }

  // Emite el JWT propio (dura lo que diga JWT_EXPIRES_IN en .env)
  const token = signJwt({
    id:       persona.id,
    correo:   persona.correo,
    rol:      persona.rol,
    nombre:   persona.nombre,
    apellido: persona.apellido,
  });

  return {
    token,
    user: {
      id:       persona.id,
      nombre:   persona.nombre,
      apellido: persona.apellido,
      correo:   persona.correo,
      rol:      persona.rol,
    },
  };
}

// ─── Modo simulación (desarrollo sin Azure AD) ────────────────
// El frontend envía { correo, rol } directamente.
// SOLO funciona si NODE_ENV=development
export async function loginSimulado({ correo }) {
  const { rows } = await pool.query(
    `SELECT p.id, p.nombre, p.apellido, p.correo, p.activo, r.nombre AS rol
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     WHERE p.correo = $1`,
    [correo],
  );

  if (rows.length === 0) {
    throw createError(403, 'Correo no registrado');
  }

  const persona = rows[0];
  if (!persona.activo) throw createError(403, 'Cuenta desactivada');

  const token = signJwt({
    id:       persona.id,
    correo:   persona.correo,
    rol:      persona.rol,
    nombre:   persona.nombre,
    apellido: persona.apellido,
  });

  return { token, user: { id: persona.id, nombre: persona.nombre, apellido: persona.apellido, correo: persona.correo, rol: persona.rol } };
}

// ─── OAuth 2.0 con Google ─────────────────────────────────────
// El frontend envía el ID token JWT de Google.
// Backend valida el token directamente contra Google.
export async function loginWithGoogle({ idToken }) {
  if (!idToken) {
    throw createError(400, 'Token de Google requerido');
  }

  try {
    // Verifica el token de identidad
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: env.google.clientId,
    });

    const payload = ticket.getPayload();
    const correo = payload.email;
    const nombre = payload.given_name || '';
    const apellido = payload.family_name || '';
    const googleId = payload.sub;

    if (!correo) {
      throw createError(400, 'No se pudo obtener el email de Google');
    }

    // Busca la persona por correo
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.apellido, p.correo, p.activo, p.google_id, r.nombre AS rol
       FROM persona p
       JOIN rol r ON r.id = p.rol_id
       WHERE p.correo = $1`,
      [correo],
    );

    let persona;

    if (rows.length === 0) {
  throw createError(403, 'Acceso denegado: correo no registrado en el sistema');
} else {
  persona = rows[0];

  // Actualiza google_id si no lo tenía
  if (!persona.google_id && googleId) {
    await pool.query(
      'UPDATE persona SET google_id = $1 WHERE id = $2',
      [googleId, persona.id],
    );
  }

  if (!persona.activo) {
    throw createError(403, 'Cuenta desactivada. Contacta al administrador.');
  }
}

    // Emite el JWT propio
    const jwtToken = signJwt({
      id:       persona.id,
      correo:   persona.correo,
      rol:      persona.rol,
      nombre:   persona.nombre,
      apellido: persona.apellido,
    });

    return {
      token: jwtToken,
      user: {
        id:       persona.id,
        nombre:   persona.nombre,
        apellido: persona.apellido,
        correo:   persona.correo,
        rol:      persona.rol,
      },
    };
  } catch (err) {
    console.error('Error en OAuth2 de Google:', err.message);
    throw createError(401, 'Error validando token de Google: ' + err.message);
  }
}
