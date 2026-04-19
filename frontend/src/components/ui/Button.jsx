import styled, { css } from 'styled-components';
import theme from '../../styles/theme';

/**
 * Componente Button reutilizable.
 *
 * Principios aplicados:
 * - SRP: solo se encarga del comportamiento visual del botón.
 * - OCP: extensible vía `variant` y `size` sin modificar el componente.
 * - ISP: solo recibe las props que necesita.
 *
 * @param {'primary' | 'outlined' | 'ghost'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} fullWidth
 */

const sizeStyles = {
  sm: css`
    padding: 0.5rem 1.25rem;
    font-size: ${theme.fontSizes.sm};
  `,
  md: css`
    padding: 0.75rem 1.75rem;
    font-size: ${theme.fontSizes.base};
  `,
  lg: css`
    padding: 1rem 2.5rem;
    font-size: ${theme.fontSizes.lg};
  `,
};

const variantStyles = {
  primary: css`
    background-color: ${theme.colors.primary};
    color: ${theme.colors.onPrimary};

    &:hover {
      background-color: ${theme.colors.primaryContainer};
      box-shadow: ${theme.shadows.lg};
      transform: translateY(-1px);
    }
  `,
  outlined: css`
    background-color: transparent;
    color: ${theme.colors.primary};
    border: 2px solid ${theme.colors.primary};

    &:hover {
      background-color: ${theme.colors.primaryFixed};
    }
  `,
  ghost: css`
    background-color: transparent;
    color: ${theme.colors.onSurface};

    &:hover {
      background-color: ${theme.colors.surfaceContainerLow};
    }
  `,
  light: css`
    background-color: white;
    color: ${theme.colors.primary};

    &:hover {
      background-color: ${theme.colors.primaryFixed};
      box-shadow: ${theme.shadows.xl};
    }
  `,
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: ${theme.radii.full};
  font-family: ${theme.fonts.body};
  font-weight: ${theme.fontWeights.semibold};
  transition: all ${theme.transitions.base};
  white-space: nowrap;
  outline: none;

  ${({ $size }) => sizeStyles[$size] ?? sizeStyles.md}
  ${({ $variant }) => variantStyles[$variant] ?? variantStyles.primary}
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}

  &:focus-visible {
    outline: 2px solid ${theme.colors.primaryFixedDim};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  ...rest
}) => (
  <StyledButton
    $variant={variant}
    $size={size}
    $fullWidth={fullWidth}
    onClick={onClick}
    type={type}
    disabled={disabled}
    {...rest}
  >
    {children}
  </StyledButton>
);

export default Button;