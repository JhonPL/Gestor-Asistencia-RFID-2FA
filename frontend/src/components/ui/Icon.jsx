/**
 * Wrapper para Material Symbols Outlined.
 * SRP: encapsula la renderización del ícono y su tamaño.
 *
 * @param {string} name - nombre del ícono (snake_case)
 * @param {'sm' | 'md' | 'lg' | 'xl'} size
 * @param {number} fill - 0 = outlined, 1 = filled
 */

import styled from 'styled-components';

const sizes = {
  sm: '18px',
  md: '24px',
  lg: '32px',
  xl: '48px',
};

const StyledIcon = styled.span`
  font-family: 'Material Symbols Outlined';
  font-size: ${({ $size }) => sizes[$size] ?? sizes.md};
  font-variation-settings:
    'FILL' ${({ $fill }) => $fill ?? 0},
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  user-select: none;
  transition: font-variation-settings 200ms ease;
`;

const Icon = ({ name, size = 'md', fill = 0, className, style }) => (
  <StyledIcon
    className={`material-symbols-outlined ${className ?? ''}`}
    $size={size}
    $fill={fill}
    style={style}
    aria-hidden="true"
  >
    {name}
  </StyledIcon>
);

export default Icon;