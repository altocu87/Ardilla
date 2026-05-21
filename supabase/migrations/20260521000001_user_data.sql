-- Tabla key-value para sincronizar el estado de la app (perfil, tiendas,
-- avatares, títulos, equipados, frases, config de recompensas, imagen del
-- caracol, etc.) entre localStorage y Supabase.
--
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists user_data (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- Sin RLS (app de usuaria única, igual que las otras tablas)
alter table user_data disable row level security;
