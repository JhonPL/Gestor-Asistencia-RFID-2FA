// src/hooks/usePersonas.js
// Encapsula todo el estado y operaciones CRUD de personas.
// AdminPage solo importa este hook y llama a sus funciones.

import { useState, useCallback } from 'react';
import {
  getPersonas,
  createPersona,
  updatePersona,
  toggleActivoPersona,
  linkTarjetaPersona,
  resetDispositivoPersona,
} from '../api/personasApi';

function normalizePersona(p) {
  return {
    ...p,
    codigoTarjeta: p.codigo_tarjeta ?? null,
    programa_id:   p.programa_id   ?? null,
  };
}

export function usePersonas(token) {
  const [personas,    setPersonas]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [pagination,  setPagination]  = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const load = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPersonas(token, { page, limit: pagination.limit });
      setPersonas(data.items.map(normalizePersona));
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.limit]);

  const save = async (formData) => {
    const isEdit = formData.id && Number.isInteger(formData.id);
    if (isEdit) {
      const { nombre, apellido, correo, rol, activo, programa_id, codigoTarjeta } = formData;
      const updated = await updatePersona(token, formData.id, {
        nombre,
        apellido,
        correo,
        rol,
        activo,
        programa_id: programa_id || null,
        codigo_tarjeta: codigoTarjeta || null,
      });
      setPersonas(prev =>
        prev.map(p => p.id === updated.id ? normalizePersona({ ...p, ...updated }) : p)
      );
    } else {
      const { nombre, apellido, correo, rol, programa_id } = formData;
      const created = await createPersona(token, {
        nombre, apellido, correo, rol, programa_id: programa_id || null,
      });
      setPersonas(prev => [...prev, normalizePersona(created)]);
    }
  };

  const toggleActivo = async (persona) => {
    const updated = await toggleActivoPersona(token, persona.id, !persona.activo);
    setPersonas(prev =>
      prev.map(p => p.id === updated.id ? normalizePersona({ ...p, ...updated }) : p)
    );
  };

  const linkCard = async (personaId, codigoTarjeta) => {
    const updated = await linkTarjetaPersona(token, personaId, codigoTarjeta);
    setPersonas(prev =>
      prev.map(p => p.id === updated.id
        ? { ...p, codigo_tarjeta: updated.codigo_tarjeta, codigoTarjeta: updated.codigo_tarjeta }
        : p
      )
    );
  };

  const resetDevice = async (persona) => {
    const updated = await resetDispositivoPersona(token, persona.id);
    setPersonas(prev => prev.map(p => p.id === updated.persona_id
      ? { ...p, dispositivo_liberado: true }
      : p
    ));
    return updated;
  };

  return { personas, loading, error, load, pagination, save, toggleActivo, linkCard, resetDevice };
}