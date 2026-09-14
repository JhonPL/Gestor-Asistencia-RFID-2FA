// src/hooks/useAulas.js
// Encapsula estado y operaciones CRUD de aulas.

import { useState, useCallback } from 'react';
import { getAulas, getAulaById, createAula, updateAula, deleteAula } from '../api/aulasApi';

export function useAulas(token) {
  const [aulas,   setAulas]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const load = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAulas(token, { page, limit: pagination.limit });
      setAulas(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.limit]);

  const loadOne = async (id) => getAulaById(token, id);

  const save = async (id, payload) => {
    if (id) {
      const updated = await updateAula(token, id, payload);
      setAulas(prev => prev.map(a => a.id === updated.id ? updated : a));
      return updated;
    } else {
      const created = await createAula(token, payload);
      setAulas(prev => [...prev, created]);
      return created;
    }
  };

  const deleteById = async (item) => {
    await deleteAula(token, item.id);
    setAulas(prev => prev.filter(a => a.id !== item.id));
  };

  return { aulas, loading, error, load, pagination, loadOne, save, deleteById };
}
