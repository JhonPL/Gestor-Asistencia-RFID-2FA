import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * VerificationBadge — muestra el estado_verificacion del segundo factor.
 * SRP: solo renderiza el chip con su color e ícono correspondiente.
 *
 * @param {'completado'|'pendiente'|'fallido'|'sin_app'} status
 * @param {string|null} metodo - fingerprint | face_id | pin | pattern | null
 */

const CONFIG = {
  completado: {
    bg: theme.colors.secondaryFixed,
    color: theme.colors.secondary,
    icon: 'verified',
    label: 'Verificado',
  },
  pendiente: {
    bg: theme.colors.primaryFixed,
    color: theme.colors.primary,
    icon: 'schedule',
    label: 'Pendiente',
  },
  fallido: {
    bg: theme.colors.errorContainer,
    color: theme.colors.error,
    icon: 'gpp_bad',
    label: 'Fallido',
  },
  sin_app: {
    bg: theme.colors.tertiaryFixed,
    color: '#7b2e12',
    icon: 'smartphone',
    label: 'Sin app',
  },
};

const METODO_ICON = {
  fingerprint: 'fingerprint',
  face_id: 'face',
  pin: 'pin',
  pattern: 'pattern',
};

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.625rem;
  border-radius: ${theme.radii.full};
  background-color: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const VerificationBadge = ({ status, metodo }) => {
  const cfg = CONFIG[status] ?? CONFIG.pendiente;
  const iconName = metodo ? METODO_ICON[metodo] : cfg.icon;

  return (
    <Chip $bg={cfg.bg} $color={cfg.color} title={metodo ?? status}>
      <Icon name={iconName ?? cfg.icon} size="sm" fill={1} />
      {cfg.label}
    </Chip>
  );
};

export default VerificationBadge;