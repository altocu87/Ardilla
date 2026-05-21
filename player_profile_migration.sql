-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS player_profile (
  id            UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  user_key      TEXT      NOT NULL UNIQUE DEFAULT 'vicky',
  xp            INTEGER   NOT NULL DEFAULT 0,
  bellotas      INTEGER   NOT NULL DEFAULT 0,
  daily_awards  JSONB     NOT NULL DEFAULT '{}',
  streak_awards INTEGER[] NOT NULL DEFAULT '{}'
);

-- Perfil inicial
INSERT INTO player_profile (user_key, xp, bellotas, daily_awards, streak_awards)
VALUES ('vicky', 0, 0, '{}', '{}')
ON CONFLICT (user_key) DO NOTHING;
