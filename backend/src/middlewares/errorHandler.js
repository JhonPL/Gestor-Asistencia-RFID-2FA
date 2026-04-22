// src/middlewares/errorHandler.js
// Manejador global de errores de Express.
// Debe ser el ÚLTIMO middleware registrado en app.js.

export function errorHandler(err, req, res, next) {
  // Log del error (en producción usar un logger como winston)
  console.error(`[${new Date().toISOString()}] ERROR:`, err);

  // Error de validación de la BD (pg)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Ya existe un registro con ese valor único',
      detail: err.detail,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referencia inválida: el registro relacionado no existe',
      detail: err.detail,
    });
  }

  // Error con statusCode personalizado (lanzado desde los servicios)
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
  });
}

// Helper para crear errores con statusCode desde los servicios
// Uso: throw createError(404, 'Persona no encontrada')
export function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
