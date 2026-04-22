// src/hooks/useDispositivos.js
import { useState, useCallback } from 'react';
import {
  getDispositivos,
  createDispositivo,
  updateDispositivo,
  cambiarEstadoDispositivo,
} from '../api/dispositivosApi';

export function useDispositivos(token) {
  const [devices,  setDevices]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDispositivos(token);
      setDevices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const save = async (formData) => {
    const isEdit = !!formData.id;
    if (isEdit) {
      const { id, ...campos } = formData;
      const updated = await updateDispositivo(token, id, campos);
      setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
    } else {
      const created = await createDispositivo(token, formData);
      setDevices(prev => [...prev, created]);
    }
  };

  const cambiarEstado = async (device, nuevoEstado) => {
    await cambiarEstadoDispositivo(token, device.id, nuevoEstado);
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, estado: nuevoEstado } : d));
  };

  return { devices, loading, error, load, save, cambiarEstado };
}