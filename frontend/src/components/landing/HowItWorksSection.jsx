import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * HowItWorksSection — explica el flujo completo del sistema.
 * Usa exactamente los mismos tokens de diseño que el resto de la landing.
 * Se inserta entre HeroSection y CtaSection en LandingPage.jsx.
 */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Section = styled.section`
  padding: 6rem 2rem;
  background-color: ${theme.colors.surfaceContainerLow};
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
`;

const SectionLabel = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: ${theme.colors.secondary};
  text-align: center;
  margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-family: ${theme.fonts.headline};
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  text-align: center;
  letter-spacing: -0.025em;
  margin-bottom: 1rem;
`;

const SectionSub = styled.p`
  font-size: ${theme.fontSizes.lg};
  color: ${theme.colors.onSurfaceVariant};
  text-align: center;
  max-width: 40rem;
  margin: 0 auto 3.5rem;
  line-height: 1.7;
`;

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TabsWrapper = styled.div`
  background-color: ${theme.colors.surfaceContainerLowest};
  border-radius: ${theme.radii['3xl']};
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  overflow: hidden;
`;

const TabsBar = styled.div`
  display: flex;
  border-bottom: 1px solid ${theme.colors.outlineVariant}26;
  overflow-x: auto;
`;

const Tab = styled.button`
  flex: 1;
  min-width: 140px;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.onSurfaceVariant};
  background-color: ${({ $active }) => $active ? theme.colors.primaryFixed : 'transparent'};
  border-bottom: 3px solid ${({ $active }) => $active ? theme.colors.primary : 'transparent'};
  transition: all ${theme.transitions.base};
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background-color: ${theme.colors.surfaceContainerLow};
  }
`;

const TabIconBox = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${theme.radii.lg};
  background-color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.surfaceContainerHigh};
  color: ${({ $active }) => $active ? 'white' : theme.colors.outline};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${theme.transitions.base};
`;

// ── Panel de contenido ────────────────────────────────────────────────────────
const Panel = styled.div`
  display: grid;
  gap: 2.5rem;
  padding: 2.5rem;
  align-items: center;
  grid-template-columns: 1fr;
  animation: ${fadeIn} 0.35s ease both;

  @media (min-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const PanelTitle = styled.h3`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  margin-bottom: 1.25rem;
`;

const StepList = styled.ol`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
`;

const Step = styled.li`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  animation: ${fadeIn} 0.4s ease ${({ $i }) => $i * 80}ms both;
`;

const StepNum = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${theme.colors.primaryFixed};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.fontWeights.bold};
  font-size: ${theme.fontSizes.sm};
`;

const StepBody = styled.div``;

const StepTitle = styled.p`
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.onSurface};
  margin-bottom: 0.25rem;
`;

const StepDesc = styled.p`
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.onSurfaceVariant};
  line-height: 1.6;
`;

// ── Indicadores de progreso ───────────────────────────────────────────────────
const Dots = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const Dot = styled.button`
  height: 0.35rem;
  width: ${({ $active }) => $active ? '2rem' : '0.75rem'};
  border-radius: 999px;
  background-color: ${({ $active }) => $active ? theme.colors.primary : theme.colors.surfaceContainerHigh};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
`;

// ── Visualizaciones ───────────────────────────────────────────────────────────
const VizBox = styled.div`
  background-color: ${theme.colors.surfaceContainerLow};
  border-radius: ${theme.radii['2xl']};
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  min-height: 260px;
`;

const VizIconCircle = styled.div`
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryContainer});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 12px 32px ${theme.colors.primary}33;
`;

const VizRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 260px;
`;

const VizChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.875rem;
  background-color: ${theme.colors.surfaceContainerLowest};
  border-radius: ${theme.radii.lg};
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.onSurface};
  font-weight: ${theme.fontWeights.medium};
  box-shadow: ${theme.shadows.sm};
`;

const VizDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: ${({ $color }) => $color || theme.colors.secondary};
  flex-shrink: 0;
`;

const VizStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
  border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  background-color: ${({ $success }) => $success ? theme.colors.secondaryFixed : theme.colors.primaryFixed};
  color: ${({ $success }) => $success ? theme.colors.secondary : theme.colors.primary};
`;

