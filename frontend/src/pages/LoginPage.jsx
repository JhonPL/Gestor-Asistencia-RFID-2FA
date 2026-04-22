// src/pages/LoginPage.jsx
// Cambios respecto al original:
//   1. Importa loginDev de authApi
//   2. ROL_CORREOS mapea el botón al correo del seed en la BD
//   3. handleRoleLogin llama a la API real y propaga errores visibles
//   4. onLogin(token, user) en lugar de onLogin(rol)

import { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import theme from '../styles/theme';
import Icon from '../components/ui/Icon';
import { loginDev } from '../api/authApi';

// ─── Correos que deben existir en la BD (script_bd_v5.sql) ───────────────────
// Si usas correos distintos en el seed, cámbialos aquí.
const ROL_CORREOS = {
  administrador: 'admin@campusucc.edu.co',
  docente: 'mayra.amador@campusucc.edu.co' // cambia por un docente real de tu BD para probar mejor el rol y permisos
};

// ─── Styled (igual que el original) ──────────────────────────────────────────
const fadeIn  = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;
const spin    = keyframes`to{transform:rotate(360deg)}`;
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
const MicrosoftButton = styled.button`
  display:flex;align-items:center;justify-content:center;gap:.875rem;
  width:100%;height:3.5rem;background-color:${theme.colors.surfaceContainerHigh};
  color:${theme.colors.onSurfaceVariant};font-family:${theme.fonts.body};
  font-size:${theme.fontSizes.base};font-weight:${theme.fontWeights.semibold};
  border-radius:${theme.radii.xl};border:1px solid ${theme.colors.outlineVariant}4D;
  cursor:not-allowed;opacity:.6;box-shadow:${theme.shadows.sm};
`;
const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1"  width="9" height="9" fill="#7fba00"/>
    <rect x="1"  y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);
const Spinner = styled.div`
  width:1.125rem;height:1.125rem;border:2px solid rgba(255,255,255,.3);
  border-top-color:white;border-radius:50%;animation:${spin} .7s linear infinite;
`;
const Divider = styled.div`
  position:relative;margin:1.5rem 0;
  &::before{content:'';position:absolute;inset:0;top:50%;height:1px;
    background-color:${theme.colors.outlineVariant}4D;}
`;
const DividerLabel = styled.span`
  position:relative;z-index:1;display:block;text-align:center;
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.semibold};
  text-transform:uppercase;letter-spacing:.12em;color:${theme.colors.outline};
  background-color:${theme.colors.surfaceContainerLowest};
  padding:0 .75rem;width:fit-content;margin:0 auto;
`;
const SimBanner = styled.div`
  background-color:${theme.colors.primaryFixed};border-radius:${theme.radii.lg};
  padding:.75rem 1rem;margin-bottom:1rem;
  display:flex;align-items:center;gap:.5rem;
  font-size:${theme.fontSizes.xs};color:${theme.colors.primary};font-weight:${theme.fontWeights.medium};
`;
const RoleGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:.75rem;`;
const RoleBtn = styled.button`
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:.5rem;padding:1.125rem .75rem;border-radius:${theme.radii.xl};
  border:1px solid ${({ $active }) => $active ? theme.colors.primary : theme.colors.outlineVariant}4D;
  background-color:${({ $active }) => $active ? theme.colors.primaryFixed : 'white'};
  color:${({ $active }) => $active ? theme.colors.primary : theme.colors.onSurfaceVariant};
  font-family:${theme.fonts.body};font-size:${theme.fontSizes.sm};
  font-weight:${theme.fontWeights.semibold};cursor:pointer;
  transition:all ${theme.transitions.base};box-shadow:${theme.shadows.sm};
  &:hover{border-color:${theme.colors.primary}66;background-color:${theme.colors.primaryFixed};color:${theme.colors.primary}}
  ${({ $loading }) => $loading && css`opacity:.5;pointer-events:none;`}
`;
const RoleLabel = styled.span`font-size:${theme.fontSizes.xs};text-transform:uppercase;letter-spacing:.08em;`;
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
const AccessNote = styled.p`
  text-align:center;font-size:${theme.fontSizes.xs};color:${theme.colors.outline};
  margin-top:1.25rem;line-height:1.6;
  strong{color:${theme.colors.onSurfaceVariant};font-weight:${theme.fontWeights.semibold}}
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
  const [loading,    setLoading]    = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [error,      setError]      = useState(null);

  const handleRoleLogin = async (rol) => {
    setLoading(true);
    setActiveRole(rol);
    setError(null);

    try {
      const { token, user } = await loginDev(ROL_CORREOS[rol]);
      // Propaga el token y el usuario al handler de App.jsx
      await onLogin?.(token, user);
    } catch (err) {
      setError(err.message ?? 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
      setActiveRole(null);
    }
  };

  return (
    <Page>
      <BlobTL aria-hidden="true" /><BlobBR aria-hidden="true" />
      <ArchSvg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.3" aria-hidden="true">
        <circle cx="50" cy="50" r="40"/><path d="M50 10V90M10 50H90"/>
        <rect x="20" y="20" width="60" height="60"/><circle cx="50" cy="50" r="20"/>
      </ArchSvg>

      <Main>
        <LogoSection>
          <LogoBox><Icon name="school" size="lg" fill={1} /></LogoBox>
          <AppName>SmartClass</AppName>
          <AppSubtitle>Acceso Institucional · UCC Villavicencio</AppSubtitle>
        </LogoSection>

        <Card>
          <CardTitle>Bienvenido</CardTitle>
          <CardDesc>Usa tu correo <strong>@campusucc.edu.co</strong> para acceder al sistema de gestión de asistencia.</CardDesc>

          <MicrosoftButton disabled title="Pendiente de configuración Azure AD">
            <MicrosoftIcon />
            Iniciar sesión con Microsoft
          </MicrosoftButton>

          <Divider><DividerLabel>o simular acceso</DividerLabel></Divider>

          <SimBanner>
            <Icon name="science" size="sm" />
            Modo simulación — requiere backend activo en {import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}
          </SimBanner>

          {/* Error del backend */}
          {error && (
            <ErrorBanner role="alert">
              <Icon name="error" size="sm" />
              {error}
            </ErrorBanner>
          )}

          <RoleGrid>
            <RoleBtn
              onClick={() => handleRoleLogin('docente')}
              $active={activeRole === 'docente'}
              $loading={loading && activeRole !== 'docente'}
              aria-label="Ingresar como docente"
            >
              {loading && activeRole === 'docente' ? <Spinner /> : <Icon name="school" size="md" />}
              <RoleLabel>Docente</RoleLabel>
            </RoleBtn>

            <RoleBtn
              onClick={() => handleRoleLogin('administrador')}
              $active={activeRole === 'administrador'}
              $loading={loading && activeRole !== 'administrador'}
              aria-label="Ingresar como administrador"
            >
              {loading && activeRole === 'administrador' ? <Spinner /> : <Icon name="admin_panel_settings" size="md" />}
              <RoleLabel>Administrador</RoleLabel>
            </RoleBtn>
          </RoleGrid>

          <AccessNote>Producción: acceso exclusivo con correo <strong>@ucc.edu.co</strong>.</AccessNote>
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
        <QuoteText>"La mente no es un recipiente que llenar, sino un fuego que encender."</QuoteText>
      </AcademicQuote>
    </Page>
  );
};

export default LoginPage;