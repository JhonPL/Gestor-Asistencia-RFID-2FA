import styled from 'styled-components';
import theme from '../../styles/theme';

/**
 * UpcomingClassWidget — próximas clases del día con línea de tiempo vertical.
 * SRP: solo muestra la agenda inmediata del docente.
 *
 * @param {Array} classes - MOCK_PROXIMAS_CLASES
 */

const Widget = styled.section`
  background-color: ${theme.colors.primaryContainer};
  color: white;
  border-radius: ${theme.radii['2xl']};
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
`;

const Blob = styled.div`
  position: absolute;
  bottom: -3rem;
  right: -3rem;
  width: 8rem;
  height: 8rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  filter: blur(24px);
  pointer-events: none;
`;

const WidgetTitle = styled.h3`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${theme.colors.onPrimaryContainer};
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
`;

const ClassList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
`;

const ClassItem = styled.li`
  position: relative;
  padding-left: 1.25rem;

  /* Línea vertical a la izquierda */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: ${({ $proxima }) =>
      $proxima ? theme.colors.secondaryFixedDim : 'rgba(255,255,255,0.2)'};
    border-radius: 1px;
  }
`;

const ClassTime = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ $proxima }) =>
    $proxima ? theme.colors.secondaryContainer : theme.colors.onPrimaryContainer};
  margin-bottom: 0.25rem;
`;

const ClassName = styled.p`
  font-size: ${theme.fontSizes.base};
  font-weight: ${theme.fontWeights.bold};
  opacity: ${({ $proxima }) => ($proxima ? 1 : 0.65)};
`;

const ClassAula = styled.p`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.onPrimaryContainer};
  opacity: 0.6;
  margin-top: 0.125rem;
`;

const UpcomingClassWidget = ({ classes = [] }) => (
  <Widget>
    <Blob aria-hidden="true" />
    <WidgetTitle>Hoy en tu horario</WidgetTitle>

    <ClassList>
      {classes.map((c) => (
        <ClassItem key={c.id} $proxima={c.proxima}>
          <ClassTime $proxima={c.proxima}>
            {c.proxima ? `En ${c.minutosRestantes} minutos` : c.horaInicio}
          </ClassTime>
          <ClassName $proxima={c.proxima}>{c.cursoNombre}</ClassName>
          <ClassAula>{c.aula}</ClassAula>
        </ClassItem>
      ))}
    </ClassList>
  </Widget>
);

export default UpcomingClassWidget;