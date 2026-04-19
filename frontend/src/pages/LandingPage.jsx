import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import CtaSection from '../components/landing/CtaSection';

/**
 * LandingPage — página de bienvenida del sistema SmartClass RFID.
 *
 * SRP: solo compone las secciones de la landing; no gestiona lógica de negocio.
 * DIP: recibe `onLogin` desde App, que decidirá qué librería OAuth usar.
 *
 * Estructura:
 *  ┌─ Navbar
 *  ├─ HeroSection
 *  ├─ CtaSection (login)
 *  └─ Footer
 *
 * @param {Function} onLogin - callback de autenticación Microsoft OAuth
 */

/** Mock de sesión activa para el DashboardPreview de la hero */
const MOCK_SESSION = {
  courseName: 'Ingeniería de Software II',
  room: 'Aula 305-B',
  attendanceRate: 82,
  activeCount: 18,
  totalStudents: 22,
};

const scrollToLogin = () => {
  const el = document.getElementById('login');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

const LandingPage = ({ onLogin }) => {
  const handleLogin = onLogin ?? (() => console.warn('onLogin no está configurado'));

  return (
    <>
      <Navbar onLogin={scrollToLogin} />

      <main>
        <HeroSection
          onGetStarted={scrollToLogin}
          sessionData={MOCK_SESSION}
        />
        <CtaSection onLogin={handleLogin} />
      </main>

      <Footer />
    </>
  );
};

export default LandingPage;