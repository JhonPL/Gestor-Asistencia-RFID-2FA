// src/services/auth.service.js
// Lógica de negocio del login:
//  1. Recibe claims de Azure AD (correo + microsoft_id)
//  2. Busca a la persona en la BD por correo
//  3. Si el microsoft_id no está guardado todavía, lo guarda (primer login)
//  4. Devuelve un JWT propio con los datos del usuario

import { pool } from '../config/db.js';
import { signJwt } from '../middlewares/auth.js';
import { createError } from '../middlewares/errorHandler.js';

export async function loginWithAzure({ correo, microsoftId }) {
  // Busca la persona por correo institucional
  const { rows } = await pool.query(
    `SELECT
       p.id, p.nombre, p.apellido, p.correo,
       p.microsoft_id, p.activo,
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

  // Guarda el microsoft_id en el primer login (aún no lo tenía)
  if (!persona.microsoft_id && microsoftId) {
    await pool.query(
      'UPDATE persona SET microsoft_id = $1 WHERE id = $2',
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
