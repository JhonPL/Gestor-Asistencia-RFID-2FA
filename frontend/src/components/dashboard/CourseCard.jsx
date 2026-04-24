import styled from 'styled-components';
import theme from '../../styles/theme';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';

/**
 * CourseCard — muestra un curso con aula, horario y acceso rápido.
 * SRP: solo renderiza la información de un curso.
 * OCP: extensible vía `onOpenPortal` sin modificar el componente.
 *
 * @param {{ id, codigo, nombre, aula, horario, totalEstudiantes, badgeVariant }} course
 * @param {Function} onOpenPortal
 */

const Card = styled.article`
  background-color: ${theme.colors.surfaceContainerLowest};
  border-radius: ${theme.radii.xl};
  padding: 1.5rem;
  /* Elevación tonal — sin border explícito (DESIGN.md "no-line rule") */
  box-shadow: ${theme.shadows.sm};
  transition: box-shadow ${theme.transitions.base}, transform ${theme.transitions.base};
  cursor: pointer;

  &:hover {
    box-shadow: ${theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const MoreBtn = styled.button`
  color: ${theme.colors.outlineVariant};
  transition: color ${theme.transitions.fast};
  padding: 0.25rem;
  border-radius: ${theme.radii.md};

  ${Card}:hover & {
    color: ${theme.colors.primary};
  }
`;

const CourseName = styled.h4`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.onSurface};
  line-height: 1.3;
  margin-bottom: 1.25rem;
`;

const MetaList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const MetaItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.onSurfaceVariant};
`;

const Divider = styled.div`
  height: 1px;
  /* Ghost border al 15% — DESIGN.md */
  background-color: ${theme.colors.outlineVariant}26;
  margin: 1.25rem 0;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StudentCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const CountBubble = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: ${theme.radii.full};
  background-color: ${theme.colors.surfaceContainer};
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.onSurface};
`;

const CountLabel = styled.span`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.outline};
`;

const PortalBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${theme.colors.primary};
  transition: transform ${theme.transitions.fast};

  &:hover {
    transform: translateX(3px);
  }
`;

const CourseCard = ({ course, onOpenPortal }) => {
  const { codigo, nombre, aula, horario, totalEstudiantes, badgeVariant = 'default' } = course;

  const handleCardClick = () => onOpenPortal?.(course);

  return (
    <Card onClick={handleCardClick}>
      <CardTop>
        <Badge variant={badgeVariant}>{codigo}</Badge>
        <MoreBtn aria-label="Más opciones">
          <Icon name="more_vert" size="sm" />
        </MoreBtn>
      </CardTop>

      <CourseName>{nombre}</CourseName>

      <MetaList>
        <MetaItem>
          <Icon name="meeting_room" size="sm" />
          {aula}
        </MetaItem>
        <MetaItem>
          <Icon name="schedule" size="sm" />
          {horario}
        </MetaItem>
      </MetaList>

      <Divider />

      <CardFooter>
        <StudentCount>
          <CountBubble>{totalEstudiantes}</CountBubble>
          <CountLabel>Estudiantes inscritos</CountLabel>
        </StudentCount>

        <PortalBtn onClick={() => onOpenPortal?.(course)}>
          Ver asistencia
          <Icon name="arrow_forward" size="sm" />
        </PortalBtn>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;