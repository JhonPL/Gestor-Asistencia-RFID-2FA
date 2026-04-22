import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';

/**
 * GenericTable — tabla reutilizable con soporte para acciones.
 * @param {Array}  columns  - [{ key, label, render?, align? }]
 * @param {Array}  rows     - datos
 * @param {Array}  actions  - [{ icon, title, onClick, danger? }]
 * @param {string} emptyMsg - mensaje cuando no hay datos
 */

const Wrapper = styled.div`
  background: ${theme.colors.surfaceContainerLowest};
  border-radius: ${theme.radii['2xl']};
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const THead = styled.thead`
  background: ${theme.colors.surfaceContainerLow};
`;

const Th = styled.th`
  padding: .875rem 1.25rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.outline};
  text-transform: uppercase;
  letter-spacing: .1em;
  white-space: nowrap;
  border-bottom: 1px solid ${theme.colors.surfaceContainerHigh};
  text-align: ${({ $align }) => $align || 'left'};
`;

const Tr = styled.tr`
  transition: background ${theme.transitions.fast};
  &:hover { background: ${theme.colors.surfaceContainerLow}; }
  &:not(:last-child) { border-bottom: 1px solid ${theme.colors.surfaceContainerHigh}26; }
`;

const Td = styled.td`
  padding: .875rem 1.25rem;
  font-size: ${theme.fontSizes.sm};
  vertical-align: middle;
  color: ${theme.colors.onSurface};
  text-align: ${({ $align }) => $align || 'left'};
`;

const ActionBtn = styled.button`
  padding: .375rem;
  border-radius: ${theme.radii.md};
  color: ${({ $danger }) => $danger ? theme.colors.error : theme.colors.onSurfaceVariant};
  transition: all ${theme.transitions.fast};
  &:hover {
    background: ${({ $danger }) => $danger ? theme.colors.errorContainer : theme.colors.surfaceContainerHigh};
    color: ${({ $danger }) => $danger ? theme.colors.error : theme.colors.primary};
  }
`;

const ActionsCell = styled.div`
  display: flex;
  align-items: center;
  gap: .25rem;
  justify-content: flex-end;
`;

const EmptyCell = styled.td`
  padding: 3rem;
  text-align: center;
  color: ${theme.colors.outline};
  font-size: ${theme.fontSizes.sm};
`;

const ActiveDot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: .375rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  color: ${({ $active }) => $active ? theme.colors.secondary : theme.colors.outline};
  &::before {
    content: '';
    width: .5rem;
    height: .5rem;
    border-radius: 50%;
    background: currentColor;
  }
`;

export const StatusDot = ({ active }) => (
  <ActiveDot $active={active}>{active ? 'Activo' : 'Inactivo'}</ActiveDot>
);

const GenericTable = ({ columns = [], rows = [], actions = [], emptyMsg = 'No hay datos.' }) => (
  <Wrapper>
    <Table>
      <THead>
        <tr>
          {columns.map((col, colIndex) => (
            <Th key={`${col.key}-${colIndex}`} $align={col.align}>{col.label}</Th>
          ))}
          {actions.length > 0 && <Th $align="right">Acciones</Th>}
        </tr>
      </THead>
      <tbody>
        {rows.length === 0 ? (
          <tr><EmptyCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)}>{emptyMsg}</EmptyCell></tr>
        ) : (
          rows.map((row, i) => (
            <Tr key={row.id ?? i}>
              {columns.map((col, colIndex) => (
                <Td key={`${col.key}-${colIndex}`} $align={col.align}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </Td>
              ))}
              {actions.length > 0 && (
                <Td $align="right">
                  <ActionsCell>
                    {actions.map((act, ai) => (
                      <ActionBtn
                        key={ai}
                        $danger={act.danger}
                        title={act.title}
                        onClick={() => act.onClick(row)}
                      >
                        <Icon name={act.icon} size="sm" />
                      </ActionBtn>
                    ))}
                  </ActionsCell>
                </Td>
              )}
            </Tr>
          ))
        )}
      </tbody>
    </Table>
  </Wrapper>
);

export default GenericTable;