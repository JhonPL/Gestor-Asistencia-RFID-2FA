import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * RecentSessionsWidget — muestra las últimas sesiones con su tasa de asistencia.
 * SRP: solo renderiza el listado de sesiones recientes.
 *
 * @param {Array} sessions  - MOCK_SESIONES_RECIENTES
 * @param {Function} onViewReport
 */

const Widget = styled.section`
  background-color: ${theme.colors.surfaceContainerLow};
  border-radius: ${theme.radii['2xl']};
  padding: 1.5rem;
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const WidgetTitle = styled.h3`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${theme.colors.primary};
`;

const SessionList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  /* Separación por espacio, sin dividers — DESIGN.md */
  gap: 1.25rem;
`;

const SessionItem = styled.li`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

// Ícono de estado: colores según session.estadoGeneral
const statusConfig = {
  ok:      { bg: theme.colors.secondaryContainer, color: theme.colors.secondary,       icon: 'check_circle' },
  warning: { bg: theme.colors.tertiaryFixed,       color: theme.colors.onTertiaryFixed, icon: 'warning'      },
  error:   { bg: theme.colors.errorContainer,      color: theme.colors.error,           icon: 'error'        },
};

const StatusIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: ${theme.radii.lg};
  background-color: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SessionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SessionName = styled.p`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.onSurface};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SessionMeta = styled.p`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.onSurfaceVariant};
  margin-top: 0.125rem;
`;

const NeedsBadge = styled.span`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${theme.colors.error};
  flex-shrink: 0;
`;

const ViewBtn = styled.button`
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.625rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${theme.colors.primary};
  background-color: white;
  border-radius: ${theme.radii.lg};
  box-shadow: ${theme.shadows.sm};
  transition: all ${theme.transitions.base};

  &:hover {
    background-color: ${theme.colors.primary};
    color: white;
  }
`;

const RecentSessionsWidget = ({ sessions = [], onViewReport }) => (
  <Widget>
    <WidgetHeader>
      <WidgetTitle>Sesiones recientes</WidgetTitle>
      <Icon name="history" size="sm" style={{ color: theme.colors.primary }} />
    </WidgetHeader>

    <SessionList>
      {sessions.map((s) => {
        const cfg = statusConfig[s.estadoGeneral] ?? statusConfig.ok;
        return (
          <SessionItem key={s.id}>
            <StatusIcon $bg={cfg.bg} $color={cfg.color} aria-hidden="true">
              <Icon name={cfg.icon} size="sm" fill={1} />
            </StatusIcon>

            <SessionInfo>
              <SessionName title={s.cursoNombre}>{s.cursoNombre}</SessionName>
              <SessionMeta>
                {s.fecha} · {s.tasaAsistencia}% asistencia
              </SessionMeta>
            </SessionInfo>

            {s.nota && <NeedsBadge>{s.nota}</NeedsBadge>}
          </SessionItem>
        );
      })}
    </SessionList>

    <ViewBtn onClick={onViewReport}>Ver reporte de analítica</ViewBtn>
  </Widget>
);

export default RecentSessionsWidget;