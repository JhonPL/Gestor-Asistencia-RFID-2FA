// src/components/admin/CursoGestionModal.jsx
// Coordinador puro del modal de gestión de curso.
// Gestiona el tab activo y delega a CursoGestionDatosTab y CursoGestionEstudiantesTab.
// Toda la lógica de datos vive en los hooks y tabs correspondientes.

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';
import theme from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useCursoEstudiantes } from '../../hooks/useCursoEstudiantes';
import CursoGestionDatosTab from './CursoGestionDatosTab';
import CursoGestionEstudiantesTab from './CursoGestionEstudiantesTab';

// ── Styled ────────────────────────────────────────────────────────────────────

const TabsRow = styled.div`
  display: flex; gap: 0;
  border-bottom: 2px solid ${theme.colors.surfaceContainerHigh};
  margin: -1.75rem -1.75rem 1.5rem;
  padding: 0 1.75rem;
`;

const TabBtn = styled.button`
  display: flex; align-items: center; gap: .375rem;
  padding: .875rem 1.25rem;
  font-size: ${theme.fontSizes.sm}; font-weight: 600;
  color: ${({ $a }) => $a ? theme.colors.primary : theme.colors.onSurfaceVariant};
  border-bottom: 3px solid ${({ $a }) => $a ? theme.colors.primary : 'transparent'};
  margin-bottom: -2px;
  transition: all ${theme.transitions.fast};
  &:hover { color: ${theme.colors.primary}; }
`;

const ActiveCount = styled.span`
  background: ${theme.colors.primaryFixed};
  color: ${theme.colors.primary};
  border-radius: 99px;
  padding: 0 .45rem;
  font-size: ${theme.fontSizes.xs};
  font-weight: 700;
`;

// ── Componente ────────────────────────────────────────────────────────────────

const CursoGestionModal = ({
  isOpen, onClose, item = null, onSave,
  docentes = [], aulas = [], horarios = [],
}) => {
  const { token } = useAuth();
  const isEditing = !!item;
  const [activeTab, setActiveTab] = useState('datos');

  const estudiantesHook = useCursoEstudiantes(token, item?.id);
  const { loadEstudiantes, reset, activeCount } = estudiantesHook;

  // Resetear al tab de datos cada vez que se abre el modal o cambia el item
  useEffect(() => {
    if (isOpen) setActiveTab('datos');
  }, [isOpen, item?.id]);

  // Cargar estudiantes y resetear UI al cambiar al tab de estudiantes
  useEffect(() => {
    if (activeTab === 'estudiantes' && isOpen && isEditing) {
      loadEstudiantes();
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen, isEditing]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Curso: ${item.nombre}` : 'Nuevo curso'}
      size="lg"
    >
      {/* Tabs (solo en modo edición) */}
      {isEditing && (
        <TabsRow>
          <TabBtn $a={activeTab === 'datos'} onClick={() => setActiveTab('datos')}>
            <Icon name="info" size="sm" />Datos
          </TabBtn>
          <TabBtn $a={activeTab === 'estudiantes'} onClick={() => setActiveTab('estudiantes')}>
            <Icon name="group" size="sm" />
            Estudiantes
            {activeCount > 0 && <ActiveCount>{activeCount}</ActiveCount>}
          </TabBtn>
        </TabsRow>
      )}

      {/* Tab Datos */}
      {activeTab === 'datos' && (
        <CursoGestionDatosTab
          item={item}
          isEditing={isEditing}
          onSave={onSave}
          onClose={onClose}
          docentes={docentes}
          aulas={aulas}
          horarios={horarios}
        />
      )}

      {/* Tab Estudiantes */}
      {activeTab === 'estudiantes' && (
        <CursoGestionEstudiantesTab
          isEditing={isEditing}
          hook={estudiantesHook}
        />
      )}
    </Modal>
  );
};

export default CursoGestionModal;