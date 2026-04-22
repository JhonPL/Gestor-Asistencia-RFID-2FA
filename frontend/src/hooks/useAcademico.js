// src/hooks/useAcademico.js
import { useState, useCallback } from 'react';
import {
  getFacultades, createFacultad, updateFacultad, deleteFacultad,
  getProgramas,  createPrograma,  updatePrograma,  deletePrograma,
} from '../api/academicoApi';

export function useAcademico(token) {
  const [facultades, setFacultades] = useState([]);
  const [programas,  setProgramas]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [facs, progs] = await Promise.all([getFacultades(token), getProgramas(token)]);
      setFacultades(facs);
      setProgramas(progs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const saveFacultad = async (data) => {
    if (data.id) {
      const updated = await updateFacultad(token, data.id, { nombre: data.nombre });
      setFacultades(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f));
    } else {
      const created = await createFacultad(token, { nombre: data.nombre });
      setFacultades(prev => [...prev, { ...created, total_programas: 0 }]);
    }
  };

  const deleteFacultadById = async (item) => {
    await deleteFacultad(token, item.id);
    setFacultades(prev => prev.filter(f => f.id !== item.id));
    setProgramas(prev => prev.filter(pr => pr.facultad_id !== item.id));
  };

  const savePrograma = async (data) => {
    const payload = { nombre: data.nombre, codigo: data.codigo || null, facultad_id: data.facultad_id };
    if (data.id) {
      const updated = await updatePrograma(token, data.id, payload);
      setProgramas(prev => prev.map(pr => pr.id === updated.id ? updated : pr));
    } else {
      const created = await createPrograma(token, payload);
      setProgramas(prev => [...prev, created]);
      setFacultades(prev => prev.map(f =>
        f.id === created.facultad_id ? { ...f, total_programas: (f.total_programas ?? 0) + 1 } : f
      ));
    }
  };

  const deleteProgramaById = async (item) => {
    await deletePrograma(token, item.id);
    setProgramas(prev => prev.filter(pr => pr.id !== item.id));
    setFacultades(prev => prev.map(f =>
      f.id === item.facultad_id ? { ...f, total_programas: Math.max(0, (f.total_programas ?? 1) - 1) } : f
    ));
  };

  return {
    facultades, programas, loading, error, load,
    saveFacultad, deleteFacultadById,
    savePrograma, deleteProgramaById,
  };
}