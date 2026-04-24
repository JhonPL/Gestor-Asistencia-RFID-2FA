import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import AppLayout from '../components/layout/AppLayout';
import CourseCard from '../components/dashboard/CourseCard';
import UpcomingClassWidget from '../components/dashboard/UpcomingClassWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';
import { MOCK_ACCIONES_RAPIDAS } from '../mocks/dashboard.mock';

const getDayName  = () => new Intl.DateTimeFormat('es-CO', { weekday: 'long' }).format(new Date());
const getFullDate = () => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

const PageHeader = styled.header`margin-bottom:3rem;`;
const Greeting = styled.h1`
  font-family:${theme.fonts.headline};
  font-size:clamp(1.75rem,3vw,2.5rem);font-weight:${theme.fontWeights.extrabold};
  color:${theme.colors.primary};letter-spacing:-.02em;margin-bottom:.375rem;
`;
const DateLine = styled.p`
  font-size:${theme.fontSizes.base};color:${theme.colors.onSurfaceVariant};
  font-weight:${theme.fontWeights.medium};text-transform:capitalize;
`;
const BentoGrid = styled.div`
  display:grid;gap:2rem;grid-template-columns:1fr;
  @media(min-width:${theme.breakpoints.lg}){grid-template-columns:repeat(12,1fr)}
`;
const MainColumn = styled.div`
  display:flex;flex-direction:column;gap:2rem;
  @media(min-width:${theme.breakpoints.lg}){grid-column:span 8}
`;
const SideColumn = styled.div`
  display:flex;flex-direction:column;gap:2rem;
  @media(min-width:${theme.breakpoints.lg}){grid-column:span 4}
`;
const SectionHeader = styled.div`
  display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:1.5rem;
`;
const SectionTitle = styled.h2`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes['2xl']};
  font-weight:${theme.fontWeights.bold};color:${theme.colors.primary};letter-spacing:-.02em;
`;
const CoursesGrid = styled.div`
  display:grid;grid-template-columns:1fr;gap:1.5rem;
  @media(min-width:${theme.breakpoints.md}){grid-template-columns:repeat(2,1fr)}
`;
const AddCoursePlaceholder = styled.button`
  border:2px dashed ${theme.colors.outlineVariant};border-radius:${theme.radii.xl};
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:.5rem;padding:1.5rem;color:${theme.colors.outline};
  background-color:transparent;min-height:10rem;
  transition:all ${theme.transitions.base};
  &:hover{background-color:${theme.colors.surfaceContainerLow};border-color:${theme.colors.primary};color:${theme.colors.primary}}
`;

const DashboardPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { cursos, sesionesRecientes, proximasClases, loading } = useDashboard(token);

  const handleOpenPortal = (course) => navigate(`/cursos/${course.id}/asistencia`);
  
  const handleQuickAction = (id) => {
    if (id === 'justify') {
      alert('Justificar ausencias — próximamente. Puedes hacerlo desde el detalle del curso.');
    } else if (id === 'export') {
      alert('Exportar asistencia — próximamente. Puedes exportar desde el detalle del curso.');
    } else if (id === 'students') {
      if (cursos.length === 0) {
        alert('No tienes cursos asignados.');
        return;
      }
      if (cursos.length === 1) {
        handleOpenPortal(cursos[0]);
      } else {
        alert('Selecciona un curso desde la lista para ver sus estudiantes.');
      }
    } else if (id === 'sessions') {
      alert('Historial de sesiones — próximamente.');
    }
  };

  if (loading) {
    return (
      <AppLayout user={user} onLogout={onLogout}>
        <PageHeader>
          <Greeting>Buenos días, {user?.nombre} {user?.apellido}</Greeting>
          <DateLine>{getDayName()}, {getFullDate()}</DateLine>
        </PageHeader>
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.colors.onSurfaceVariant }}>
          Cargando dashboard...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <PageHeader>
        <Greeting>Buenos días, {user?.nombre} {user?.apellido}</Greeting>
        <DateLine>{getDayName()}, {getFullDate()}</DateLine>
      </PageHeader>

      <BentoGrid>
        <MainColumn>
          <section>
            <SectionHeader>
              <SectionTitle>Tus cursos asignados</SectionTitle>
            </SectionHeader>
            <CoursesGrid>
              {cursos.map(course => (
                <CourseCard key={course.id} course={course} onOpenPortal={handleOpenPortal} />
              ))}
            </CoursesGrid>
          </section>
        </MainColumn>

        <SideColumn>
          <UpcomingClassWidget classes={proximasClases} />
          <QuickActionsWidget actions={MOCK_ACCIONES_RAPIDAS} onAction={handleQuickAction} />
        </SideColumn>
      </BentoGrid>
    </AppLayout>
  );
};

export default DashboardPage;