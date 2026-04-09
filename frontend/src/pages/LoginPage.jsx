import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import theme from '../styles/theme';
import Icon from '../components/ui/Icon';

/**
 * LoginPage — página de autenticación institucional.
 *
 * No hay formulario de email/password: la autenticación es 100% Microsoft OAuth.
 * Esta página existe para:
 *  1. Ser la `redirect_uri` configurada en Azure AD.
 *  2. Gestionar el estado de carga/error del flujo OAuth.
 *  3. Dar un punto de entrada claro al sistema.
 *
 * SRP: solo orquesta el inicio del flujo de autenticación.
 * DIP: recibe `onLogin` desde App; no importa qué librería OAuth se use.
 *
 * @param {Function} onLogin  - dispara loginPopup() o loginRedirect() de MSAL
 * @param {string}   [error]  - mensaje de error proveniente del proceso OAuth
 */

/* ── Animaciones ── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const blobFloat = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-20px) scale(1.05); }
`;

/* ── Layout ── */
const Page = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: ${theme.colors.surface};
  overflow: hidden;
`;

/* ── Decoración de fondo ── */
const BlobTopLeft = styled.div`
  position: absolute;
  top: -10%;
  left: -10%;
  width: 40%;
  height: 40%;
  background-color: ${theme.colors.primaryContainer};
  opacity: 0.05;
  border-radius: 50%;
  filter: blur(120px);
  animation: ${blobFloat} 10s ease infinite;
  pointer-events: none;
`;

const BlobBottomRight = styled.div`
  position: absolute;
  bottom: -10%;
  right: -10%;
  width: 50%;
  height: 50%;
  background-color: ${theme.colors.secondaryContainer};
  opacity: 0.08;
  border-radius: 50%;
  filter: blur(150px);
  animation: ${blobFloat} 14s ease infinite 4s;
  pointer-events: none;
`;

const ArchSvg = styled.svg`
  position: absolute;
  top: 5rem;
  right: 5rem;
  width: 18rem;
  height: 18rem;
  color: ${theme.colors.primaryContainer};
  opacity: 0.07;
  pointer-events: none;

  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

/* ── Contenido principal ── */
const Main = styled.main`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 28rem;
  animation: ${fadeIn} 0.6s ease both;
`;

/* ── Logo ── */
const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 3rem;
`;

const LogoBox = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: ${theme.colors.primary};
  border-radius: ${theme.radii.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 20px 40px -8px ${theme.colors.primary}33;
  color: white;
`;

const AppName = styled.h1`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.extrabold};
  color: ${theme.colors.primary};
  letter-spacing: -0.03em;
`;

const AppSubtitle = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: ${theme.colors.outline};
  margin-top: 0.5rem;
`;

/* ── Tarjeta de login ── */
const Card = styled.div`
  background-color: ${theme.colors.surfaceContainerLowest};
  border-radius: ${theme.radii.xl};
  padding: 2.5rem;
  box-shadow: 0 40px 100px -20px rgba(26, 35, 126, 0.07);
  /* Ghost border — según DESIGN.md nunca al 100% de opacidad */
  border: 1px solid ${theme.colors.outlineVariant}26;
  backdrop-filter: blur(8px);
`;

const CardTitle = styled.h2`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
`;

const CardDescription = styled.p`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.onSurfaceVariant};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

/* ── Botón Microsoft ── */
const MicrosoftButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  width: 100%;
  height: 3.5rem;
  background-color: ${theme.colors.primary};
  color: ${theme.colors.onPrimary};
  font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.base};
  font-weight: ${theme.fontWeights.semibold};
  border-radius: ${theme.radii.xl};
  border: none;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  opacity: ${({ $loading }) => ($loading ? 0.75 : 1)};
  box-shadow: 0 4px 24px -4px ${theme.colors.primary}44;
  transition: all ${theme.transitions.base};

  &:hover:not(:disabled) {
    box-shadow: 0 8px 32px -4px ${theme.colors.primary}55;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const Spinner = styled.div`
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

/* ── Ícono SVG de Microsoft (oficial) ── */
const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1"  width="9" height="9" fill="#7fba00"/>
    <rect x="1"  y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

/* ── Nota de acceso ── */
const AccessNote = styled.p`
  text-align: center;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.outline};
  margin-top: 1.25rem;
  line-height: 1.6;

  strong {
    color: ${theme.colors.onSurfaceVariant};
    font-weight: ${theme.fontWeights.semibold};
  }
