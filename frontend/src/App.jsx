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

const AppRoutes = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleLogin = async (rol) => {
    login(rol);
    navigate(rol === 'administrador' ? '/admin' : '/mis-cursos', { replace: true });
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

      {/* Ruta legada — redirige silenciosamente */}
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
    </Routes>
  );
};

const App = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;