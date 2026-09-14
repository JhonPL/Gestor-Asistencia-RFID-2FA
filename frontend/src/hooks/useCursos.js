// src/hooks/useCursos.js
// Encapsula estado y operaciones CRUD de cursos.

import { useState, useCallback } from 'react';
import { getCursos, getCurso, createCurso, updateCurso, desactivarCurso } from '../api/cursosApi';

export function useCursos(token) {
  const [cursos,  setCursos]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const load = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCursos(token, { page, limit: pagination.limit });
      setCursos(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.limit]);

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

  return { cursos, loading, error, load, pagination, loadOne, save, desactivar };
}