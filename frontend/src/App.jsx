import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from './styles/GlobalStyles';
import theme from './styles/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import AdminPage from './pages/AdminPage';
import { GoogleOAuthProvider } from '@react-oauth/google';

const AppRoutes = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  // Recibe el token y el usuario ya autenticados desde LoginPage
  const handleLogin = (token, user) => {
    login(token, user);
    navigate(user.rol === 'administrador' ? '/admin' : '/mis-cursos', { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<LandingPage onLogin={() => navigate('/login')} />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

      {/* Docente */}
      <Route
        path="/mis-cursos"
        element={
          <ProtectedRoute allowedRoles={['docente']}>
            <DashboardPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Ruta legada */}
      <Route path="/dashboard" element={<Navigate to="/mis-cursos" replace />} />

      <Route
        path="/cursos/:cursoId/asistencia"
        element={
          <ProtectedRoute allowedRoles={['docente']}>
            <AttendancePage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Administrador */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['administrador']}>
            <AdminPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/acceso-denegado" element={
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Acceso denegado</h2>
          <p>Tu cuenta no tiene permisos para acceder a esta sección.</p>
          <button onClick={() => { logout(); navigate('/'); }}>
            Cerrar sesión
          </button>
        </div>
      } />

    </Routes>
  );
};

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
  </GoogleOAuthProvider>
);

export default App;