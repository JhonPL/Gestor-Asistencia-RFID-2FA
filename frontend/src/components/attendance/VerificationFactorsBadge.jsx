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
  estadoVerificacion = 'sin_app',
}) => {

  if (estadoVerificacion === 'sin_app') {
    return (
      <FactorChip $bg={theme.colors.tertiaryFixed} $color="#7b2e12" title="Sin app">
        <Icon name="smartphone" size="sm" fill={1} />
        Sin app
      </FactorChip>
    );
  }

  if (estadoVerificacion === 'registrado') {
    return (
      <FactorChip $bg={theme.colors.primaryFixed} $color={theme.colors.primary} title="Tiene app">
        <Icon name="smartphone" size="sm" fill={1} />
        Registrado
      </FactorChip>
    );
  }

  if (estadoVerificacion === 'pendiente') {
    return (
      <FactorChip $bg={theme.colors.primaryFixed} $color={theme.colors.primary} title="Pendiente">
        <Icon name="schedule" size="sm" fill={1} />
        Pendiente
      </FactorChip>
    );
  }

  if (estadoVerificacion === 'rechazado') {
    if (!metodo) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <FactorChip $bg={theme.colors.errorContainer} $color={theme.colors.error} title="Rechazado">
            <Icon name="gpp_bad" size="sm" fill={1} />
            Rechazado
          </FactorChip>
          <FactorChip $bg={theme.colors.errorContainer} $color={theme.colors.error} title="No verificó en la app">
            <Icon name="help_outline" size="sm" fill={1} />
            No verificó en la app
          </FactorChip>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <FactorChip $bg={theme.colors.errorContainer} $color={theme.colors.error} title="Rechazado">
          <Icon name="gpp_bad" size="sm" fill={1} />
          Rechazado
        </FactorChip>
        
        {verificadoBiometrico === false && (
          <FactorChip $bg={theme.colors.errorContainer} $color={theme.colors.error} title="Fallo Biometría">
            <Icon name="warning" size="sm" fill={1} />
            Fallo Biometría
          </FactorChip>
        )}
        
        {verificadoUbicacion === false && (
          <FactorChip $bg={theme.colors.errorContainer} $color={theme.colors.error} title="Fuera de rango GPS">
            <Icon name="location_off" size="sm" fill={1} />
            Fallo GPS
          </FactorChip>
        )}
      </div>
    );
  }

  if (estadoVerificacion === 'verificado') {
    const icon = metodo ? METODO_ICON[metodo] : 'fingerprint';
    const label = metodo === 'fingerprint' ? 'Huella' : 'Facial';
    return (
      <FactorChip $bg={theme.colors.secondaryFixed} $color={theme.colors.secondary} title="Verificado">
        <Icon name={icon} size="sm" fill={1} />
        {label}
      </FactorChip>
    );
  }

  // Fallback
  return (
    <FactorChip $bg={theme.colors.surfaceContainerHigh} $color={theme.colors.outline}>
      <Icon name="help" size="sm" />
      Desconocido
    </FactorChip>
  );
};

export default VerificationFactorsBadge;