`;

/* ── Mensaje de error ── */
const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background-color: ${theme.colors.errorContainer};
  color: ${theme.colors.onErrorContainer};
  border-radius: ${theme.radii.lg};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  margin-bottom: 1.5rem;
`;

/* ── Footer ── */
const PageFooter = styled.footer`
  text-align: center;
  margin-top: 3rem;
`;

const FooterText = styled.p`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.outline};
  text-transform: uppercase;
  letter-spacing: 0.12em;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const FooterLink = styled.a`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.onSurfaceVariant};
  opacity: 0.6;
  transition: all ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.primary};
    opacity: 1;
  }
`;

/* ── Cita decorativa (solo desktop) ── */
const AcademicQuote = styled.div`
  display: none;
  position: absolute;
  bottom: 3rem;
  right: 3rem;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;

  @media (min-width: ${theme.breakpoints.lg}) {
    display: flex;
  }
`;

const QuoteText = styled.p`
  font-family: ${theme.fonts.headline};
  font-style: italic;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.onSurfaceVariant};
  opacity: 0.35;
  max-width: 14rem;
  line-height: 1.6;
`;

/* ── Component ── */

const LoginPage = ({ onLogin, error }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await onLogin?.();
    } finally {
      // Si falla, MSAL lanza error que el padre captura.
      // El padre decide si actualiza `error` prop.
      setLoading(false);
    }
  };

  return (
    <Page>
      {/* Decoración */}
      <BlobTopLeft aria-hidden="true" />
      <BlobBottomRight aria-hidden="true" />

      <ArchSvg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.3"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="40" />
        <path d="M50 10V90M10 50H90" />
        <rect x="20" y="20" width="60" height="60" />
        <circle cx="50" cy="50" r="20" />
      </ArchSvg>

      <Main>
        {/* Logo */}
        <LogoSection>
          <LogoBox aria-hidden="true">
            <Icon name="school" size="lg" fill={1} />
          </LogoBox>
          <AppName>SmartClass</AppName>
          <AppSubtitle>Acceso Institucional · UCC Villavicencio</AppSubtitle>
        </LogoSection>

        {/* Tarjeta */}
        <Card>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Usa tu correo institucional <strong>@ucc.edu.co</strong> para
            acceder al sistema de gestión de asistencia.
          </CardDescription>

          {/* Error OAuth */}
          {error && (
            <ErrorBanner role="alert">
              <Icon name="error" size="sm" />
              {error}
            </ErrorBanner>
          )}

          {/* Botón único de autenticación */}
          <MicrosoftButton
            onClick={handleLogin}
            disabled={loading}
            $loading={loading}
            aria-label="Iniciar sesión con Microsoft"
          >
            {loading ? (
              <>
                <Spinner aria-hidden="true" />
                Autenticando…
              </>
            ) : (
              <>
                <MicrosoftIcon />
                Iniciar sesión con Microsoft
              </>
            )}
          </MicrosoftButton>

          <AccessNote>
            Solo cuentas <strong>@ucc.edu.co</strong> tienen acceso.
            <br />
            Si no puedes ingresar, contacta al área de sistemas.
          </AccessNote>
        </Card>

        {/* Footer */}
        <PageFooter>
          <FooterText>
            © {new Date().getFullYear()} SmartClass RFID · Universidad
            Cooperativa de Colombia
          </FooterText>
          <FooterLinks>
            <FooterLink href="#">Privacidad Institucional</FooterLink>
            <FooterLink href="#">Soporte Técnico</FooterLink>
          </FooterLinks>
        </PageFooter>
      </Main>

      {/* Cita decorativa desktop */}
      <AcademicQuote aria-hidden="true">
        <Icon
          name="history_edu"
          size="xl"
          style={{ color: `${theme.colors.primaryContainer}33`, marginBottom: '0.5rem' }}
        />
        <QuoteText>
          "La mente no es un recipiente que llenar, sino un fuego que encender."
        </QuoteText>
      </AcademicQuote>
    </Page>
  );
};

export default LoginPage;