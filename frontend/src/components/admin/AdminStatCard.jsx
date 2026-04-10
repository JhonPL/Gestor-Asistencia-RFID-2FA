import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * AdminStatCard — tarjeta de métrica para el panel administrativo.
 * SRP: solo muestra un KPI con ícono, valor y delta.
 *
 * @param {{ id, label, value, icon, delta }} stat
 */

const Card = styled.div`
  background-color: ${theme.colors.surfaceContainerLowest};
  border-radius: ${theme.radii.xl};
  padding: 1.5rem;
  box-shadow: ${theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow ${theme.transitions.base}, transform ${theme.transitions.base};

  &:hover {
    box-shadow: ${theme.shadows.md};
    transform: translateY(-1px);
  }
`;

const Top = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const IconBox = styled.div`
  width: 2.75rem;
  height: 2.75rem;
  border-radius: ${theme.radii.lg};
  background-color: ${theme.colors.primaryFixed};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Value = styled.p`
  font-family: ${theme.fonts.headline};
  font-size: ${theme.fontSizes['4xl']};
  font-weight: ${theme.fontWeights.extrabold};
  color: ${theme.colors.primary};
  line-height: 1;
`;

const Label = styled.p`
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.onSurfaceVariant};
`;

const Delta = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.secondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const AdminStatCard = ({ stat }) => (
  <Card>
    <Top>
      <IconBox><Icon name={stat.icon} size="md" /></IconBox>
      <Value>{stat.value}</Value>
    </Top>
    <div>
      <Label>{stat.label}</Label>
      <Delta>{stat.delta}</Delta>
    </div>
  </Card>
);

export default AdminStatCard;