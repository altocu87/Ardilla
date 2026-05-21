-- Tabla para logs de las prácticas P1, P2 y P3
-- Ejecutar en el SQL Editor de Supabase

create table if not exists practice_logs (
  id         uuid        primary key default gen_random_uuid(),
  practice   text        not null check (practice in ('p1', 'p2', 'p3')),
  data       jsonb       not null default '{}',
  logged_at  timestamptz not null default now()
);

-- Índice para filtrar por práctica
create index if not exists practice_logs_practice_idx on practice_logs (practice);

-- Índice para ordenar por fecha
create index if not exists practice_logs_logged_at_idx on practice_logs (logged_at desc);
