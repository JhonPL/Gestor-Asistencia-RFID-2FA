// src/hooks/useHorarios.js
// Encapsula estado y operaciones CRUD de franjas horarias.

import { useState, useCallback } from 'react';
import {
  getHorarios,
  getHorarioById,
  createHorario,
  updateHorario,
  deleteHorario,
} from '../api/horariosApi';

export function useHorarios(token) {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHorarios(token);
      setHorarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadOne = async (id) => getHorarioById(token, id);

  const save = async (id, payload) => {
    if (id) {
      const updated = await updateHorario(token, id, payload);
      setHorarios(prev => prev.map(h => h.id === updated.id ? updated : h));
      return updated;
    } else {
      const created = await createHorario(token, payload);
      setHorarios(prev => [...prev, created]);
      return created;
    }
  };

  const deleteById = async (item) => {
    await deleteHorario(token, item.id);
    setHorarios(prev => prev.filter(h => h.id !== item.id));
  };

  return { horarios, loading, error, load, loadOne, save, deleteById };
}
