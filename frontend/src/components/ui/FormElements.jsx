import styled from 'styled-components';
import theme from '../../styles/theme';

/**
 * Primitivos de formulario alineados con el DESIGN.md:
 * - Input: fondo surface-container-highest + barra inferior activa en primary
 * - Select: mismo estilo que Input
 * - FormGroup: label uppercase + campo
 * - FormRow: layout de dos columnas
 * - FormActions: fila de botones al pie del formulario
 */

export const FormGroup = styled.div`
  display:flex;flex-direction:column;gap:.375rem;
  margin-bottom:1.25rem;
`;

export const Label = styled.label`
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.bold};
  text-transform:uppercase;letter-spacing:.1em;
  color:${theme.colors.onSurfaceVariant};
`;

const inputBase = `
  width:100%;height:3.25rem;
  padding:0 1rem;
  background-color:${theme.colors.surfaceContainerHighest};
  border:none;border-bottom:2px solid transparent;
  border-radius:${theme.radii.lg} ${theme.radii.lg} 0 0;
  font-family:${theme.fonts.body};font-size:${theme.fontSizes.base};
  color:${theme.colors.onSurface};outline:none;
  transition:all ${theme.transitions.fast};
  &::placeholder{color:${theme.colors.outline};opacity:.55}
  &:hover{background-color:${theme.colors.surfaceContainerHigh}}
  &:focus{
    border-bottom-color:${theme.colors.primary};
    background-color:${theme.colors.surfaceBright};
  }
`;

export const Input = styled.input`${inputBase}`;
export const Select = styled.select`
  ${inputBase}
  cursor:pointer;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23767683' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 1rem center;
  padding-right:2.5rem;
`;
export const Textarea = styled.textarea`
  ${inputBase}
  height:auto;padding:.75rem 1rem;resize:vertical;min-height:5rem;border-radius:${theme.radii.lg};
  border-bottom:none;&:focus{box-shadow:0 0 0 2px ${theme.colors.primary}33;border-bottom:none}
`;

export const FormRow = styled.div`
  display:grid;gap:1rem;
  grid-template-columns:1fr;
  @media(min-width:500px){grid-template-columns:1fr 1fr}
`;

export const FormActions = styled.div`
  display:flex;justify-content:flex-end;gap:.75rem;
  margin-top:1.75rem;padding-top:1.25rem;
  border-top:1px solid ${theme.colors.outlineVariant}26;
`;

export const HelperText = styled.p`
  font-size:${theme.fontSizes.xs};color:${theme.colors.outline};margin-top:.25rem;
`;