// ─── Datos ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'docente',
    label: 'Docente abre clase',
    icon: 'badge',
    steps: [
      { title: 'Llega al aula', desc: 'El docente encuentra el lector instalado en la entrada del salón.' },
      { title: 'Pasa su tarjeta RFID', desc: 'El sistema valida que tiene un curso programado en ese aula a esa hora.' },
      { title: 'Sesión activada', desc: 'Se crea una sesión activa. Los estudiantes ya pueden registrar asistencia.' },
    ],
    vizIcon: 'badge',
    vizChips: [
      { dot: theme.colors.secondary, text: 'Tarjeta: A3 2F 1B 09' },
      { dot: theme.colors.secondary, text: 'Docente: Carlos Ramírez' },
      { dot: theme.colors.secondary, text: 'Curso: Ing. de Software II' },
      { dot: theme.colors.secondary, text: 'Aula 305-B · 08:00–10:00' },
    ],
    badge: { text: '✓ Sesión abierta', success: true },
  },
  {
    id: 'estudiante',
    label: 'Estudiante registra',
    icon: 'nfc',
    steps: [
      { title: 'Entra al aula', desc: 'El estudiante pasa su tarjeta en el lector del salón.' },
      { title: 'Validación automática', desc: 'El sistema verifica que está inscrito en el curso y la sesión está activa.' },
      { title: 'Notificación push', desc: 'En segundos le llega una notificación a su celular para confirmar presencia.' },
    ],
    vizIcon: 'nfc',
    vizChips: [
      { dot: theme.colors.primary, text: 'Tarjeta detectada: E5F6' },
      { dot: theme.colors.primary, text: 'Inscripción: verificada' },
      { dot: theme.colors.secondary, text: 'Push enviado al celular' },
    ],
    badge: { text: 'Registro pendiente de 2FA', success: false },
  },
  {
    id: 'biometria',
    label: 'Confirma con biometría',
    icon: 'fingerprint',
    steps: [
      { title: 'Abre la app SmartClass', desc: 'El estudiante toca la notificación y abre la app en su teléfono.' },
      { title: 'Huella o Face ID', desc: 'Android: huella dactilar o reconocimiento facial. iPhone: Face ID.' },
      { title: 'Validación GPS', desc: 'La app verifica que el estudiante está dentro del campus UCC (radio 200m).' },
    ],
    vizIcon: 'fingerprint',
    vizChips: [
      { dot: theme.colors.primary, text: 'Biometría: fingerprint' },
      { dot: theme.colors.secondary, text: 'GPS: dentro del campus' },
      { dot: theme.colors.secondary, text: 'Distancia: 47 metros' },
    ],
    badge: { text: '✓ Segundo factor OK', success: true },
  },
  {
    id: 'confirmado',
    label: 'Asistencia confirmada',
    icon: 'verified',
    steps: [
      { title: 'Registro completado', desc: 'La asistencia queda marcada como "Presente · Verificado" con doble factor.' },
      { title: 'Visible en tiempo real', desc: 'El docente ve en la web quién confirmó, quién está pendiente y quién falta.' },
      { title: 'Docente cierra la sesión', desc: 'Al terminar pasa su tarjeta nuevamente. Los ausentes quedan marcados automáticamente.' },
    ],
    vizIcon: 'task_alt',
    vizChips: [
      { dot: theme.colors.secondary, text: 'Estado: Presente' },
      { dot: theme.colors.secondary, text: 'Verificación: completado' },
      { dot: theme.colors.secondary, text: 'Biometría: ✓  GPS: ✓' },
    ],
    badge: { text: '✓ Asistencia confirmada', success: true },
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────
const HowItWorksSection = () => {
  const [active, setActive] = useState(0);

  // Rotar tabs automáticamente
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % STEPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const current = STEPS[active];

  return (
    <Section id="como-funciona">
      <Container>
        <SectionLabel>Flujo del sistema</SectionLabel>
        <SectionTitle>¿Cómo funciona?</SectionTitle>
        <SectionSub>
          El proceso completo dura menos de 30 segundos. Cuatro pasos simples,
          dos factores de autenticación, cero papel.
        </SectionSub>

        <TabsWrapper>
          {/* Pestañas */}
          <TabsBar>
            {STEPS.map((s, i) => (
              <Tab key={s.id} $active={active === i} onClick={() => setActive(i)}>
                <TabIconBox $active={active === i}>
                  <Icon name={s.icon} size="sm" />
                </TabIconBox>
                {s.label}
              </Tab>
            ))}
          </TabsBar>

          {/* Panel */}
          <Panel key={active}>
            {/* Columna izquierda: pasos */}
            <div>
              <PanelTitle>Paso {active + 1} — {current.label}</PanelTitle>
              <StepList>
                {current.steps.map((step, i) => (
                  <Step key={i} $i={i}>
                    <StepNum>{i + 1}</StepNum>
                    <StepBody>
                      <StepTitle>{step.title}</StepTitle>
                      <StepDesc>{step.desc}</StepDesc>
                    </StepBody>
                  </Step>
                ))}
              </StepList>
              <Dots>
                {STEPS.map((_, i) => (
                  <Dot key={i} $active={active === i} onClick={() => setActive(i)} />
                ))}
              </Dots>
            </div>

            {/* Columna derecha: visualización */}
            <VizBox>
              <VizIconCircle>
                <Icon name={current.vizIcon} size="lg" />
              </VizIconCircle>
              <VizRow>
                {current.vizChips.map((chip, i) => (
                  <VizChip key={i}>
                    <VizDot $color={chip.dot} />
                    {chip.text}
                  </VizChip>
                ))}
              </VizRow>
              <VizStatusBadge $success={current.badge.success}>
                <Icon name={current.badge.success ? 'check_circle' : 'schedule'} size="sm" />
                {current.badge.text}
              </VizStatusBadge>
            </VizBox>
          </Panel>
        </TabsWrapper>
      </Container>
    </Section>
  );
};

export default HowItWorksSection;