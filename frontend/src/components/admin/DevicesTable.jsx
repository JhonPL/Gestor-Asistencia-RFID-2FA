import styled from 'styled-components';
import theme from '../../styles/theme';
import Icon from '../ui/Icon';
import Badge from '../ui/Badge';

/**
 * DevicesTable — lista de dispositivos ESP32/RFID registrados (RF-11).
 * SRP: solo renderiza el listado de dispositivos.
 */

const Wrapper = styled.div`
  background-color: ${theme.colors.surfaceContainerLowest};
  border-radius: ${theme.radii['2xl']};
  box-shadow: ${theme.shadows.sm};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 1rem 1.5rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.outline};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: left;
  background-color: ${theme.colors.surfaceContainerLow};
  border-bottom: 1px solid ${theme.colors.surfaceContainerHigh};
`;

const Tr = styled.tr`
  &:hover { background-color: ${theme.colors.surfaceContainerLow}; }
  transition: background-color ${theme.transitions.fast};
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
  font-size: ${theme.fontSizes.sm};
  vertical-align: middle;
`;

const DeviceCode = styled.span`
  font-family: 'Courier New', monospace;
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.onSurface};
`;

const IpText = styled.span`
  font-family: 'Courier New', monospace;
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.onSurfaceVariant};
`;

const LastSeen = styled.span`
  font-size: ${theme.fontSizes.xs};
  color: ${theme.colors.outline};
`;

const ActionBtn = styled.button`
  padding: 0.375rem;
  border-radius: ${theme.radii.md};
  color: ${theme.colors.onSurfaceVariant};
  transition: all ${theme.transitions.fast};
  &:hover {
    background-color: ${theme.colors.surfaceContainerHigh};
    color: ${theme.colors.primary};
  }
`;

const DevicesTable = ({ devices = [], onEdit }) => (
  <Wrapper>
    <Table>
      <thead>
        <tr>
          <Th>Código</Th>
          <Th>Aula asignada</Th>
          <Th>IP</Th>
          <Th>Estado</Th>
          <Th>Última conexión</Th>
          <Th>Acciones</Th>
        </tr>
      </thead>
      <tbody>
        {devices.map(d => (
          <Tr key={d.id}>
            <Td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="sensors" size="sm" style={{ color: theme.colors.primary }} />
                <DeviceCode>{d.codigo}</DeviceCode>
              </div>
            </Td>
            <Td>{d.aula}</Td>
            <Td><IpText>{d.ip}</IpText></Td>
            <Td>
              <Badge variant={d.estado === 'Activo' ? 'active' : 'error'}>
                {d.estado}
              </Badge>
            </Td>
            <Td><LastSeen>{d.ultimaConexion}</LastSeen></Td>
            <Td>
              <ActionBtn onClick={() => onEdit?.(d)} title="Editar dispositivo">
                <Icon name="edit" size="sm" />
              </ActionBtn>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  </Wrapper>
);

export default DevicesTable;