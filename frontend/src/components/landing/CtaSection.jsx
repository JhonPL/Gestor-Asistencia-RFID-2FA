import styled, { keyframes } from 'styled-components';
import theme from '../../styles/theme';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

/**
 * CtaSection — bloque final de la landing con call-to-action de login.
 * SRP: muestra la invitación a entrar al sistema.
 * OCP: recibe `onLogin` para desacoplar la lógica de autenticación.
 *
 * @param {Function} onLogin - dispara el flujo Microsoft OAuth
 */

/* ── Animaciones ── */
const glow = keyframes`
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.35; }
`;

/* ── Styled Components ── */

const Section = styled.section`
  padding: 8rem 2rem;
  background-color: white;

  @media (min-width: ${theme.breakpoints.md}) {
    padding: 8rem 2rem;
  }
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

const Card = styled.div`
  position: relative;
  background-color: ${theme.colors.primary};
  color: white;
  border-radius: ${theme.radii['4xl']};
  padding: 4rem 2rem;
  overflow: hidden;
  text-align: center;

  @media (min-width: ${theme.breakpoints.md}) {
    padding: 6rem;
  }
`;

const BlobTopRight = styled.div`
  position: absolute;
  top: -6rem;
  right: -6rem;
  width: 24rem;
  height: 24rem;
  background-color: ${theme.colors.secondary};
  opacity: 0.15;
  border-radius: 50%;
  filter: blur(80px);
  animation: ${glow} 6s ease infinite;
`;

const BlobBottomLeft = styled.div`
  position: absolute;
  bottom: -6rem;
  left: -6rem;
  width: 24rem;
  height: 24rem;
  background-color: ${theme.colors.primaryContainer};
  opacity: 0.25;
  border-radius: 50%;
  filter: blur(80px);
  animation: ${glow} 6s ease infinite 3s;
`;

const Inner = styled.div`
  position: relative;
  z-index: 10;
  max-width: 40rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const Heading = styled.h2`
  font-family: ${theme.fonts.headline};
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: ${theme.fontWeights.bold};
  line-height: 1.15;
  letter-spacing: -0.02em;
`;

const Subtext = styled.p`
  font-size: ${theme.fontSizes.lg};
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.7;
  max-width: 34rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;

  @media (min-width: ${theme.breakpoints.sm}) {
    flex-direction: row;
  }
`;

const Disclaimer = styled.p`
  font-size: ${theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 0.5rem;
`;

/* ── Component ── */

const CtaSection = ({ onLogin }) => (
  <Section id="login">
    <Container>
      <Card>
        <BlobTopRight aria-hidden="true" />
        <BlobBottomLeft aria-hidden="true" />

        <Inner>
          <Heading>
            Empieza a gestionar
            <br />
            tu asistencia hoy.
          </Heading>

          <Subtext>
            Accede con tu correo institucional de la UCC y controla
            la asistencia de tus cursos en tiempo real desde cualquier
            dispositivo.
          </Subtext>

          <ButtonGroup>
            <Button variant="light" size="lg" onClick={onLogin}>
              <Icon name="login" size="sm" />
              Iniciar con Microsoft
            </Button>
          </ButtonGroup>

          <Disclaimer>Acceso exclusivo con correo @ucc.edu.co</Disclaimer>
        </Inner>
      </Card>
    </Container>
  </Section>
);

export default CtaSection;