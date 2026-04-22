// src/components/admin/AulasTab.jsx
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import GenericTable from './GenericTable';
import { colsAulas } from './tableColumns';
import {
  SectionHeader, SectionTitle, SectionDesc,
  LoadingBox, ErrorBox, Spinner,
} from './adminUtils';

export default function AulasTab({ hook, onNew, onEdit }) {
  const { aulas, loading, error, load, deleteById } = hook;

  const handleDeleteAula = async (item) => {
    const bloqueo = item.total_cursos > 0 || item.total_dispositivos > 0;
    if (bloqueo) {
      alert(
        `No se puede eliminar "${item.numero}":\n` +
        (item.total_cursos > 0 ? `• Asignada a ${item.total_cursos} curso(s)\n` : '') +
        (item.total_dispositivos > 0 ? `• Tiene ${item.total_dispositivos} dispositivo(s)\n` : '') +
        '\nReasigna o elimina esas dependencias primero.'
      );
      return;
    }
    if (window.confirm(`¿Eliminar el aula "${item.numero}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteById(item);
      } catch (err) {
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  return (
    <section>
      <SectionHeader>
        <div>
          <SectionTitle>Aulas ({aulas.length})</SectionTitle>
          <SectionDesc>Salones y laboratorios.</SectionDesc>
        </div>
        <Button size="sm" onClick={onNew}>
          <Icon name="add" size="sm" />Nueva aula
        </Button>
      </SectionHeader>

      {loading && (
        <LoadingBox>Cargando aulas…</LoadingBox>
      )}

      {!loading && error && (
        <ErrorBox role="alert">
          <Icon name="error" size="sm" />{error}
        </ErrorBox>
      )}

      {!loading && !error && (
        <GenericTable
          columns={colsAulas}
          rows={aulas}
          actions={[
            { icon: 'edit', title: 'Editar', onClick: onEdit },
            { icon: 'delete', title: 'Eliminar', danger: true, onClick: handleDeleteAula },
          ]}
          emptyMsg="No hay aulas registradas."
        />
      )}
    </section>
  );
}
