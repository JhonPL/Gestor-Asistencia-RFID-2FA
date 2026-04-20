import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — redirige si no hay sesión o el rol no coincide.
 *
 * Uso:
 *   <ProtectedRoute roles={['docente']}>
 *     <DashboardPage />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute roles={['administrador']}>
 *     <AdminPage />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mientras carga la sesión (ej. leer localStorage) no redirigir aún
  if (loading) return null;

  // Sin sesión → ir al login guardando la ruta de origen
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Con sesión pero rol incorrecto → ir al inicio apropiado
  if (roles.length > 0 && !roles.includes(user.rol)) {
    const fallback = user.rol === 'administrador' ? '/admin' : '/mis-cursos';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;