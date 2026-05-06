import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * VerificationFactorsBadge — muestra el factor relevante de verificación:
 * - Si ambos OK: muestra solo la biometría (método usado)
 * - Si algo falló: muestra solo lo que falló
 * - Si ambos fallidos: muestra la biometría
 * - Si sin app: muestra sin app
 *
 * @param {string|null} metodo - fingerprint | face_id | null
 * @param {boolean} verificadoBiometrico - Si la biometría pasó
 * @param {boolean} verificadoUbicacion - Si la ubicación pasó
 * @param {'completado'|'pendiente'|'fallido'|'sin_app'} estadoVerificacion
 */

const FactorChip = styled.span`
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

const METODO_ICON = {
  fingerprint: 'fingerprint',
  face_id: 'face',
};

const VerificationFactorsBadge = ({
  metodo,
  verificadoBiometrico,
  verificadoUbicacion,
  estadoVerificacion = 'pendiente',
}) => {
  // Si no hay verificación (sin_app)
  if (estadoVerificacion === 'sin_app') {
    return (
      <FactorChip $bg={theme.colors.tertiaryFixed} $color="#7b2e12" title="Sin app">
        <Icon name="smartphone" size="sm" fill={1} />
        Sin app
      </FactorChip>
    );
  }

  // Lógica: mostrar lo relevante
  // Si ambos pasaron: mostrar solo biometría
  if (verificadoBiometrico && verificadoUbicacion) {
    const bg = theme.colors.secondaryFixed;
    const color = theme.colors.secondary;
    const icon = metodo ? METODO_ICON[metodo] : 'fingerprint';
    const label = metodo === 'fingerprint' ? 'Huella' : 'Facial';

    return (
      <FactorChip $bg={bg} $color={color} title="Verificación completa">
        <Icon name={icon} size="sm" fill={1} />
        {label}
      </FactorChip>
    );
  }

  // Si ubicación falló: mostrar solo GPS
  if (!verificadoUbicacion) {
    const bg = theme.colors.errorContainer;
    const color = theme.colors.error;

    return (
      <FactorChip $bg={bg} $color={color} title="Fuera del campus">
        <Icon name="location_on" size="sm" fill={1} />
        GPS
      </FactorChip>
    );
  }

  // Si biometría falló (y ubicación pasó - caso raro): mostrar solo biometría
  const biometriaBg = theme.colors.errorContainer;
  const biometriaColor = theme.colors.error;
  const icon = metodo ? METODO_ICON[metodo] : 'fingerprint';
  const label = metodo === 'fingerprint' ? 'Huella' : 'Facial';

  return (
    <FactorChip $bg={biometriaBg} $color={biometriaColor} title="Biometría fallida">
      <Icon name={icon} size="sm" fill={1} />
      {label}
    </FactorChip>
  );
};

export default VerificationFactorsBadge;
