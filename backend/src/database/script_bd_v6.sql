-- ============================================================
-- Sistema de Gestión de Asistencia con RFID
-- PostgreSQL — Script completo v6
-- Universidad Cooperativa de Colombia · Villavicencio, Meta
-- ============================================================
-- CAMBIOS v6 vs v5:
--   ✎ sesion_clase.estado  → agrega 'programada' al CHECK constraint
--                            y al DEFAULT ('activa' → 'programada')
--   + dispositivo_movil    → UNIQUE constraint en push_token
--                            (necesario para ON CONFLICT en /api/movil/dispositivo)
-- ============================================================

BEGIN;

-- ── CATÁLOGOS FIJOS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rol (
    id     SERIAL      NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    CONSTRAINT rol_pkey       PRIMARY KEY (id),
    CONSTRAINT rol_nombre_key UNIQUE (nombre),
    CONSTRAINT chk_rol_nombre CHECK (nombre IN ('docente', 'estudiante', 'administrador'))
);

INSERT INTO public.rol (nombre) VALUES
    ('docente'), ('estudiante'), ('administrador')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.metodo_verificacion (
    id     SERIAL      NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    CONSTRAINT metodo_verificacion_pkey       PRIMARY KEY (id),
    CONSTRAINT metodo_verificacion_nombre_key UNIQUE (nombre),
    CONSTRAINT chk_metodo_nombre CHECK (nombre IN ('fingerprint', 'face_id', 'ubicacion'))
);

COMMENT ON TABLE public.metodo_verificacion IS
    'Métodos del segundo factor: fingerprint=huella(Android), face_id=facial(iOS+Android), ubicacion=GPS';

INSERT INTO public.metodo_verificacion (nombre) VALUES
    ('fingerprint'), ('face_id'), ('ubicacion')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estado_asistencia (
    id     SERIAL      NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    CONSTRAINT estado_asistencia_pkey       PRIMARY KEY (id),
    CONSTRAINT estado_asistencia_nombre_key UNIQUE (nombre),
    CONSTRAINT chk_estado_asistencia_nombre CHECK (nombre IN ('Presente', 'Ausente', 'Justificado'))
);

INSERT INTO public.estado_asistencia (nombre) VALUES
    ('Presente'), ('Ausente'), ('Justificado')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estado_verificacion (
    id     SERIAL      NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    CONSTRAINT estado_verificacion_pkey       PRIMARY KEY (id),
    CONSTRAINT estado_verificacion_nombre_key UNIQUE (nombre),
    CONSTRAINT chk_estado_verificacion_nombre CHECK (nombre IN ('pendiente', 'completado', 'fallido', 'sin_app'))
);

COMMENT ON TABLE public.estado_verificacion IS
    'pendiente=esperando app | completado=2FA OK | fallido=2FA falló | sin_app=sin dispositivo registrado';

INSERT INTO public.estado_verificacion (nombre) VALUES
    ('pendiente'), ('completado'), ('fallido'), ('sin_app')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estado_dispositivo (
    id     SERIAL      NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    CONSTRAINT estado_dispositivo_pkey       PRIMARY KEY (id),
    CONSTRAINT estado_dispositivo_nombre_key UNIQUE (nombre),
    CONSTRAINT chk_estado_dispositivo_nombre CHECK (nombre IN ('Activo', 'Inactivo', 'Mantenimiento'))
);

INSERT INTO public.estado_dispositivo (nombre) VALUES
    ('Activo'), ('Inactivo'), ('Mantenimiento')
ON CONFLICT DO NOTHING;

-- ── ESTRUCTURA ACADÉMICA ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.facultad (
    id         SERIAL       NOT NULL,
    nombre     VARCHAR(100) NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT facultad_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.programa (
    id          SERIAL       NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    codigo      VARCHAR(20),
    facultad_id INTEGER      NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT programa_pkey          PRIMARY KEY (id),
    CONSTRAINT programa_codigo_key    UNIQUE (codigo),
    CONSTRAINT programa_facultad_fkey FOREIGN KEY (facultad_id)
        REFERENCES public.facultad (id) ON DELETE CASCADE
);

-- ── PERSONA ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.persona (
    id             SERIAL       NOT NULL,
    microsoft_id   VARCHAR(100),
    rol_id         INTEGER      NOT NULL,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100) NOT NULL,
    correo         VARCHAR(100) NOT NULL,
    codigo_tarjeta VARCHAR(50),
    programa_id    INTEGER,
    activo         BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT persona_pkey               PRIMARY KEY (id),
    CONSTRAINT persona_correo_key         UNIQUE (correo),
    CONSTRAINT persona_microsoft_key      UNIQUE (microsoft_id),
    CONSTRAINT persona_codigo_tarjeta_key UNIQUE (codigo_tarjeta),
    CONSTRAINT persona_rol_fkey           FOREIGN KEY (rol_id)
        REFERENCES public.rol (id),
    CONSTRAINT persona_programa_fkey      FOREIGN KEY (programa_id)
        REFERENCES public.programa (id) ON DELETE SET NULL
);

