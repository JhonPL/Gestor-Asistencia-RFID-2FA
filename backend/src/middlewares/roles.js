// src/middlewares/roles.js
// Middleware de control de acceso basado en roles.
// Siempre va después de verifyJwt en la cadena de middlewares.
//
// Uso:
//   router.get('/admin', verifyJwt, requireRole('administrador'), handler)
//   router.get('/cursos', verifyJwt, requireRole('docente', 'administrador'), handler)

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`,
      });
    }
    next();
  };
}
