// src/hooks/useCursos.js
// Encapsula estado y operaciones CRUD de cursos.

import { useState, useCallback } from 'react';
import { getCursos, getCurso, createCurso, updateCurso, desactivarCurso } from '../api/cursosApi';

export function useCursos(token) {
  const [cursos,  setCursos]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCursos(token);
      setCursos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadOne = async (id) => getCurso(token, id);

  const save = async (id, payload) => {
    if (id) {
      const updated = await updateCurso(token, id, payload);
      setCursos(prev => prev.map(c => c.id === updated.id ? updated : c));
      return updated;
    } else {
      const created = await createCurso(token, payload);
      setCursos(prev => [...prev, created]);
      return created;
    }
  };

  const desactivar = async (item) => {
    await desactivarCurso(token, item.id);
    setCursos(prev => prev.map(c => c.id === item.id ? { ...c, activo: false } : c));
  };

  return { cursos, loading, error, load, loadOne, save, desactivar };
}