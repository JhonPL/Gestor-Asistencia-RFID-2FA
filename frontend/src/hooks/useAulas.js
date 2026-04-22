// src/hooks/useAulas.js
// Encapsula estado y operaciones CRUD de aulas.

import { useState, useCallback } from 'react';
import { getAulas, getAulaById, createAula, updateAula, deleteAula } from '../api/aulasApi';

export function useAulas(token) {
  const [aulas,   setAulas]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAulas(token);
      setAulas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

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

  return { aulas, loading, error, load, loadOne, save, deleteById };
}
