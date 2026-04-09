import styled, { css } from 'styled-components';
import theme from '../../styles/theme';

/**
 * Badge/chip de estado o categoría.
 * SRP: solo muestra una etiqueta con estilo de color.
 *
 * @param {'default' | 'success' | 'warning' | 'error' | 'info'} variant
 */

const variantStyles = {
  default: css`
    background-color: ${theme.colors.primaryFixed};
    color: ${theme.colors.primary};
  `,
  success: css`
    background-color: ${theme.colors.secondaryFixed};
    color: ${theme.colors.secondary};
  `,
  active: css`
    background-color: ${theme.colors.secondaryContainer};
    color: ${theme.colors.onSecondaryContainer};
  `,
  error: css`
    background-color: ${theme.colors.errorContainer};
    color: ${theme.colors.onErrorContainer};
  `,
};

const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: ${theme.radii.full};
  font-family: ${theme.fonts.label};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  letter-spacing: 0.05em;
  text-transform: uppercase;

  ${({ $variant }) => variantStyles[$variant] ?? variantStyles.default}
`;

const Badge = ({ children, variant = 'default', ...rest }) => (
  <StyledBadge $variant={variant} {...rest}>
    {children}
  </StyledBadge>
);

export default Badge;