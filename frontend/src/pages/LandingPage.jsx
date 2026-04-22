import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import CtaSection from '../components/landing/CtaSection';

/**
 * LandingPage — igual que el original, con una sola adición:
 * HowItWorksSection entre HeroSection y CtaSection.
 */

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

        {/* ← NUEVO: sección "Cómo funciona" con flujo interactivo */}
        <HowItWorksSection />

        <CtaSection onLogin={handleLogin} />
      </main>

      <Footer />
    </>
  );
};

export default LandingPage;