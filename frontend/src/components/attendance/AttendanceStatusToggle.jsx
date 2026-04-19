import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * AttendanceStatusToggle — control de estado de asistencia manual.
 * Tres opciones: Presente · Ausente · Justificado
 * SRP: solo gestiona la selección del estado de asistencia.
 * OCP: `onChange` desacopla la lógica de persistencia.
 *
 * @param {'Presente'|'Ausente'|'Justificado'} value
 * @param {Function} onChange - recibe el nuevo estado
 * @param {boolean} disabled
 */

const OPTIONS = [
  { value: 'Presente',    icon: 'check',     activeBg: theme.colors.secondary,  activeColor: 'white' },
  { value: 'Ausente',     icon: 'close',     activeBg: theme.colors.error,      activeColor: 'white' },
  { value: 'Justificado', icon: 'info',      activeBg: '#e17c5a',               activeColor: 'white' },
];

const Track = styled.div`
  display: inline-flex;
  background-color: ${theme.colors.surfaceContainerHigh};
  border-radius: ${theme.radii.full};
  padding: 0.25rem;
  gap: 0.25rem;
`;

const Btn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${theme.radii.full};
  transition: all ${theme.transitions.base};
  color: ${({ $active, $activeColor }) => ($active ? $activeColor : theme.colors.outline)};
  background-color: ${({ $active, $activeBg }) => ($active ? $activeBg : 'transparent')};
  box-shadow: ${({ $active }) => ($active ? theme.shadows.md : 'none')};

  &:hover:not(:disabled) {
    background-color: ${({ $active, $activeBg }) =>
      $active ? $activeBg : theme.colors.surfaceContainerLowest};
    color: ${({ $active, $activeColor, $activeBg }) =>
      $active ? $activeColor : theme.colors.onSurface};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const AttendanceStatusToggle = ({ value, onChange, disabled = false }) => (
  <Track role="group" aria-label="Estado de asistencia">
    {OPTIONS.map(({ value: opt, icon, activeBg, activeColor }) => {
      const active = value === opt;
      return (
        <Btn
          key={opt}
          $active={active}
          $activeBg={activeBg}
          $activeColor={activeColor}
          onClick={() => !disabled && onChange?.(opt)}
          disabled={disabled}
          aria-label={opt}
          aria-pressed={active}
          title={opt}
        >
          <Icon name={icon} size="sm" fill={active ? 1 : 0} />
        </Btn>
      );
    })}
  </Track>
);

export default AttendanceStatusToggle;