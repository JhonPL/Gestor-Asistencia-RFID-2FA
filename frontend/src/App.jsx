import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from './styles/GlobalStyles';
import theme from './styles/theme';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

/**
 * App — raíz de la aplicación SmartClass RFID.
 *
 * Responsabilidades:
 * - Proveer el ThemeProvider de styled-components.
 * - Montar GlobalStyles una sola vez.
 * - Definir las rutas principales con react-router-dom v7.
 *
 * El flujo de autenticación Microsoft OAuth se conecta aquí
 * cuando esté disponible el backend; por ahora es un stub.
 */
/** @todo: reemplazar por loginRedirect/loginPopup de @azure/msal-browser */
const handleMicrosoftLogin = async () => {
  await new Promise((r) => setTimeout(r, 1500));
  console.log('[Auth] Flujo Microsoft OAuth — pendiente Azure AD (Client ID + Tenant ID de UCC)');
  alert('Login con Microsoft — pendiente de integración con Azure AD');
};

const App = () => (
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LandingPage onLogin={() => (window.location.href = '/login')} />}
        />
        <Route
          path="/login"
          element={<LoginPage onLogin={handleMicrosoftLogin} />}
        />
        <Route
          path="/dashboard"
          element={<DashboardPage onLogout={() => (window.location.href = '/')} />}
        />
        {/*
         * Rutas protegidas — sprints siguientes:
         * <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
         * <Route path="/cursos/:id/asistencia" element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
         */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;