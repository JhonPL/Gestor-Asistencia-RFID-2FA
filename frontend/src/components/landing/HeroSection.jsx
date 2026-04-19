import styled, { keyframes } from 'styled-components';
import theme from '../../styles/theme';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import DashboardPreview from './DashboardPreview';

/**
 * HeroSection — bloque principal de la landing.
 * SRP: composición del hero con copy + imagen de fondo + tarjeta de preview.
 * OCP: `onGetStarted` permite inyectar la acción de CTA desde el padre.
 *
 * @param {Function} onGetStarted - scroll al CTA o apertura del login
 * @param {object}   sessionData  - datos del mock que se pasan al DashboardPreview
 */

/* ── Animaciones ── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Styled Components ── */

const Section = styled.section`
  position: relative;
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: ${theme.colors.surfaceContainer};
`;

const BackgroundImage = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.15;
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    ${theme.colors.surface} 0%,
    ${theme.colors.surface}cc 50%,
    transparent 100%
  );
`;

const Container = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 5rem 2rem;
  display: grid;
  align-items: center;
  gap: 3rem;

  @media (min-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
    padding: 5rem 2rem;
  }
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeIn} 0.7s ease both;
`;

const EyebrowBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  background-color: ${theme.colors.primaryFixed};
  color: ${theme.colors.primary};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: ${theme.radii.full};
  width: fit-content;
`;

const Heading = styled.h1`
  font-family: ${theme.fonts.headline};
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

const HeadingLight = styled.span`
  font-style: italic;
  font-weight: ${theme.fontWeights.light};
  color: ${theme.colors.onPrimaryContainer};
`;

const Description = styled.p`
  font-size: ${theme.fontSizes.lg};
  color: ${theme.colors.onSurfaceVariant};
  max-width: 36rem;
  line-height: 1.7;
`;

const FeaturePills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const FeaturePill = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  background-color: ${theme.colors.surfaceContainerHigh};
  border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.onSurfaceVariant};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;

  @media (min-width: ${theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
  }
`;

const PreviewWrapper = styled.div`
  display: none;
  position: relative;

  @media (min-width: ${theme.breakpoints.lg}) {
    display: block;
  }
`;

const DecorativeBlob = styled.div`
  position: absolute;
  top: -3rem;
  right: -3rem;
  width: 16rem;
  height: 16rem;
  background-color: ${theme.colors.primaryContainer};
  opacity: 0.05;
  border-radius: 50%;
  filter: blur(48px);
  z-index: -1;
`;

/* ── Datos de las feature pills ── */
const FEATURES = [
  { icon: 'contactless', label: 'Tarjetas RFID' },
  { icon: 'fingerprint', label: 'Biometría' },
  { icon: 'location_on', label: 'Validación GPS' },
  { icon: 'notifications', label: 'Push notifications' },
];

/* ── Component ── */

const HeroSection = ({ onGetStarted, sessionData }) => (
  <Section>
    {/* Fondo */}
    <BackgroundImage aria-hidden="true">
      <img
        src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80"
        alt="Salón de clases universitario"
        loading="eager"
      />
    </BackgroundImage>
    <GradientOverlay aria-hidden="true" />

    <Container>
      {/* Columna izquierda: copy */}
      <Copy>
        <EyebrowBadge>
          <Icon name="school" size="sm" />
          Universidad Cooperativa de Colombia
        </EyebrowBadge>

        <Heading>
          Control de <br />
          <HeadingLight>Asistencia.</HeadingLight>
        </Heading>

        <Description>
          Plataforma inteligente para que los docentes gestionen la asistencia
          con tarjetas RFID y segundo factor biométrico. Simple, seguro y
          en tiempo real.
        </Description>

        {/* Pills de características */}
        <FeaturePills>
          {FEATURES.map(({ icon, label }) => (
            <FeaturePill key={label}>
              <Icon name={icon} size="sm" />
              {label}
            </FeaturePill>
          ))}
        </FeaturePills>

        {/* CTA */}
        <Actions>
          <Button size="lg" onClick={onGetStarted}>
            Iniciar sesión
            <Icon name="arrow_forward" size="sm" />
          </Button>
        </Actions>
      </Copy>

      {/* Columna derecha: preview del dashboard */}
      <PreviewWrapper aria-hidden="true">
        <DashboardPreview sessionData={sessionData} />
        <DecorativeBlob />
      </PreviewWrapper>
    </Container>
  </Section>
);

export default HeroSection;