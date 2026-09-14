-- Vinculación de una instalación móvil por estudiante.
ALTER TABLE public.dispositivo_movil
  ADD COLUMN IF NOT EXISTS installation_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS dispositivo_movil_installation_key
  ON public.dispositivo_movil (installation_id)
  WHERE installation_id IS NOT NULL;

COMMENT ON COLUMN public.dispositivo_movil.installation_id IS
  'Identificador aleatorio persistente de la instalación autorizada del estudiante.';