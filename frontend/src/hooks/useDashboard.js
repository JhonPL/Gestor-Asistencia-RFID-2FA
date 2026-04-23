// src/hooks/useDashboard.js
// Encapsula toda la lógica de datos del dashboard del docente:
//  - Cursos con detalle (aulas + horarios)
//  - Sesiones recientes con estadísticas
//  - Próximas clases del día (calculadas del horario)

import { useState, useEffect, useCallback } from 'react';
import { getCursos, getCurso, getEstudiantes } from '../api/cursosApi';
import { getSesionesByCurso } from '../api/sesionesApi';

// ── Constantes ────────────────────────────────────────────────────────────────
const BADGE_VARIANTS = ['default', 'success', 'warning'];

// ISO day of week: 1=Lunes … 7=Domingo (igual que PostgreSQL ISODOW)
const DIAS_ISO = {
  Lunes: 1, Martes: 2, 'Miércoles': 3,
  Jueves: 4, Viernes: 5, 'Sábado': 6, Domingo: 7,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayIsoDow() {
  const js = new Date().getDay(); // 0=Sun
  return js === 0 ? 7 : js;
}

/** "HH:MM:SS" → minutos desde medianoche */
function toMin(timeStr = '') {
  const [h = 0, m = 0] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/** Formatea el string de horario para mostrar en la CourseCard */
function formatHorario(horarios = []) {
  if (!horarios.length) return 'Sin horario asignado';

  // Agrupar franjas con mismo rango de hora
  const grupos = {};
  horarios.forEach(h => {
    const time = `${h.hora_inicio?.slice(0, 5)} – ${h.hora_fin?.slice(0, 5)}`;
    if (!grupos[time]) grupos[time] = [];
    const abrev = h.dia?.slice(0, 3) ?? '?';
    if (!grupos[time].includes(abrev)) grupos[time].push(abrev);
  });

  return Object.entries(grupos)
    .map(([time, dias]) => `${dias.join(', ')} · ${time}`)
    .join(' | ');
}

/** Devuelve la primera aula o "Sin aula asignada" */
function formatAula(horarios = []) {
  const aulas = [...new Set(horarios.map(h => h.aula).filter(Boolean))];
  return aulas.length ? aulas.join(', ') : 'Sin aula asignada';
}

/** Calcula las clases de hoy que aún no han terminado */
function computeProximasClases(cursosDetalle = []) {
  const todayDow = getTodayIsoDow();
  const nowMin   = toMin(`${new Date().getHours()}:${new Date().getMinutes()}`);
  const result   = [];

  cursosDetalle.forEach(curso => {
    (curso.horarios ?? []).forEach(h => {
      if ((DIAS_ISO[h.dia] ?? 0) !== todayDow) return;
      const endMin   = toMin(h.hora_fin);
      const startMin = toMin(h.hora_inicio);
      if (endMin <= nowMin) return; // ya terminó

      result.push({
        id:               `${curso.id}-${h.horario_id}`,
        cursoNombre:      curso.nombre,
        aula:             h.aula || 'Sin aula',
        horaInicio:       h.hora_inicio?.slice(0, 5) ?? '',
        minutosRestantes: Math.max(0, startMin - nowMin),
        proxima:          startMin > nowMin, // true=todavía no empieza
      });
    });
  });

  // Primero las que ya están en curso, luego las que faltan
  return result.sort((a, b) => {
    if (a.proxima !== b.proxima) return a.proxima ? 1 : -1;
    return a.minutosRestantes - b.minutosRestantes;
  });
}

/** Construye el array de sesiones recientes para el widget */
function buildSesionesRecientes(allSesiones = []) {
  return allSesiones
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 3)
    .map(s => {
      const tasa = s.total_registros > 0
        ? Math.round((s.presentes / s.total_registros) * 100)
        : 0;
      return {
        id:             s.id,
        cursoNombre:    s.cursoNombre,
        cursoCodigo:    s.cursoCodigo ?? '',
        fecha:          new Date(s.fecha).toLocaleDateString('es-CO', {
          weekday: 'short', day: 'numeric', month: 'short',
        }),
        tasaAsistencia: tasa,
        estadoGeneral:  tasa >= 80 ? 'ok' : tasa >= 60 ? 'warning' : 'error',
        nota:           tasa < 60 && s.total_registros > 0 ? 'Revisar' : null,
      };
    });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboard(token) {
  const [cursos,            setCursos]            = useState([]);
  const [sesionesRecientes, setSesionesRecientes] = useState([]);
  const [proximasClases,    setProximasClases]    = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Lista básica de cursos del docente
      const cursosBasic = await getCursos(token);
      if (!cursosBasic.length) {
        setCursos([]);
        setSesionesRecientes([]);
        setProximasClases([]);
        return;
      }

      // 2. Detalle de cada curso (necesitamos horarios, aulas y estudiantes)
      const cursosDetalle = await Promise.all(
        cursosBasic.map(async c => {
          try {
            const curso = await getCurso(token, c.id);
            const estudiantes = await getEstudiantes(token, c.id);
            return {
              ...curso,
              estudiantes: estudiantes || [],
              total_estudiantes: (estudiantes || []).length,
            };
          } catch {
            return { ...c, horarios: [], estudiantes: [], total_estudiantes: 0 };
          }
        }),
      );

      // 3. Mapear a lo que espera CourseCard
      const mappedCursos = cursosDetalle.map((c, i) => ({
        id:               c.id,
        codigo:           c.codigo ?? `C-${c.id}`,
        nombre:           c.nombre,
        aula:             formatAula(c.horarios),
        horario:          formatHorario(c.horarios),
        totalEstudiantes: c.total_estudiantes ?? 0,
        badgeVariant:     BADGE_VARIANTS[i % BADGE_VARIANTS.length],
        horarios:         c.horarios ?? [],
      }));
      setCursos(mappedCursos);

      // 4. Próximas clases del día (no requiere fetch)
      setProximasClases(computeProximasClases(cursosDetalle));

      // 5. Sesiones recientes de todos los cursos (en paralelo)
      const allSesionesByCorso = await Promise.all(
        cursosBasic.map(c =>
          getSesionesByCurso(token, c.id)
            .then(sesiones =>
              sesiones.map(s => ({
                ...s,
                cursoNombre: c.nombre,
                cursoCodigo: c.codigo,
              })),
            )
            .catch(() => []),
        ),
      );

      setSesionesRecientes(buildSesionesRecientes(allSesionesByCorso.flat()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return {
    cursos,
    sesionesRecientes,
    proximasClases,
    loading,
    error,
    reload: load,
  };
}