// src/components/ProtectedRoute.jsx
// Añade manejo del estado loading mientras se valida el token al arrancar la app.
// Sin esto, al refrescar la página con sesión activa redirige a /login antes de
// que getMe() termine.

import { Navigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import theme from '../styles/theme';

const spin = keyframes`to { transform: rotate(360deg); }`;

const Loader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${theme.colors.surface};

  &::after {
    content: '';
    width: 2rem;
    height: 2rem;
    border: 3px solid ${theme.colors.primaryFixed};
    border-top-color: ${theme.colors.primary};
    border-radius: 50%;
    animation: ${spin} 0.7s linear infinite;
  }
`;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Esperar hasta que se valide (o invalide) el token guardado
  if (loading) return <Loader aria-label="Cargando sesión" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to={user.rol === 'administrador' ? '/admin' : '/mis-cursos'} replace />;
  }

  return children;
};

export default ProtectedRoute;