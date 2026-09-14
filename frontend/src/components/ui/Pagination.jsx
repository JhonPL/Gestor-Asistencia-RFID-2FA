import styled from 'styled-components';
import theme from '../../styles/theme';
import Button from './Button';

const Wrapper = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  color: ${theme.colors.onSurfaceVariant};
  font-size: ${theme.fontSizes.sm};
  flex-wrap: wrap;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
`;

export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (!total || totalPages <= 1) return null;

  return (
    <Wrapper aria-label="Paginación">
      <span>Mostrando página {page} de {totalPages} ({total} registros)</span>
      <Controls>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </Controls>
    </Wrapper>
  );
}
