-- Ejecutar en Supabase SQL Editor para crear la tabla de Registro Emocional

CREATE TABLE IF NOT EXISTS emocional_logs (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT,
  estado      TEXT    NOT NULL,
  estado_emoji TEXT   NOT NULL DEFAULT '',
  donde       TEXT[]  NOT NULL DEFAULT '{}',
  intensidad  INTEGER NOT NULL DEFAULT 5,
  necesidad   TEXT[]  NOT NULL DEFAULT '{}',
  mood        TEXT,
  logged_at   TEXT    NOT NULL
);
