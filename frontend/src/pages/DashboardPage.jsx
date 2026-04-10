import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import CourseCard from '../components/dashboard/CourseCard';
import RecentSessionsWidget from '../components/dashboard/RecentSessionsWidget';
import UpcomingClassWidget from '../components/dashboard/UpcomingClassWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';
import {
  MOCK_CURSOS, MOCK_SESIONES_RECIENTES,
  MOCK_PROXIMAS_CLASES, MOCK_ACCIONES_RAPIDAS,
} from '../mocks/dashboard.mock';

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
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const handleOpenPortal = (course) => navigate(`/cursos/${course.id}/asistencia`);
  const handleQuickAction = (id) => {
    if (id === 'sessions') navigate('/cursos/1/asistencia');
  };

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
              {MOCK_CURSOS.map(course => (
                <CourseCard key={course.id} course={course} onOpenPortal={handleOpenPortal} />
              ))}
              <AddCoursePlaceholder aria-label="Solicitar curso adicional">
                <span className="material-symbols-outlined" style={{fontSize:'2rem'}}>add_circle</span>
                <span style={{fontSize:theme.fontSizes.sm,fontWeight:theme.fontWeights.semibold}}>Solicitar curso adicional</span>
              </AddCoursePlaceholder>
            </CoursesGrid>
          </section>
        </MainColumn>

        <SideColumn>
          <RecentSessionsWidget
            sessions={MOCK_SESIONES_RECIENTES}
            onViewReport={() => navigate('/cursos/1/asistencia')}
          />
          <UpcomingClassWidget classes={MOCK_PROXIMAS_CLASES} />
          <QuickActionsWidget actions={MOCK_ACCIONES_RAPIDAS} onAction={handleQuickAction} />
        </SideColumn>
      </BentoGrid>
    </AppLayout>
  );
};

export default DashboardPage;