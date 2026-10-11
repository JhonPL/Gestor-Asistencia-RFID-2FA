// src/services/personas.service.js
// Corrección: se añade p.programa_id al SELECT de getPersonas y getPersonaById
// para que el frontend pueda preseleccionar el programa al editar.

import { pool, getTransaction } from '../config/db.js';
import { createError } from '../middlewares/errorHandler.js';

// Listado con filtros opcionales
export async function getPersonas({ rol, activo, search, page, limit } = {}) {
  const conditions = [];
  const params = [];

  if (rol) {
    params.push(rol);
    conditions.push(`r.nombre = $${params.length}`);
  }
  if (activo !== undefined) {
    params.push(activo);
    conditions.push(`p.activo = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(p.nombre ILIKE $${params.length} OR p.apellido ILIKE $${params.length} OR p.correo ILIKE $${params.length})`,
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  if (page !== undefined) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM persona p JOIN rol r ON r.id = p.rol_id ${where}`,
      params,
    );
    const total = countResult.rows[0].total;
    const offset = (safePage - 1) * safeLimit;
    const { rows } = await pool.query(
      `SELECT
         p.id, p.nombre, p.apellido, p.correo,
         p.codigo_tarjeta, p.activo, p.created_at,
         p.programa_id, r.nombre AS rol, pr.nombre AS programa,
         (dm.id IS NOT NULL) AS app_movil_vinculada,
         dm.plataforma AS app_movil_plataforma,
         dm.activo AS app_movil_activa,
         dm.ultima_sesion AS app_movil_ultima_sesion
       FROM persona p
       JOIN rol r ON r.id = p.rol_id
       LEFT JOIN programa pr ON pr.id = p.programa_id
       LEFT JOIN dispositivo_movil dm ON dm.persona_id = p.id
       ${where}
       ORDER BY p.apellido, p.nombre
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, safeLimit, offset],
    );
    return {
      items: rows,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  const { rows } = await pool.query(
    `SELECT
       p.id, p.nombre, p.apellido, p.correo,
       p.codigo_tarjeta, p.activo, p.created_at,
       p.programa_id,
       r.nombre  AS rol,
       pr.nombre AS programa,
       (dm.id IS NOT NULL) AS app_movil_vinculada,
       dm.plataforma AS app_movil_plataforma,
       dm.activo AS app_movil_activa,
       dm.ultima_sesion AS app_movil_ultima_sesion
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     LEFT JOIN programa pr ON pr.id = p.programa_id
     LEFT JOIN dispositivo_movil dm ON dm.persona_id = p.id
     ${where}
     ORDER BY p.apellido, p.nombre`,
    params,
  );
  return rows;
}

export async function getPersonaById(id) {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.nombre, p.apellido, p.correo,
       p.codigo_tarjeta, p.activo, p.programa_id,
       r.nombre  AS rol,
       pr.nombre AS programa,
       (dm.id IS NOT NULL) AS app_movil_vinculada,
       dm.plataforma AS app_movil_plataforma,
       dm.activo AS app_movil_activa,
       dm.ultima_sesion AS app_movil_ultima_sesion
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     LEFT JOIN programa pr ON pr.id = p.programa_id
     LEFT JOIN dispositivo_movil dm ON dm.persona_id = p.id
     WHERE p.id = $1`,
    [id],
  );
  if (!rows.length) throw createError(404, 'Persona no encontrada');
  return rows[0];
}

export async function createPersona({ nombre, apellido, correo, rolNombre, programaId }) {
  const rolRes = await pool.query('SELECT id FROM rol WHERE nombre = $1', [rolNombre]);
  if (!rolRes.rows.length) throw createError(400, `Rol inválido: ${rolNombre}`);
  const rolId = rolRes.rows[0].id;

  const { rows } = await pool.query(
    `INSERT INTO persona (nombre, apellido, correo, rol_id, programa_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nombre, apellido, correo, activo, programa_id`,
    [nombre, apellido, correo, rolId, programaId || null],
  );

  const result = rows[0];

  // Enriquecer con nombre de rol y programa
  const prog = programaId
    ? await pool.query('SELECT nombre FROM programa WHERE id = $1', [programaId])
    : { rows: [] };

  return {
    ...result,
    rol:           rolNombre,
    programa:      prog.rows[0]?.nombre ?? null,
    codigo_tarjeta: null,
  };
}

export async function importarPersonas(personas) {
  if (!Array.isArray(personas) || personas.length === 0) {
    throw createError(400, 'Se requiere un arreglo de personas no vacío');
  }
  if (personas.length > 500) {
    throw createError(400, 'La importación permite un máximo de 500 personas por archivo');
  }

  const rolesValidos = new Set(['estudiante', 'docente', 'administrador']);
  const errores = [];
  const normalizadas = personas.map((persona, index) => {
    const fila = index + 2;
    const nombre = String(persona?.nombre ?? '').trim();
    const apellido = String(persona?.apellido ?? '').trim();
    const correo = String(persona?.correo ?? '').trim().toLowerCase();
    const rol = String(persona?.rol ?? '').trim().toLowerCase();
    const programaRaw = persona?.programa_id;
    const programaId = programaRaw === undefined || programaRaw === null || String(programaRaw).trim() === ''
      ? null
      : Number(programaRaw);

    if (!nombre) errores.push(`Fila ${fila}: falta nombre`);
    if (!apellido) errores.push(`Fila ${fila}: falta apellido`);
    if (!correo) errores.push(`Fila ${fila}: falta correo`);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.push(`Fila ${fila}: correo inválido`);
    if (!rolesValidos.has(rol)) errores.push(`Fila ${fila}: rol inválido (usa estudiante, docente o administrador)`);
    if (programaId !== null && (!Number.isInteger(programaId) || programaId <= 0)) {
      errores.push(`Fila ${fila}: programa_id debe ser un entero positivo o estar vacío`);
    }

    return { nombre, apellido, correo, rol, programaId, fila };
  });

  const correosVistos = new Set();
  for (const persona of normalizadas) {
    if (!persona.correo) continue;
    if (correosVistos.has(persona.correo)) errores.push(`Fila ${persona.fila}: correo repetido en el archivo`);
    correosVistos.add(persona.correo);
  }
  if (errores.length) {
    throw createError(400, errores.slice(0, 20).join(' | '));
  }

  const tx = await getTransaction();
  try {
    await tx.begin();

    const rolesSolicitados = [...new Set(normalizadas.map(persona => persona.rol))];
    const { rows: filasRol } = await tx.query(
      'SELECT id, nombre FROM rol WHERE nombre = ANY($1::text[])',
      [rolesSolicitados],
    );
    const rolesPorNombre = new Map(filasRol.map(rol => [rol.nombre, rol.id]));
    const rolesFaltantes = rolesSolicitados.filter(rol => !rolesPorNombre.has(rol));
    if (rolesFaltantes.length) {
      throw createError(400, `Roles no configurados en la base de datos: ${rolesFaltantes.join(', ')}`);
    }

    const programasSolicitados = [...new Set(normalizadas
      .map(persona => persona.programaId)
      .filter(programaId => programaId !== null))];
    if (programasSolicitados.length) {
      const { rows: programas } = await tx.query(
        'SELECT id FROM programa WHERE id = ANY($1::int[])',
        [programasSolicitados],
      );
      const programasEncontrados = new Set(programas.map(programa => programa.id));
      const programasFaltantes = programasSolicitados.filter(id => !programasEncontrados.has(id));
      if (programasFaltantes.length) {
        throw createError(400, `programa_id no encontrado: ${programasFaltantes.join(', ')}`);
      }
    }

    const correos = normalizadas.map(persona => persona.correo);
    const { rows: duplicados } = await tx.query(
      'SELECT LOWER(correo) AS correo FROM persona WHERE LOWER(correo) = ANY($1::text[])',
      [correos],
    );
    if (duplicados.length) {
      throw createError(409, `Correo(s) ya registrado(s): ${duplicados.map(persona => persona.correo).join(', ')}`);
    }

    const creadas = [];
    for (const persona of normalizadas) {
      const { rows } = await tx.query(
        `INSERT INTO persona (nombre, apellido, correo, rol_id, programa_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nombre, apellido, correo, activo, programa_id`,
        [persona.nombre, persona.apellido, persona.correo, rolesPorNombre.get(persona.rol), persona.programaId],
      );
      creadas.push(rows[0]);
    }

    await tx.commit();
    return { importadas: creadas.length, personas: creadas };
  } catch (err) {
    await tx.rollback();
    if (err.code === '23505') throw createError(409, 'Uno o más correos ya están registrados');
    throw err;
  }
}

export async function updatePersona(id, campos) {
  const allowed = ['nombre', 'apellido', 'correo', 'activo', 'programa_id', 'codigo_tarjeta'];
  const sets = [];
  const params = [];

  for (const [key, val] of Object.entries(campos)) {
    if (allowed.includes(key)) {
      params.push(val);
      sets.push(`${key} = $${params.length}`);
    }
  }

  if (campos.rol !== undefined) {
    const rolRes = await pool.query('SELECT id FROM rol WHERE nombre = $1', [campos.rol]);
    if (!rolRes.rows.length) throw createError(400, `Rol inválido: ${campos.rol}`);
    params.push(rolRes.rows[0].id);
    sets.push(`rol_id = $${params.length}`);
  }

  if (!sets.length) throw createError(400, 'No hay campos válidos para actualizar');

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE persona
     SET ${sets.join(', ')}
     WHERE id = $${params.length}
     RETURNING id, nombre, apellido, correo, activo, programa_id, codigo_tarjeta`,
    params,
  );
  if (!rows.length) throw createError(404, 'Persona no encontrada');

  // Enriquecer con nombres de rol y programa
  const updated = rows[0];
  const enriched = await pool.query(
    `SELECT r.nombre AS rol, pr.nombre AS programa
     FROM persona p
     JOIN rol r ON r.id = p.rol_id
     LEFT JOIN programa pr ON pr.id = p.programa_id
     WHERE p.id = $1`,
    [updated.id],
  );

  return {
    ...updated,
    rol:      enriched.rows[0]?.rol      ?? null,
    programa: enriched.rows[0]?.programa ?? null,
  };
}

export async function linkTarjeta(personaId, codigoTarjeta) {
  const { rows } = await pool.query(
    'UPDATE persona SET codigo_tarjeta = $1 WHERE id = $2 RETURNING id, codigo_tarjeta',
    [codigoTarjeta, personaId],
  );
  if (!rows.length) throw createError(404, 'Persona no encontrada');
  return rows[0];
}

export async function resetDevice(personaId) {
  const { rows } = await pool.query(
    `UPDATE dispositivo_movil
     SET installation_id = NULL, activo = false
     WHERE persona_id = $1
     RETURNING id, persona_id, activo`,
    [personaId],
  );
  if (!rows.length) throw createError(404, 'La persona no tiene un dispositivo móvil vinculado');
  return rows[0];
}