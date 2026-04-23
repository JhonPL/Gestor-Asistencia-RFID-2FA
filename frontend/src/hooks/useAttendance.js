// src/hooks/useAttendance.js
// Hook para obtener datos de asistencia de una sesión desde el backend

import { useState, useEffect, useCallback } from 'react';
import { getAsistenciaBySesion } from '../api/asistenciaApi';
import { getSesionById } from '../api/sesionesApi';
import { getCurso } from '../api/cursosApi';

const AVATAR_COLORS = [
  { bg: '#e0e0ff', color: '#000666' },
  { bg: '#94f0df', color: '#006b5e' },
  { bg: '#ffdbd0', color: '#5c1800' },
  { bg: '#bdc2ff', color: '#000666' },
];

export const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

/**
 * Hook que obtiene:
 * - Sesión de clase (datos generales)
 * - Lista de asistencia con estudiantes y estados
 * - Curso asociado
 *
 * @param {string} token - Token JWT
 * @param {number} cursoId - ID del curso
 * @param {number} sesionId - ID de la sesión
 */
export function useAttendance(token, cursoId, sesionId) {
  const [sesion, setSesion] = useState(null);
  const [curso, setCurso] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !sesionId || !cursoId) {
      console.log('Skipping load: token=', !!token, 'sesionId=', sesionId, 'cursoId=', cursoId);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener sesión
      console.log('Obteniendo sesión:', sesionId);
      const sesionData = await getSesionById(token, sesionId);
      console.log('Sesión obtenida:', sesionData);
      
      if (!sesionData) {
        throw new Error('Sesión no encontrada');
      }

      setSesion({
        id: sesionData.id,
        cursoCodigo: sesionData.curso?.codigo ?? sesionData.codigo ?? '',
        cursoNombre: sesionData.curso?.nombre ?? sesionData.nombre ?? '',
        aula: sesionData.aula_curso_horario?.aula?.nombre ?? sesionData.aula ?? '',
        fecha: new Date(sesionData.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        horaInicio: sesionData.aula_curso_horario?.horario?.hora_inicio ?? sesionData.hora_inicio ?? '',
        horaFin: sesionData.aula_curso_horario?.horario?.hora_fin ?? sesionData.hora_fin ?? '',
        estado: sesionData.estado ?? 'activa',
      });

      // 2. Obtener curso
      console.log('Obteniendo curso:', cursoId);
      const cursoData = await getCurso(token, cursoId);
      console.log('Curso obtenido:', cursoData);
      setCurso(cursoData);

      // 3. Obtener asistencia
      console.log('Obteniendo asistencia para sesión:', sesionId);
      const asistenciaData = await getAsistenciaBySesion(token, sesionId);
      console.log('Asistencia obtenida:', asistenciaData);
      
      // Mapear a formato del componente
      const mappedRecords = (asistenciaData || []).map((a) => ({
        id: a.id,
        codigoEstudiante: a.lista_estudiantes?.persona?.codigo ?? `EST-${a.lista_estudiantes_id}`,
        nombre: a.lista_estudiantes?.persona?.nombre ?? 'Sin nombre',
        apellido: a.lista_estudiantes?.persona?.apellido ?? '',
        estado: a.estado_asistencia?.nombre ?? 'Presente',
        estadoVerificacion: a.estado_verificacion?.nombre ?? 'sin_app',
        horaRegistro: a.hora_registro ? a.hora_registro.slice(0, 5) : null,
        metodo: a.verificacion_biometrica?.[0]?.metodo_verificacion?.nombre ?? null,
        dentroCampus: a.dentro_campus ?? null,
        motivo: a.motivo_justificacion ?? null,
      }));

      setRecords(mappedRecords);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando asistencia:', err);
    } finally {
      setLoading(false);
    }
  }, [token, sesionId, cursoId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRecord = useCallback((id, newEstado) => {
    setRecords(prev =>
      prev.map(r =>
        r.id !== id
          ? r
          : {
              ...r,
              estado: newEstado,
              estadoVerificacion:
                newEstado === 'Presente' && r.estadoVerificacion === 'sin_app'
                  ? 'completado'
                  : r.estadoVerificacion,
            }
      )
    );
  }, []);

  return {
    sesion,
    curso,
    records,
    loading,
    error,
    updateRecord,
    reload: load,
  };
}
