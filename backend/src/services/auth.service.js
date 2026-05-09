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

// ─── OAuth 2.0 con Google ─────────────────────────────────────
// El frontend envía el ID token JWT de Google.
// Backend valida el token directamente contra Google.
export async function loginWithGoogle({ idToken }) {
  if (!idToken) {
    throw createError(400, 'Token de Google requerido');
  }

  try {
    console.log('\n🔐 [VERIFICAR TOKEN DE GOOGLE]');
    console.log('   Client ID:', env.google.clientId);
    console.log('   Token length:', idToken.length);
    console.log('   Token preview:', idToken.substring(0, 50) + '...');
    
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

    console.log('✅ [TOKEN VÁLIDO]');
    console.log('   Email:', correo);
    console.log('   Nombre:', nombre, apellido);
    console.log('   Google ID:', googleId);

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

    console.log('🔍 [BUSCAR EN BD]');
    console.log('   Correo buscado:', correo);
    console.log('   Personas encontradas:', rows.length);

    let persona;

    if (rows.length === 0) {
      console.log('➕ [CREAR NUEVA PERSONA]');
      // Persona no existe: crear con rol de estudiante (rol_id = 3)
      const { rows: newPersona } = await pool.query(
        `INSERT INTO persona (nombre, apellido, correo, google_id, rol_id, activo)
         VALUES ($1, $2, $3, $4, 3, true)
         RETURNING id, nombre, apellido, correo, activo`,
        [nombre, apellido, correo, googleId],
      );
      persona = newPersona[0];
      persona.rol = 'estudiante';
      console.log('   ✅ Persona creada con ID:', persona.id);
    } else {
      persona = rows[0];
      console.log('👤 [PERSONA EXISTENTE] ID:', persona.id);

      // Actualiza google_id si no lo tenía
      if (!persona.google_id && googleId) {
        await pool.query(
          'UPDATE persona SET google_id = $1 WHERE id = $2',
          [googleId, persona.id],
        );
        console.log('   ✅ google_id actualizado');
      }

      if (!persona.activo) {
        console.error('   ❌ CUENTA DESACTIVADA');
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

    console.log('🎫 [JWT GENERADO] para:', persona.correo);
    console.log('   Rol:', persona.rol, '\n');

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
    console.error('\n❌ [ERROR EN OAUTH2 DE GOOGLE]');
    console.error('   Tipo:', err.constructor.name);
    console.error('   Mensaje:', err.message);
    console.error('   Stack:', err.stack, '\n');
    
    // Dar más detalles si es error de verificación
    if (err.message.includes('Invalid token') || err.message.includes('Token used too late')) {
      throw createError(401, 'El token de Google expiró o es inválido. Intenta nuevamente.');
    }
    
    throw createError(401, 'Error validando token de Google: ' + err.message);
  }
}
