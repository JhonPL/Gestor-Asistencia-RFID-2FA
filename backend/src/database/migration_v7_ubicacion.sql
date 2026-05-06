-- ============================================================
-- Migración v7: Agregar columna verificado_ubicacion
-- Permite rastrear independientemente si biometría y ubicación pasaron
-- ============================================================

BEGIN;

-- Agregar columna si no existe
ALTER TABLE public.asistencia
ADD COLUMN IF NOT EXISTS verificado_ubicacion BOOLEAN DEFAULT false;

-- Agregar comentario
COMMENT ON COLUMN public.asistencia.verificado_ubicacion IS 'true si ubicación GPS fue dentro del campus';

-- Commit
COMMIT;
