// src/hooks/useAttendance.js
// Hook para obtener datos de asistencia de una sesión desde el backend.
// La API devuelve campos planos (no objetos anidados).

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
 * - Lista de asistencia con estudiantes y estados reales de la BD
 * - Curso asociado
 *
 * La API de sesiones devuelve campos planos:
 *   { id, fecha, estado, aula, aula_nombre, hora_inicio, hora_fin, dia,
 *     curso_id, curso_nombre, curso_codigo }
 *
 * La API de asistencia devuelve campos planos:
 *   { id, nombre, apellido, correo, estado, estado_verificacion,
 *     fecha_registro, hora_registro, verificado_biometrico, metodo_verificacion }
 *
 * @param {string} token    - JWT
 * @param {number} cursoId  - ID del curso
 * @param {number} sesionId - ID de la sesión seleccionada (puede ser null/undefined)
 */
export function useAttendance(token, cursoId, sesionId) {
  const [sesion,   setSesion]   = useState(null);
  const [curso,    setCurso]    = useState(null);
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    if (!token || !sesionId || !cursoId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener sesión — la API devuelve campos planos
      const sesionData = await getSesionById(token, sesionId);

      if (!sesionData) throw new Error('Sesión no encontrada');

      // GET /api/sesiones/:id devuelve:
      // { id, fecha, hora_inicio_real, hora_fin_real, estado,
      //   curso_id, curso_nombre, curso_codigo,
      //   aula, aula_nombre, hora_inicio, hora_fin, dia }
      setSesion({
        id:          sesionData.id,
        cursoCodigo: sesionData.curso_codigo ?? '',
        cursoNombre: sesionData.curso_nombre ?? '',
        aula:        sesionData.aula_nombre
                       ? `${sesionData.aula} – ${sesionData.aula_nombre}`
                       : (sesionData.aula ?? ''),
        fecha: new Date(sesionData.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          day:     'numeric',
          month:   'long',
          year:    'numeric',
        }),
        horaInicio: sesionData.hora_inicio ?? '',
        horaFin:    sesionData.hora_fin    ?? '',
        estado:     sesionData.estado      ?? 'programada',
      });

      // 2. Obtener curso
      const cursoData = await getCurso(token, cursoId);
      setCurso(cursoData);

      // 3. Obtener asistencia — la API devuelve campos planos
      // GET /api/asistencia/sesion/:sesionId devuelve:
      // [{ id, nombre, apellido, correo, estado, estado_verificacion,
      //    fecha_registro, hora_registro, verificado_biometrico, metodo_verificacion }]
      const asistenciaData = await getAsistenciaBySesion(token, sesionId);

      const mappedRecords = (asistenciaData || []).map((a) => ({
        id:                 a.id > 0 ? a.id : null, // null si no existe registro
        listaEstudiantesId: a.lista_estudiantes_id,
        codigoEstudiante:   a.correo ?? `EST-${a.lista_estudiantes_id}`,
        nombre:             a.nombre   ?? 'Sin nombre',
        apellido:           a.apellido ?? '',
        estado:             a.estado              ?? 'Pendiente',
        estadoVerificacion: a.estado_verificacion ?? 'sin_app',
        horaRegistro:       a.hora_registro ? a.hora_registro.slice(0, 5) : null,
        metodo:             a.metodo_verificacion ?? null,
        dentroCampus:       a.verificado_biometrico ?? null,
        motivo:             null,
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

  const updateRecord = useCallback((listaEstudiantesId, newEstado) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.listaEstudiantesId !== listaEstudiantesId
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