// src/components/admin/tableColumns.jsx
// Define las columnas de cada tabla del panel de administración.
// Se separan de los componentes para que sean fáciles de modificar sin tocar el layout.

import React from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { StatusDot } from './GenericTable';
import { durTexto } from './adminUtils';

const Code = styled.code`
  font-size: ${theme.fontSizes.xs};
  background: ${theme.colors.surfaceContainerLow};
  padding: 2px 6px;
  border-radius: 4px;
`;

const Badge = styled.span`
  background: ${({ $bg }) => $bg}; color: ${({ $color }) => $color};
  padding: 2px 8px; border-radius: 99px;
  font-size: ${theme.fontSizes.xs}; font-weight: 700;
`;

const estadoDevMeta = {
  Activo:        { bg: theme.colors.secondaryFixed,       color: theme.colors.secondary },
  Inactivo:      { bg: theme.colors.surfaceContainerHigh, color: theme.colors.outline },
  Mantenimiento: { bg: theme.colors.tertiaryFixed,        color: '#7b2e12' },
};

export const colsFacultades = [
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'total_programas', label: 'Programas', align: 'center',
    render: (v) => (
      <span style={{ color: theme.colors.outline, fontSize: theme.fontSizes.xs }}>
        {v ?? 0} programa{(v ?? 0) !== 1 ? 's' : ''}
      </span>
    ),
  },
  {
    key: 'created_at', label: 'Creada',
    render: (v) => v
      ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
  },
];

export const colsProgramas = [
  { key: 'nombre',   label: 'Programa' },
  { key: 'codigo',   label: 'Código',   render: (v) => v ? <Code>{v}</Code> : <span style={{ color: theme.colors.outline }}>—</span> },
  { key: 'facultad', label: 'Facultad' },
];

export const colsHorarios = [
  { key: 'dia',         label: 'Día' },
  { key: 'hora_inicio', label: 'Inicio' },
  { key: 'hora_fin',    label: 'Fin' },
  {
    key: 'hora_inicio', label: 'Duración',
    render: (v, row) => {
      const d = durTexto(row.hora_inicio, row.hora_fin);
      return d
        ? <Badge $bg={theme.colors.primaryFixed} $color={theme.colors.primary}>⏱ {d}</Badge>
        : '—';
    },
  },
  {
    key: 'created_at', label: 'Creado',
    render: (v) => v
      ? new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
  },
];

export const colsAulas = [
  { key: 'numero',    label: 'Número' },
  { key: 'nombre',    label: 'Nombre' },
  { key: 'edificio',  label: 'Edificio' },
  { key: 'piso',      label: 'Piso',      align: 'center' },
  { key: 'capacidad', label: 'Capacidad', align: 'center', render: (v) => v ? `${v} pers.` : '—' },
];

export const colsCursos = [
  { key: 'codigo', label: 'Código', render: (v) => v ? <Code>{v}</Code> : '—' },
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'docente', label: 'Docente',
    render: (v) => v ?? <span style={{ color: theme.colors.error, fontSize: theme.fontSizes.xs }}>Sin asignar</span>,
  },
  {
    key: 'total_estudiantes', label: 'Inscritos', align: 'center',
    render: (v) => <Badge $bg={theme.colors.primaryFixed} $color={theme.colors.primary}>{v ?? 0}</Badge>,
  },
  { key: 'fecha_inicio', label: 'Inicio', render: (v) => v?.slice(0, 10) ?? '—' },
  { key: 'fecha_fin',    label: 'Fin',    render: (v) => v?.slice(0, 10) ?? '—' },
  { key: 'activo',       label: 'Estado', render: (v) => <StatusDot active={v} /> },
];

export const colsDevices = [
  {
    key: 'codigo', label: 'Código',
    render: (v) => (
      <code style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: theme.fontSizes.sm }}>
        {v}
      </code>
    ),
  },
  { key: 'aula', label: 'Aula', render: (v) => v ?? <span style={{ color: theme.colors.outline }}>—</span> },
  {
    key: 'ip_address', label: 'IP',
    render: (v) => v
      ? <code style={{ fontFamily: 'Courier New, monospace', fontSize: theme.fontSizes.xs, color: theme.colors.onSurfaceVariant }}>{v}</code>
      : <span style={{ color: theme.colors.outline }}>—</span>,
  },
  {
    key: 'mac_address', label: 'MAC',
    render: (v) => v
      ? <code style={{ fontFamily: 'Courier New, monospace', fontSize: theme.fontSizes.xs, color: theme.colors.onSurfaceVariant }}>{v}</code>
      : <span style={{ color: theme.colors.outline }}>—</span>,
  },
  {
    key: 'estado', label: 'Estado',
    render: (v) => {
      const m = estadoDevMeta[v] ?? estadoDevMeta.Inactivo;
      return <Badge $bg={m.bg} $color={m.color}>{v}</Badge>;
    },
  },
  {
    key: 'ultima_conexion', label: 'Última conexión',
    render: (v) => v
      ? new Date(v).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : <span style={{ color: theme.colors.outline }}>—</span>,
  },
];