COMMENT ON COLUMN public.persona.microsoft_id   IS 'ID único de Microsoft OAuth. NULL hasta el primer login.';
COMMENT ON COLUMN public.persona.codigo_tarjeta IS 'Código RFID. NULL para administradores puros.';
COMMENT ON COLUMN public.persona.programa_id    IS 'Solo aplica para estudiantes y docentes.';

CREATE INDEX IF NOT EXISTS idx_persona_correo    ON public.persona (correo);
CREATE INDEX IF NOT EXISTS idx_persona_microsoft ON public.persona (microsoft_id);
CREATE INDEX IF NOT EXISTS idx_persona_tarjeta   ON public.persona (codigo_tarjeta);

-- ── HORARIOS Y AULAS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dia_semana (
    id     INTEGER     NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    CONSTRAINT dia_semana_pkey       PRIMARY KEY (id),
    CONSTRAINT dia_semana_nombre_key UNIQUE (nombre)
);

INSERT INTO public.dia_semana (id, nombre) VALUES
    (1, 'Lunes'), (2, 'Martes'), (3, 'Miércoles'),
    (4, 'Jueves'), (5, 'Viernes'), (6, 'Sábado'), (7, 'Domingo')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.horario (
    id            SERIAL    NOT NULL,
    dia_semana_id INTEGER   NOT NULL,
    hora_inicio   TIME      NOT NULL,
    hora_fin      TIME      NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT horario_pkey            PRIMARY KEY (id),
    CONSTRAINT horario_dia_semana_fkey FOREIGN KEY (dia_semana_id)
        REFERENCES public.dia_semana (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aula (
    id         SERIAL       NOT NULL,
    numero     VARCHAR(10)  NOT NULL,
    nombre     VARCHAR(100),
    edificio   VARCHAR(50),
    piso       INTEGER,
    capacidad  INTEGER,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT aula_pkey       PRIMARY KEY (id),
    CONSTRAINT aula_numero_key UNIQUE (numero)
);

CREATE TABLE IF NOT EXISTS public.dispositivo_rfid (
    id                    SERIAL      NOT NULL,
    codigo                VARCHAR(50) NOT NULL,
    aula_id               INTEGER,
    ip_address            VARCHAR(45),
    mac_address           VARCHAR(17),
    estado_dispositivo_id INTEGER     NOT NULL,
    ultima_conexion       TIMESTAMP,
    created_at            TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dispositivo_rfid_pkey        PRIMARY KEY (id),
    CONSTRAINT dispositivo_rfid_codigo_key  UNIQUE (codigo),
    CONSTRAINT dispositivo_rfid_aula_fkey   FOREIGN KEY (aula_id)
        REFERENCES public.aula (id) ON DELETE SET NULL,
    CONSTRAINT dispositivo_rfid_estado_fkey FOREIGN KEY (estado_dispositivo_id)
        REFERENCES public.estado_dispositivo (id)
);

CREATE INDEX IF NOT EXISTS idx_dispositivo_rfid_estado
    ON public.dispositivo_rfid (estado_dispositivo_id);

-- ── CURSOS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.curso (
    id           SERIAL       NOT NULL,
    nombre       VARCHAR(100) NOT NULL,
    codigo       VARCHAR(20),
    fecha_inicio DATE         NOT NULL,
    fecha_fin    DATE         NOT NULL,
    persona_id   INTEGER,
    activo       BOOLEAN      DEFAULT true,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT curso_pkey         PRIMARY KEY (id),
    CONSTRAINT curso_codigo_key   UNIQUE (codigo),
    CONSTRAINT curso_persona_fkey FOREIGN KEY (persona_id)
        REFERENCES public.persona (id) ON DELETE SET NULL
);

COMMENT ON COLUMN public.curso.persona_id IS 'Persona con rol docente asignada al curso.';

CREATE TABLE IF NOT EXISTS public.aula_curso_horario (
    id         SERIAL    NOT NULL,
    aula_id    INTEGER   NOT NULL,
    curso_id   INTEGER   NOT NULL,
    horario_id INTEGER   NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT aula_curso_horario_pkey         PRIMARY KEY (id),
    CONSTRAINT uq_aula_horario                 UNIQUE (aula_id, horario_id),
    CONSTRAINT aula_curso_horario_aula_fkey    FOREIGN KEY (aula_id)
        REFERENCES public.aula (id) ON DELETE CASCADE,
    CONSTRAINT aula_curso_horario_curso_fkey   FOREIGN KEY (curso_id)
        REFERENCES public.curso (id) ON DELETE CASCADE,
    CONSTRAINT aula_curso_horario_horario_fkey FOREIGN KEY (horario_id)
        REFERENCES public.horario (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.lista_estudiantes (
    id                SERIAL    NOT NULL,
    persona_id        INTEGER   NOT NULL,
    curso_id          INTEGER   NOT NULL,
    activo            BOOLEAN   NOT NULL DEFAULT true,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lista_estudiantes_pkey         PRIMARY KEY (id),
    CONSTRAINT uq_estudiante_curso            UNIQUE (persona_id, curso_id),
    CONSTRAINT lista_estudiantes_persona_fkey FOREIGN KEY (persona_id)
        REFERENCES public.persona (id) ON DELETE CASCADE,
    CONSTRAINT lista_estudiantes_curso_fkey   FOREIGN KEY (curso_id)
        REFERENCES public.curso (id) ON DELETE CASCADE
);

COMMENT ON COLUMN public.lista_estudiantes.activo IS
    'true=inscripción vigente, false=estudiante retirado/inactivo del curso.';

-- ── SESIÓN DE CLASE ───────────────────────────────────────────
-- v6: estado DEFAULT 'programada' y CHECK incluye los 3 valores posibles.
--     programada = pre-generada al crear el curso (aún no ocurrió)
--     activa     = docente abrió pasando su tarjeta RFID
--     cerrada    = docente cerró al terminar la clase

CREATE TABLE IF NOT EXISTS public.sesion_clase (
    id                    SERIAL      NOT NULL,
    aula_curso_horario_id INTEGER     NOT NULL,
    persona_id            INTEGER     NOT NULL,
    fecha                 DATE        NOT NULL,
    hora_inicio_real      TIME,
    hora_fin_real         TIME,
    estado                VARCHAR(12) NOT NULL DEFAULT 'programada',
    created_at            TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sesion_clase_pkey         PRIMARY KEY (id),
    CONSTRAINT uq_sesion_dia             UNIQUE (aula_curso_horario_id, fecha),
    CONSTRAINT sesion_clase_ach_fkey     FOREIGN KEY (aula_curso_horario_id)
        REFERENCES public.aula_curso_horario (id) ON DELETE CASCADE,
    CONSTRAINT sesion_clase_persona_fkey FOREIGN KEY (persona_id)
        REFERENCES public.persona (id) ON DELETE CASCADE,
    CONSTRAINT chk_sesion_estado         CHECK (estado IN ('programada', 'activa', 'cerrada'))
);

COMMENT ON COLUMN public.sesion_clase.persona_id IS 'Docente asignado al curso (se copia al pre-generar sesiones).';
COMMENT ON COLUMN public.sesion_clase.estado     IS
    'programada=sesión pendiente (pre-generada) | activa=docente abrió con tarjeta | cerrada=docente cerró';

CREATE INDEX IF NOT EXISTS idx_sesion_estado ON public.sesion_clase (estado);
CREATE INDEX IF NOT EXISTS idx_sesion_ach    ON public.sesion_clase (aula_curso_horario_id);

-- ── ASISTENCIA ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.asistencia (
    id                     SERIAL        NOT NULL,
    lista_estudiantes_id   INTEGER       NOT NULL,
    sesion_clase_id        INTEGER       NOT NULL,
    fecha_registro         DATE          NOT NULL,
    hora_registro          TIME          NOT NULL,
    estado_asistencia_id   INTEGER       NOT NULL,
    estado_verificacion_id INTEGER       NOT NULL,
    verificado_biometrico  BOOLEAN       DEFAULT false,
    latitud                NUMERIC(10,8),
    longitud               NUMERIC(11,8),
    created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT asistencia_pkey              PRIMARY KEY (id),
    CONSTRAINT uq_asistencia_sesion         UNIQUE (lista_estudiantes_id, sesion_clase_id),
    CONSTRAINT asistencia_lista_fkey        FOREIGN KEY (lista_estudiantes_id)
        REFERENCES public.lista_estudiantes (id) ON DELETE CASCADE,
    CONSTRAINT asistencia_sesion_fkey       FOREIGN KEY (sesion_clase_id)
        REFERENCES public.sesion_clase (id) ON DELETE CASCADE,
    CONSTRAINT asistencia_estado_fkey       FOREIGN KEY (estado_asistencia_id)
        REFERENCES public.estado_asistencia (id),
    CONSTRAINT asistencia_estado_verif_fkey FOREIGN KEY (estado_verificacion_id)
        REFERENCES public.estado_verificacion (id)
);

COMMENT ON COLUMN public.asistencia.estado_asistencia_id   IS 'Presente | Ausente | Justificado';
COMMENT ON COLUMN public.asistencia.estado_verificacion_id IS 'pendiente | completado | fallido | sin_app';

CREATE INDEX IF NOT EXISTS idx_asistencia_lista  ON public.asistencia (lista_estudiantes_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_sesion ON public.asistencia (sesion_clase_id);

-- ── APP MÓVIL ─────────────────────────────────────────────────
-- v6: se agrega UNIQUE constraint en push_token para que
--     ON CONFLICT (push_token) DO UPDATE funcione en /api/movil/dispositivo.

CREATE TABLE IF NOT EXISTS public.dispositivo_movil (
    id            SERIAL       NOT NULL,
    persona_id    INTEGER      NOT NULL,
    push_token    VARCHAR(300) NOT NULL,
    plataforma    VARCHAR(10)  NOT NULL,
    activo        BOOLEAN      DEFAULT true,
    ultima_sesion TIMESTAMP,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dispositivo_movil_pkey           PRIMARY KEY (id),
    CONSTRAINT dispositivo_movil_push_token_key UNIQUE (push_token),
    CONSTRAINT dispositivo_movil_persona_fkey   FOREIGN KEY (persona_id)
        REFERENCES public.persona (id) ON DELETE CASCADE,
    CONSTRAINT chk_plataforma CHECK (plataforma IN ('ios', 'android'))
);

COMMENT ON COLUMN public.dispositivo_movil.plataforma IS
    'ios | android — solo 2 valores posibles, CHECK constraint es suficiente.';
COMMENT ON COLUMN public.dispositivo_movil.activo IS
    'Solo un dispositivo activo por persona. Al registrar uno nuevo, el anterior queda en false.';
COMMENT ON CONSTRAINT dispositivo_movil_push_token_key ON public.dispositivo_movil IS
    'Garantiza unicidad del token para soportar ON CONFLICT (push_token) DO UPDATE en /api/movil/dispositivo.';

CREATE INDEX IF NOT EXISTS idx_dispositivo_persona ON public.dispositivo_movil (persona_id);
-- El índice sobre push_token lo crea automáticamente el UNIQUE constraint arriba.

CREATE TABLE IF NOT EXISTS public.verificacion_biometrica (
    id                     SERIAL        NOT NULL,
    asistencia_id          INTEGER       NOT NULL,
    dispositivo_movil_id   INTEGER       NOT NULL,
    metodo_verificacion_id INTEGER       NOT NULL,
    exitoso                BOOLEAN       NOT NULL,
    latitud                NUMERIC(10,8) NOT NULL,
    longitud               NUMERIC(11,8) NOT NULL,
    dentro_campus          BOOLEAN       NOT NULL,
    created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT verificacion_biometrica_pkey             PRIMARY KEY (id),
    CONSTRAINT verificacion_biometrica_asistencia_fkey  FOREIGN KEY (asistencia_id)
        REFERENCES public.asistencia (id) ON DELETE CASCADE,
    CONSTRAINT verificacion_biometrica_dispositivo_fkey FOREIGN KEY (dispositivo_movil_id)
        REFERENCES public.dispositivo_movil (id) ON DELETE CASCADE,
    CONSTRAINT verificacion_biometrica_metodo_fkey      FOREIGN KEY (metodo_verificacion_id)
        REFERENCES public.metodo_verificacion (id)
);

COMMENT ON TABLE public.verificacion_biometrica IS
    'Registra cada intento del segundo factor: método, resultado GPS y si estaba dentro del campus.';

CREATE INDEX IF NOT EXISTS idx_verif_asistencia  ON public.verificacion_biometrica (asistencia_id);
CREATE INDEX IF NOT EXISTS idx_verif_dispositivo ON public.verificacion_biometrica (dispositivo_movil_id);

COMMIT;
