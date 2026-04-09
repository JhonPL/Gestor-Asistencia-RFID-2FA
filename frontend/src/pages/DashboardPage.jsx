import styled from 'styled-components';
import theme from '../styles/theme';
import AppLayout from '../components/layout/AppLayout';
import CourseCard from '../components/dashboard/CourseCard';
import RecentSessionsWidget from '../components/dashboard/RecentSessionsWidget';
import UpcomingClassWidget from '../components/dashboard/UpcomingClassWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';
import {
  MOCK_DOCENTE,
  MOCK_CURSOS,
  MOCK_SESIONES_RECIENTES,
  MOCK_PROXIMAS_CLASES,
  MOCK_ACCIONES_RAPIDAS,
} from '../mocks/dashboard.mock';

/**
 * DashboardPage — vista principal del docente tras autenticarse.
 *
 * Layout: bento grid de 12 columnas
 *  ├─ Col 1-8: cursos asignados (grid 2 cols en md)
 *  └─ Col 9-12: widgets (sesiones recientes, próximas clases, acciones rápidas)
 *
 * SRP: solo compone las secciones del dashboard.
 * DIP: recibe `onLogout` desde App; no conoce la librería OAuth.
 *
 * @param {Function} onLogout
 */

/* ── Helpers de fecha ── */
const getDayName = () =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long' }).format(new Date());

const getFullDate = () =>
  new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

/* ── Styled Components ── */

const PageHeader = styled.header`
  margin-bottom: 3rem;
`;

const Greeting = styled.h1`
  font-family: ${theme.fonts.headline};
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: ${theme.fontWeights.extrabold};
  color: ${theme.colors.primary};
  letter-spacing: -0.02em;
  margin-bottom: 0.375rem;
`;

const DateLine = styled.p`
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.onSurfaceVariant};
  font-weight: ${theme.fontWeights.medium};
  text-transform: capitalize;
`;

const BentoGrid = styled.div`
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;

  @media (min-width: ${theme.breakpoints.lg}) {
    grid-template-columns: repeat(12, 1fr);
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: ${theme.breakpoints.lg}) {
    grid-column: span 8;
  }
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: ${theme.breakpoints.lg}) {
    grid-column: span 4;
  }
`;

/* ── Sección de cursos ── */
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes['2xl']};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
  letter-spacing: -0.02em;
`;

const SectionLink = styled.a`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.onPrimaryFixedVariant};
  transition: color ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.primary};
    text-decoration: underline;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: ${theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

/* Placeholder "solicitar nuevo curso" */
const AddCoursePlaceholder = styled.button`
  border: 2px dashed ${theme.colors.outlineVariant};
  border-radius: ${theme.radii.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: ${theme.colors.outline};
  background-color: transparent;
  min-height: 10rem;
  transition: all ${theme.transitions.base};

  &:hover {
    background-color: ${theme.colors.surfaceContainerLow};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};

    span:first-child {
      transform: scale(1.1);
    }
  }

  span:first-child {
    transition: transform ${theme.transitions.fast};
  }
`;

const PlaceholderLabel = styled.span`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
`;

/* ── Component ── */

const DashboardPage = ({ onLogout }) => {
  const handleOpenPortal = (course) => {
    console.log('[Nav] Abrir asistencia del curso:', course.id);
    // TODO: navigate(`/cursos/${course.id}/asistencia`)
  };

  const handleQuickAction = (actionId) => {
    console.log('[Action]', actionId);
    // TODO: mapear actionId a navegación o modal
  };

  return (
    <AppLayout user={MOCK_DOCENTE} onLogout={onLogout}>
      {/* Saludo */}
      <PageHeader>
        <Greeting>
          Buenos días, {MOCK_DOCENTE.nombre} {MOCK_DOCENTE.apellido}
        </Greeting>
        <DateLine>
          {getDayName()}, {getFullDate()}
        </DateLine>
      </PageHeader>

      {/* Bento grid */}
      <BentoGrid>
        {/* ── Columna principal: cursos ── */}
        <MainColumn>
          <section>
            <SectionHeader>
              <SectionTitle>Tus cursos asignados</SectionTitle>
              <SectionLink href="/cursos">Ver todos los cursos</SectionLink>
            </SectionHeader>

            <CoursesGrid>
              {MOCK_CURSOS.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onOpenPortal={handleOpenPortal}
                />
              ))}

              {/* Placeholder — solo docentes con permisos para solicitar */}
              <AddCoursePlaceholder aria-label="Solicitar adición de curso">
                <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>
                  add_circle
                </span>
                <PlaceholderLabel>Solicitar curso adicional</PlaceholderLabel>
              </AddCoursePlaceholder>
            </CoursesGrid>
          </section>
        </MainColumn>

        {/* ── Columna lateral: widgets ── */}
        <SideColumn>
          <RecentSessionsWidget
            sessions={MOCK_SESIONES_RECIENTES}
            onViewReport={() => console.log('[Nav] Ver reporte')}
          />

          <UpcomingClassWidget classes={MOCK_PROXIMAS_CLASES} />

          <QuickActionsWidget
            actions={MOCK_ACCIONES_RAPIDAS}
            onAction={handleQuickAction}
          />
        </SideColumn>
      </BentoGrid>
    </AppLayout>
  );
};

export default DashboardPage;