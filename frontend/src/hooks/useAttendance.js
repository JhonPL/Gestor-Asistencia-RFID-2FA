// src/hooks/useAttendance.js
// Centraliza TODA la lógica de datos y operaciones de la página de asistencia.
// El hook acepta el array de sesiones para gestionar también la tabla completa.
//
// Firma de retorno (compatible con usos anteriores + nuevos):
//   { sesion, curso, records, loading, error, updateRecord, reload,
//     originalRecords, hasChanges, isSaving, saveError, saveSuccess,
//     fullTableData, loadingFullTable, fullTableChanges,
//     handleSaveChanges, handleStatusChange,
//     handleFullTableStatusChange, handleSaveFullTableChanges }

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAsistenciaBySesion }                     from '../api/asistenciaApi';
import { batchUpdateAsistencia }                      from '../api/asistenciaApi';
import { getSesionById }                              from '../api/sesionesApi';
import { getCurso }                                   from '../api/cursosApi';

const AVATAR_COLORS = [
  { bg: '#e0e0ff', color: '#000666' },
  { bg: '#94f0df', color: '#006b5e' },
  { bg: '#ffdbd0', color: '#5c1800' },
  { bg: '#bdc2ff', color: '#000666' },
];

export const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

/**
 * @param {string}   token     - JWT
 * @param {number}   cursoId   - ID del curso
 * @param {number}   sesionId  - ID de la sesión seleccionada (puede ser null/undefined)
 * @param {Array}    sesiones  - lista completa de sesiones del curso (para tabla completa)
 * @param {boolean}  showFullTable - controla cuándo cargar los datos de la tabla completa
 */
