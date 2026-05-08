// src/pages/LoginPage.jsx
// Login con OAuth 2.0 de Google
// Autenticación segura: usuario → Google → Backend JWT → App

import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { GoogleLogin } from '@react-oauth/google';
import theme from '../styles/theme';
import Icon from '../components/ui/Icon';
import { loginWithGoogle } from '../api/authApi';

// ─── Styled (igual que el original) ──────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const blobFloat = keyframes`0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.05)}`;

const Page = styled.div`
  position:relative;min-height:100vh;display:flex;align-items:center;
  justify-content:center;padding:1.5rem;
  background-color:${theme.colors.surface};overflow:hidden;
`;
const BlobTL = styled.div`
  position:absolute;top:-10%;left:-10%;width:40%;height:40%;
  background-color:${theme.colors.primaryContainer};opacity:.05;border-radius:50%;
  filter:blur(120px);animation:${blobFloat} 10s ease infinite;pointer-events:none;
`;
const BlobBR = styled.div`
  position:absolute;bottom:-10%;right:-10%;width:50%;height:50%;
  background-color:${theme.colors.secondaryContainer};opacity:.08;border-radius:50%;
  filter:blur(150px);animation:${blobFloat} 14s ease infinite 4s;pointer-events:none;
`;
const ArchSvg = styled.svg`
  position:absolute;top:5rem;right:5rem;width:18rem;height:18rem;
  color:${theme.colors.primaryContainer};opacity:.07;pointer-events:none;
  @media(max-width:${theme.breakpoints.md}){display:none}
`;
const Main = styled.main`
  position:relative;z-index:10;width:100%;max-width:28rem;
  animation:${fadeIn} .6s ease both;
`;
const LogoSection = styled.div`display:flex;flex-direction:column;align-items:center;margin-bottom:3rem;`;
const LogoBox = styled.div`
  width:4rem;height:4rem;background-color:${theme.colors.primary};
  border-radius:${theme.radii.lg};display:flex;align-items:center;justify-content:center;
  margin-bottom:1.5rem;box-shadow:0 20px 40px -8px ${theme.colors.primary}33;color:white;
`;
const AppName = styled.h1`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes['3xl']};
  font-weight:${theme.fontWeights.extrabold};color:${theme.colors.primary};letter-spacing:-.03em;
`;
const AppSubtitle = styled.p`
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.semibold};
  text-transform:uppercase;letter-spacing:.2em;color:${theme.colors.outline};margin-top:.5rem;
`;
const Card = styled.div`
  background-color:${theme.colors.surfaceContainerLowest};border-radius:${theme.radii.xl};
  padding:2.5rem;box-shadow:0 40px 100px -20px rgba(26,35,126,.07);
  border:1px solid ${theme.colors.outlineVariant}26;backdrop-filter:blur(8px);
`;
const CardTitle = styled.h2`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes['2xl']};
  font-weight:${theme.fontWeights.bold};color:${theme.colors.primary};
  margin-bottom:.5rem;letter-spacing:-.02em;
`;
const CardDesc = styled.p`
  font-size:${theme.fontSizes.sm};color:${theme.colors.onSurfaceVariant};
  line-height:1.6;margin-bottom:1.75rem;
  strong{color:${theme.colors.onSurface};font-weight:${theme.fontWeights.semibold}}
`;
const GoogleButtonContainer = styled.div`
  width: 100%;
  margin-bottom: 1.5rem;
  
  .google-button-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  
  [role="button"] {
    height: 3.5rem !important;
    width: 100% !important;
    border-radius: ${theme.radii.xl} !important;
  }
  
  svg, span {
    height: 1.25rem !important;
  }
`;
const ErrorBanner = styled.div`
  background-color:${theme.colors.errorContainer};
  color:${theme.colors.error};
  border-radius:${theme.radii.lg};
  padding:.75rem 1rem;
  font-size:${theme.fontSizes.sm};
  font-weight:${theme.fontWeights.medium};
  margin-bottom:1rem;
  display:flex;
  align-items:center;
  gap:.5rem;
`;
const SuccessBanner = styled.div`
  background-color:${theme.colors.tertiaryContainer};
  color:${theme.colors.tertiary};
  border-radius:${theme.radii.lg};
  padding:.75rem 1rem;
  font-size:${theme.fontSizes.sm};
  font-weight:${theme.fontWeights.medium};
  margin-bottom:1rem;
  display:flex;
  align-items:center;
  gap:.5rem;
`;
const PageFooter = styled.footer`text-align:center;margin-top:3rem;`;
const FooterText = styled.p`font-size:${theme.fontSizes.xs};color:${theme.colors.outline};text-transform:uppercase;letter-spacing:.12em;`;
const FooterLinks = styled.div`display:flex;justify-content:center;gap:1.5rem;margin-top:1rem;`;
const FooterLink = styled.a`
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.semibold};
  color:${theme.colors.onSurfaceVariant};opacity:.6;transition:all ${theme.transitions.fast};
  &:hover{color:${theme.colors.primary};opacity:1}
`;
const AcademicQuote = styled.div`
  display:none;position:absolute;bottom:3rem;right:3rem;
  flex-direction:column;align-items:flex-end;text-align:right;
  @media(min-width:${theme.breakpoints.lg}){display:flex}
`;
const QuoteText = styled.p`
  font-family:${theme.fonts.headline};font-style:italic;font-size:${theme.fontSizes.xs};
  color:${theme.colors.onSurfaceVariant};opacity:.35;max-width:14rem;line-height:1.6;
`;

