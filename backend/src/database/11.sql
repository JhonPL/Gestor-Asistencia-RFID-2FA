-- Permite reutilizar una combinacion aula-horario en cursos diferentes.
-- El backend valida que sus rangos de fechas no se solapen.
BEGIN;

ALTER TABLE public.aula_curso_horario
  DROP CONSTRAINT IF EXISTS uq_aula_horario;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'uq_aula_curso_horario'
       AND conrelid = 'public.aula_curso_horario'::regclass
  ) THEN
    ALTER TABLE public.aula_curso_horario
      ADD CONSTRAINT uq_aula_curso_horario
      UNIQUE (aula_id, curso_id, horario_id);
  END IF;
END;
$$;

COMMIT;