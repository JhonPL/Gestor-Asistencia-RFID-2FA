import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — redirige a /login si no hay sesión,
 * o al área correcta si el rol no coincide.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to={user.rol === 'administrador' ? '/admin' : '/mis-cursos'} replace />;
  }

  return children;
};

export default ProtectedRoute;