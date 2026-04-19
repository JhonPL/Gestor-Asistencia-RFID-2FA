import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * QuickActionsWidget — accesos rápidos a las tareas más frecuentes.
 * SRP: solo renderiza la cuadrícula de acciones.
 * OCP: las acciones se inyectan como prop para ser configurables.
 *
 * @param {Array<{id, icon, label}>} actions
 * @param {Function} onAction - recibe el `id` de la acción pulsada
 */

const Widget = styled.section`
  background-color: ${theme.colors.surfaceContainer};
  border-radius: ${theme.radii['2xl']};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.25rem;
`;

const AvatarIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${theme.radii.full};
  background-color: ${theme.colors.primaryFixedDim};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const HeaderText = styled.div``;

const HeaderTitle = styled.p`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.onSurface};
`;

const HeaderSub = styled.p`
  font-size: ${theme.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${theme.colors.outline};
  margin-top: 0.125rem;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const ActionBtn = styled.button`
  background-color: white;
  border-radius: ${theme.radii.xl};
  padding: 0.875rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  color: ${theme.colors.primary};
  transition: all ${theme.transitions.base};
  box-shadow: ${theme.shadows.sm};

  &:hover {
    background-color: ${theme.colors.primary};
    color: white;
    box-shadow: ${theme.shadows.md};
    transform: translateY(-1px);
  }
`;

const ActionLabel = styled.span`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  text-align: center;
  line-height: 1.3;
`;

const QuickActionsWidget = ({ actions = [], onAction }) => (
  <Widget>
    <WidgetHeader>
      <AvatarIcon aria-hidden="true">
        <Icon name="person" size="sm" />
      </AvatarIcon>
      <HeaderText>
        <HeaderTitle>Acciones rápidas</HeaderTitle>
        <HeaderSub>Tareas frecuentes</HeaderSub>
      </HeaderText>
    </WidgetHeader>

    <ActionsGrid>
      {actions.map(({ id, icon, label }) => (
        <ActionBtn key={id} onClick={() => onAction?.(id)} title={label}>
          <Icon name={icon} size="md" />
          <ActionLabel>{label}</ActionLabel>
        </ActionBtn>
      ))}
    </ActionsGrid>
  </Widget>
);

export default QuickActionsWidget;