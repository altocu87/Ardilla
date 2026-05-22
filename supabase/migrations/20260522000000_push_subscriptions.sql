create table if not exists push_subscriptions (
  id          uuid        default gen_random_uuid() primary key,
  endpoint    text        not null unique,
  keys        jsonb       not null,
  created_at  timestamptz default now()
);

alter table push_subscriptions enable row level security;

-- Permitir insertar/leer/borrar sin auth (app de usuario único)
create policy "public_push_access" on push_subscriptions
  for all using (true) with check (true);
