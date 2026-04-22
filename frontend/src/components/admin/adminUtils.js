// src/components/admin/adminUtils.js
// Utilidades compartidas por los tabs del panel de administración:
// definiciones de columnas, helpers de formato y styled components reutilizables.

import styled from 'styled-components';
import theme from '../../styles/theme';

// ── Helpers ────────────────────────────────────────────────────────────────────

export function durTexto(inicio, fin) {
  if (!inicio || !fin) return '';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min <= 0) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

// ── Shared styled components ───────────────────────────────────────────────────

export const SectionHeader = styled.div`
  display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;
  justify-content: space-between; margin-bottom: 1.25rem;
`;

export const SectionTitle = styled.h2`
  font-family: ${theme.fonts.headline}; font-size: ${theme.fontSizes.xl};
  font-weight: ${theme.fontWeights.bold}; color: ${theme.colors.primary};
`;

export const SectionDesc = styled.p`
  font-size: ${theme.fontSizes.sm}; color: ${theme.colors.onSurfaceVariant}; margin-top: .25rem;
`;

export const ControlsRow = styled.div`
  display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; margin-bottom: 1rem;
`;

export const SearchWrap = styled.div`
  position: relative; flex: 1; min-width: 220px; max-width: 26rem;
`;

export const SearchInput = styled.input`
  width: 100%; padding: .75rem 1rem .75rem 2.75rem;
  background: ${theme.colors.surfaceContainerLow}; border: none;
  border-radius: ${theme.radii.xl}; font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.sm}; color: ${theme.colors.onSurface}; outline: none;
  &::placeholder { color: ${theme.colors.outline}; opacity: .6; }
  &:focus { box-shadow: 0 0 0 2px ${theme.colors.primary}33; }
`;

export const SIcon = styled.span`
  position: absolute; left: .875rem; top: 50%; transform: translateY(-50%);
  color: ${theme.colors.outline}; pointer-events: none; display: flex;
`;

export const FGroup = styled.div`
  display: flex; align-items: center; gap: .375rem; flex-wrap: wrap;
`;

export const FLabel = styled.span`
  font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline};
  font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
`;

export const FChip = styled.button`
  padding: .3rem .875rem; border-radius: ${theme.radii.full};
  font-size: ${theme.fontSizes.xs}; font-weight: 600; text-transform: capitalize;
  transition: all ${theme.transitions.fast}; border: none; cursor: pointer;
  background: ${({ $a }) => $a ? theme.colors.primary : theme.colors.surfaceContainerHigh};
  color:      ${({ $a }) => $a ? 'white' : theme.colors.onSurfaceVariant};
`;

export const ResultCount = styled.p`
  font-size: ${theme.fontSizes.xs}; color: ${theme.colors.outline}; margin-bottom: .75rem;
`;

export const LoadingBox = styled.div`
  padding: 3rem; text-align: center; color: ${theme.colors.outline};
  font-size: ${theme.fontSizes.sm};
  display: flex; flex-direction: column; align-items: center; gap: .75rem;
`;

export const ErrorBox = styled.div`
  padding: 1rem 1.25rem; border-radius: ${theme.radii.lg};
  background: ${theme.colors.errorContainer}; color: ${theme.colors.error};
  font-size: ${theme.fontSizes.sm}; display: flex; align-items: center; gap: .5rem;
  margin-bottom: 1rem;
`;

export const Spinner = styled.div`
  width: 1.5rem; height: 1.5rem;
  border: 2px solid ${theme.colors.primaryFixed};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export const SubTabsBar = styled.div`
  display: flex; align-items: center; gap: .5rem; margin-bottom: 1.5rem;
  border-bottom: 1px solid ${theme.colors.surfaceContainerHigh}; padding-bottom: 0;
`;

export const SubTab = styled.button`
  display: flex; align-items: center; gap: .5rem;
  padding: .75rem 1rem; border: none; background: none; cursor: pointer;
  font-size: ${theme.fontSizes.sm}; font-weight: 600;
  color: ${({ $a }) => $a ? theme.colors.primary : theme.colors.onSurfaceVariant};
  border-bottom: 2px solid ${({ $a }) => $a ? theme.colors.primary : 'transparent'};
  transition: all ${theme.transitions.fast};
  &:hover { color: ${theme.colors.primary}; }
`;