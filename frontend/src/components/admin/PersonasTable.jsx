import styled from 'styled-components';
import theme from '../../styles/theme';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';
import { avatarColor } from '../../mocks/Attendance.mock';

/**
 * PersonasTable — tabla de gestión de personas (RF-10, RF-12).
 * SRP: solo renderiza la lista y delega acciones al padre.
 * OCP: acciones inyectadas via callbacks sin modificar el componente.
 *
 * @param {Array}    personas
 * @param {Function} onEdit   - recibe la persona
 * @param {Function} onDelete - recibe la persona
 * @param {Function} onLinkCard - vincular tarjeta RFID (RF-12)
 */

const ROL_BADGE = {
  docente:        'default',
  estudiante:     'success',
  administrador:  'active',
};

const Wrapper = styled.div`
  background-color: ${theme.colors.surfaceContainerLowest};
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
  background-color: ${theme.colors.surfaceContainerLow};
`;

const Th = styled.th`
  padding: 1rem 1.5rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.outline};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  border-bottom: 1px solid ${theme.colors.surfaceContainerHigh};
`;

const Tr = styled.tr`
  transition: background-color ${theme.transitions.fast};
  &:hover { background-color: ${theme.colors.surfaceContainerLow}; }
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
  vertical-align: middle;
`;

const PersonCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${theme.radii.full};
  background-color: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  flex-shrink: 0;
`;

const PersonName = styled.span`
  font-weight: ${theme.fontWeights.semibold};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.onSurface};
`;

const Email = styled.span`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.onSurfaceVariant};
`;

const MonoText = styled.span`
  font-family: 'Courier New', monospace;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.onSurfaceVariant};
`;

const RfidChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: ${theme.fontSizes.xs};
  color: ${({ $linked }) => ($linked ? theme.colors.secondary : theme.colors.outline)};
  background-color: ${({ $linked }) =>
    $linked ? theme.colors.secondaryFixed : theme.colors.surfaceContainerHigh};
  padding: 0.2rem 0.5rem;
  border-radius: ${theme.radii.md};
`;

const ActiveDot = styled.span`
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: ${({ $active }) => ($active ? theme.colors.secondary : theme.colors.outline)};
  margin-right: 0.375rem;
`;

const ActionBtn = styled.button`
  padding: 0.375rem;
  border-radius: ${theme.radii.md};
  color: ${({ $danger }) => ($danger ? theme.colors.error : theme.colors.onSurfaceVariant)};
  transition: all ${theme.transitions.fast};

  &:hover {
    background-color: ${({ $danger }) =>
      $danger ? theme.colors.errorContainer : theme.colors.surfaceContainerHigh};
    color: ${({ $danger }) => ($danger ? theme.colors.error : theme.colors.primary)};
  }
`;

const ActionsCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const EmptyRow = styled.tr``;
const EmptyCell = styled.td`
  padding: 3rem;
  text-align: center;
  color: ${theme.colors.outline};
  font-size: ${theme.fontSizes.sm};
`;

const PersonasTable = ({ personas = [], onEdit, onDelete, onLinkCard }) => (
  <Wrapper>
    <Table>
      <THead>
        <tr>
          <Th>Persona</Th>
          <Th>Rol</Th>
          <Th>Programa</Th>
          <Th>Tarjeta RFID</Th>
          <Th>Estado</Th>
          <Th>Acciones</Th>
        </tr>
      </THead>
      <tbody>
        {personas.length === 0 ? (
          <EmptyRow>
            <EmptyCell colSpan={6}>No hay personas registradas.</EmptyCell>
          </EmptyRow>
        ) : (
          personas.map((p, i) => {
            const av = avatarColor(i);
            const initials = `${p.nombre[0]}${p.apellido[0]}`;
            return (
              <Tr key={p.id}>
                <Td>
                  <PersonCell>
                    <Avatar $bg={av.bg} $color={av.color}>{initials}</Avatar>
                    <div>
                      <PersonName>{p.nombre} {p.apellido}</PersonName>
                      <br />
                      <Email>{p.correo}</Email>
                    </div>
                  </PersonCell>
                </Td>

                <Td>
                  <Badge variant={ROL_BADGE[p.rol] ?? 'default'}>{p.rol}</Badge>
                </Td>

                <Td>
                  <MonoText>{p.programa ?? '—'}</MonoText>
                </Td>

                <Td>
                  {p.codigoTarjeta ? (
                    <RfidChip $linked>
                      <Icon name="contactless" size="sm" />
                      {p.codigoTarjeta}
                    </RfidChip>
                  ) : (
                    <RfidChip $linked={false}>
                      <Icon name="contactless" size="sm" />
                      Sin tarjeta
                    </RfidChip>
                  )}
                </Td>

                <Td>
                  <ActiveDot $active={p.activo} />
                  <MonoText>{p.activo ? 'Activo' : 'Inactivo'}</MonoText>
                </Td>

                <Td>
                  <ActionsCell>
                    <ActionBtn
                      onClick={() => onLinkCard?.(p)}
                      title="Vincular tarjeta RFID"
                    >
                      <Icon name="contactless" size="sm" />
                    </ActionBtn>
                    <ActionBtn onClick={() => onEdit?.(p)} title="Editar">
                      <Icon name="edit" size="sm" />
                    </ActionBtn>
                    <ActionBtn $danger onClick={() => onDelete?.(p)} title="Eliminar">
                      <Icon name="delete" size="sm" />
                    </ActionBtn>
                  </ActionsCell>
                </Td>
              </Tr>
            );
          })
        )}
      </tbody>
    </Table>
  </Wrapper>
);

export default PersonasTable;