export function useAttendance(token, cursoId, sesionId, sesiones = [], showFullTable = false) {

  // ── Datos principales de la sesión actual ───────────────────────────────
  const [sesion,   setSesion]   = useState(null);
  const [curso,    setCurso]    = useState(null);
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // ── Seguimiento de cambios pendientes ───────────────────────────────────
  const [originalRecords, setOriginalRecords] = useState([]);
  const [prevLoading,     setPrevLoading]     = useState(true);

  // ── Estado de guardado (sesión actual) ──────────────────────────────────
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const [saveSuccess,  setSaveSuccess]  = useState(false);

  // ── Tabla completa (todas las sesiones) ─────────────────────────────────
  const [fullTableData,     setFullTableData]     = useState([]);
  const [loadingFullTable,  setLoadingFullTable]  = useState(false);
  const [fullTableChanges,  setFullTableChanges]  = useState({});

  // ── Carga de datos de la sesión actual ──────────────────────────────────
  const load = useCallback(async () => {
    if (!token || !sesionId || !cursoId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Sesión
      const sesionData = await getSesionById(token, sesionId);
      if (!sesionData) throw new Error('Sesión no encontrada');

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

      // 2. Curso
      const cursoData = await getCurso(token, cursoId);
      setCurso(cursoData);

      // 3. Asistencia — campos planos
      const asistenciaData = await getAsistenciaBySesion(token, sesionId);

      const mappedRecords = (asistenciaData || []).map((a) => {
        // Si la verificación falló, marcar como Ausente automáticamente
        const estado =
          a.estado_verificacion === 'fallido' ? 'Ausente' : (a.estado ?? 'Pendiente');

        return {
          id:                 a.id > 0 ? a.id : null,
          listaEstudiantesId: a.lista_estudiantes_id,
          codigoEstudiante:   a.correo ?? `EST-${a.lista_estudiantes_id}`,
          nombre:             a.nombre   ?? 'Sin nombre',
          apellido:           a.apellido ?? '',
          estado,
          estadoVerificacion: a.estado_verificacion ?? 'sin_app',
          horaRegistro:       a.hora_registro ? a.hora_registro.slice(0, 5) : null,
          metodo:             a.metodo_verificacion ?? null,
          verificadoBiometrico: a.verificado_biometrico ?? false,
          verificadoUbicacion:  a.verificado_ubicacion ?? false,
          motivo:             null,
        };
      });

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

  // ── Resetear prevLoading cuando cambia la sesión ────────────────────────
  useEffect(() => {
    setPrevLoading(true);
  }, [sesionId]);

  // ── Guardar copia de originales cuando termina de cargar ────────────────
  useEffect(() => {
    if (prevLoading && !loading && records.length > 0) {
      setOriginalRecords(JSON.parse(JSON.stringify(records)));
      setSaveError(null);
      setSaveSuccess(false);
    }
    setPrevLoading(loading);
  }, [loading, records, prevLoading]);

  // ── Detectar si hay cambios respecto a los originales ───────────────────
  const hasChanges = useMemo(() => {
    return records.some((r) => {
      const original = originalRecords.find(
        (o) => o.listaEstudiantesId === r.listaEstudiantesId,
      );
      return !original || original.estado !== r.estado;
    });
  }, [records, originalRecords]);

  // ── Actualiza un registro en memoria (optimistic UI) ────────────────────
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
            },
      ),
    );
  }, []);

  // ── Handler de cambio en la tabla de sesión actual ──────────────────────
  const handleStatusChange = useCallback((listaEstudiantesId, newEstado) => {
    updateRecord(listaEstudiantesId, newEstado);
  }, [updateRecord]);

  // ── Guardar cambios de la sesión actual ─────────────────────────────────
  const handleSaveChanges = useCallback(async (currentSesionId) => {
    if (!hasChanges) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const cambios = records
        .filter((r) => {
          const original = originalRecords.find(
            (o) => o.listaEstudiantesId === r.listaEstudiantesId,
          );
          return original && original.estado !== r.estado;
        })
        .map((r) => {
          if (r.id && r.id > 0) {
            return { asistencia_id: r.id, estado: r.estado };
          }
          return {
            asistencia_id:       0,
            lista_estudiantes_id: r.listaEstudiantesId,
            sesion_clase_id:      currentSesionId,
            estado:              r.estado,
          };
        });

      if (cambios.length === 0) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        return;
      }

      const result = await batchUpdateAsistencia(token, cambios);
      if (result.ok) {
        setSaveSuccess(true);
        setOriginalRecords(JSON.parse(JSON.stringify(records)));
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      setSaveError(err.message);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, records, originalRecords, token]);

  // ── Carga de tabla completa (todas las sesiones) ─────────────────────────
  useEffect(() => {
    if (!showFullTable || !token || sesiones.length === 0) return;

    setLoadingFullTable(true);

    const loadAllSessions = async () => {
      try {
        const allData = [];
        for (const ses of sesiones) {
          const asistencia = await getAsistenciaBySesion(token, ses.id);
          allData.push({
            sesionId:    ses.id,
            sesionFecha: ses.fecha,
            sesionAula:  ses.aula_nombre || ses.aula || '',
            records:     (asistencia || []).map((a) => {
              const estado = a.estado_verificacion === 'fallido' ? 'Ausente' : (a.estado ?? 'Pendiente');
              return {
                id:                 a.id > 0 ? a.id : null,
                listaEstudiantesId: a.lista_estudiantes_id,
                nombre:             a.nombre   ?? 'Sin nombre',
                apellido:           a.apellido ?? '',
                codigoEstudiante:   a.correo   ?? `EST-${a.lista_estudiantes_id}`,
                estado,
                estadoVerificacion: a.estado_verificacion ?? 'sin_app',
              };
            }),
          });
        }
        setFullTableData(allData);
      } catch (err) {
        console.error('Error cargando tabla completa:', err);
      } finally {
        setLoadingFullTable(false);
      }
    };

    loadAllSessions();
  }, [showFullTable, token, sesiones]);

  // ── Handler de cambio en la tabla completa ───────────────────────────────
  const handleFullTableStatusChange = useCallback(
    (sesionId, listaEstudiantesId, newEstado) => {
      const key = `${sesionId}-${listaEstudiantesId}`;
      setFullTableChanges((prev) => ({ ...prev, [key]: newEstado }));
    },
    [],
  );

  // ── Guardar cambios de la tabla completa ─────────────────────────────────
  const handleSaveFullTableChanges = useCallback(async () => {
    if (Object.keys(fullTableChanges).length === 0) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const cambios = [];

      for (const session of fullTableData) {
        for (const record of session.records) {
          const key       = `${session.sesionId}-${record.listaEstudiantesId}`;
          const newEstado = fullTableChanges[key];

          if (newEstado && newEstado !== record.estado) {
            console.log(
              `✓ Cambio — Sesión: ${session.sesionId}, Estudiante: ${record.listaEstudiantesId},`,
              `Estado anterior: ${record.estado}, Nuevo: ${newEstado}, ID: ${record.id}`,
            );

            if (record.id && record.id > 0) {
              cambios.push({ asistencia_id: record.id, estado: newEstado });
            } else {
              cambios.push({
                asistencia_id:        0,
                lista_estudiantes_id: record.listaEstudiantesId,
                sesion_clase_id:      session.sesionId,
                estado:              newEstado,
              });
            }
          }
        }
      }

      console.log('📤 Enviando al servidor:', JSON.stringify(cambios, null, 2));

      if (cambios.length === 0) {
        console.log('⚠️ No hay cambios para guardar');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        return;
      }

      const result = await batchUpdateAsistencia(token, cambios);
      console.log('📥 Respuesta servidor:', result);

      if (result.ok) {
        setSaveSuccess(true);
        setFullTableChanges({});

        // Recargar tabla completa con datos actualizados
        const newData = [];
        for (const ses of sesiones) {
          const asistencia = await getAsistenciaBySesion(token, ses.id);
          newData.push({
            sesionId:    ses.id,
            sesionFecha: ses.fecha,
            sesionAula:  ses.aula_nombre || ses.aula || '',
            records:     (asistencia || []).map((a) => {
              const estado = a.estado_verificacion === 'fallido' ? 'Ausente' : (a.estado ?? 'Pendiente');
              return {
                id:                 a.id > 0 ? a.id : null,
                listaEstudiantesId: a.lista_estudiantes_id,
                nombre:             a.nombre   ?? 'Sin nombre',
                apellido:           a.apellido ?? '',
                codigoEstudiante:   a.correo   ?? `EST-${a.lista_estudiantes_id}`,
                estado,
                estadoVerificacion: a.estado_verificacion ?? 'sin_app',
              };
            }),
          });
        }
        setFullTableData(newData);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('❌ Error al guardar:', err);
      setSaveError(err.message);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [fullTableChanges, fullTableData, token, sesiones]);

  return {
    // Datos de la sesión actual
    sesion,
    curso,
    records,
    loading,
    error,
    updateRecord,
    reload: load,
    // Seguimiento de cambios
    originalRecords,
    hasChanges,
    // Estado de guardado
    isSaving,
    saveError,
    saveSuccess,
    // Handlers de la sesión actual
    handleStatusChange,
    handleSaveChanges,
    // Tabla completa
    fullTableData,
    loadingFullTable,
    fullTableChanges,
    handleFullTableStatusChange,
    handleSaveFullTableChanges,
  };
}