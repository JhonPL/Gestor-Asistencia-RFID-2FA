import styled, { keyframes } from 'styled-components';
import theme from '../../styles/theme';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';

/**
 * DashboardPreview — tarjeta decorativa que muestra un mock de sesión activa.
 * SRP: solo renderiza la vista previa del dashboard.
 * OCP: recibe `sessionData` como prop para ser personalizable.
 *
 * @param {{ courseName: string, attendanceRate: number, students: number, activeCount: number }} sessionData
 */

/* ── Animaciones ── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
`;

/* ── Styled Components ── */

const Card = styled.div`
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: ${theme.radii['3xl']};
  padding: 2rem;
  box-shadow: ${theme.shadows['2xl']};
  position: relative;
  z-index: 20;
  animation: ${fadeUp} 0.8s ease 0.3s both;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
`;

const SessionLabel = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.outline};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
`;

const CourseName = styled.h3`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
`;

const LiveDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${theme.colors.secondary};
  animation: ${pulse} 2s ease infinite;
  margin-right: 0.25rem;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.onSurfaceVariant};
  margin-bottom: 0.5rem;
`;

const StatValue = styled.span`
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primary};
`;

const ProgressTrack = styled.div`
  height: 0.5rem;
  background-color: ${theme.colors.surfaceContainer};
  border-radius: ${theme.radii.full};
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.secondaryContainer});
  border-radius: ${theme.radii.full};
  width: ${({ $percent }) => $percent}%;
  transition: width 1s ease;
`;

const StudentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
`;

const StudentSlot = styled.div`
  height: 3.5rem;
  border-radius: ${theme.radii.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $empty }) =>
    $empty ? 'transparent' : theme.colors.surfaceContainerLow};
  border: ${({ $empty }) =>
    $empty ? `2px dashed ${theme.colors.outlineVariant}` : 'none'};
  color: ${({ $empty }) =>
    $empty ? theme.colors.outline : theme.colors.primary};
  transition: transform ${theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid ${theme.colors.outlineVariant};
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.outline};
`;

/* ── Component ── */

const DEFAULT_SESSION = {
  courseName: 'Ingeniería de Software II',
  room: 'Aula 305-B',
  attendanceRate: 82,
  activeCount: 18,
  totalStudents: 22,
};

const DashboardPreview = ({ sessionData = DEFAULT_SESSION }) => {
  const { courseName, room, attendanceRate, activeCount, totalStudents } = sessionData;

  // Genera los slots de estudiantes: `activeCount` presentes + resto vacíos
  const slots = Array.from({ length: 4 }, (_, i) => i < 3);

  return (
    <Card aria-label="Vista previa del dashboard de sesión activa">
      <CardHeader>
        <div>
          <SessionLabel>
            <LiveDot />
            Sesión activa
          </SessionLabel>
          <CourseName>{courseName}</CourseName>
        </div>
        <Badge variant="active">ACTIVA</Badge>
      </CardHeader>

      {/* Tasa de asistencia */}
      <StatsRow>
        <span>Asistencia registrada</span>
        <StatValue>{attendanceRate}%</StatValue>
      </StatsRow>
      <ProgressTrack>
        <ProgressBar $percent={attendanceRate} />
      </ProgressTrack>

      {/* Grid de estudiantes (decorativo) */}
      <StudentGrid>
        {slots.map((present, i) =>
          present ? (
            <StudentSlot key={i}>
              <Icon name="person" size="sm" fill={1} />
            </StudentSlot>
          ) : (
            <StudentSlot key={i} $empty>
              <Icon name="add" size="sm" />
            </StudentSlot>
          )
        )}
      </StudentGrid>

      {/* Pie de la tarjeta */}
      <MetaRow>
        <Icon name="sensors" size="sm" />
        <span>
          {activeCount} de {totalStudents} estudiantes · {room}
        </span>
      </MetaRow>
    </Card>
  );
};

export default DashboardPreview;