// ─── Componente ───────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      setSuccess('Autenticando con Google...');
      const { token, user } = await loginWithGoogle(credentialResponse.credential);
      setSuccess(`¡Bienvenido ${user.nombre}!`);

      // Pequeña pausa para mostrar el mensaje de éxito
      setTimeout(() => {
        onLogin?.(token, user);
      }, 800);
    } catch (err) {
      setError(err.message ?? 'Error al autenticar con Google');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('No se pudo completar la autenticación con Google');
    setSuccess(null);
    setLoading(false);
  };


  return (
    <Page>
      <BlobTL aria-hidden="true" /><BlobBR aria-hidden="true" />
      <ArchSvg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.3" aria-hidden="true">
        <circle cx="50" cy="50" r="40" /><path d="M50 10V90M10 50H90" />
        <rect x="20" y="20" width="60" height="60" /><circle cx="50" cy="50" r="20" />
      </ArchSvg>

      <Main>
        <LogoSection>
          <LogoBox><Icon name="school" size="lg" fill={1} /></LogoBox>
          <AppName>SmartClass</AppName>
          <AppSubtitle>Gestión de Asistencia · UCC Villavicencio</AppSubtitle>
        </LogoSection>

        <Card>
          <CardTitle>Acceso al Sistema</CardTitle>
          <CardDesc>Inicia sesión con tu cuenta de <strong>Google</strong> para acceder a SmartClass.</CardDesc>

          {/* Mensajes */}
          {error && (
            <ErrorBanner role="alert">
              <Icon name="error" size="sm" />
              {error}
            </ErrorBanner>
          )}

          {success && (
            <SuccessBanner role="status">
              <Icon name="check_circle" size="sm" />
              {success}
            </SuccessBanner>
          )}

          {/* Google OAuth */}
          <GoogleButtonContainer>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin"
              locale="es_ES"
              disabled={loading}
            />
          </GoogleButtonContainer>
        </Card>

        <PageFooter>
          <FooterText>© {new Date().getFullYear()} SmartClass RFID · Universidad Cooperativa de Colombia</FooterText>
          <FooterLinks>
            <FooterLink href="#">Privacidad</FooterLink>
            <FooterLink href="#">Soporte</FooterLink>
          </FooterLinks>
        </PageFooter>
      </Main>

      <AcademicQuote aria-hidden="true">
        <Icon name="history_edu" size="xl" style={{ color: `${theme.colors.primaryContainer}33`, marginBottom: '.5rem' }} />
        <QuoteText>"La educación es la herramienta más poderosa para cambiar el mundo."</QuoteText>
      </AcademicQuote>
    </Page>
  );
};

export default LoginPage;