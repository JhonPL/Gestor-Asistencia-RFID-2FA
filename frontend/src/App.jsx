import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from './styles/GlobalStyles';
import theme from './styles/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import AdminPage from './pages/AdminPage';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to={user.rol === 'administrador' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

const AppRoutes = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleLogin = async (rol) => {
    login(rol);
    navigate(rol === 'administrador' ? '/admin' : '/dashboard', { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLogin={() => navigate('/login')} />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute allowedRoles={['docente']}>
            <DashboardPage onLogout={handleLogout} />
          </PrivateRoute>
        }
      />
      <Route
        path="/cursos/:cursoId/asistencia"
        element={
          <PrivateRoute allowedRoles={['docente']}>
            <AttendancePage onLogout={handleLogout} />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <AdminPage onLogout={handleLogout} />
          </PrivateRoute>
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