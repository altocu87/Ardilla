create table if not exists notification_schedules (
  id           uuid        default gen_random_uuid() primary key,
  emoji        text        not null default '🐿️',
  title        text        not null,
  body         text        not null,
  hour         int         not null check (hour >= 0 and hour <= 23),
  minute       int         not null default 0 check (minute >= 0 and minute <= 59),
  days         int[]       not null default '{1,2,3,4,5,6,0}',
  active       boolean     not null default true,
  last_sent_at timestamptz,
  created_at   timestamptz default now()
);

alter table notification_schedules enable row level security;

create policy "public_schedule_access" on notification_schedules
  for all using (true) with check (true);

-- Habilitar pg_cron y pg_net si no están activos
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Cron que comprueba horarios cada hora en punto
select cron.schedule(
  'ardilla-notifications',
  '0 * * * *',
  $$
    select net.http_post(
      url     := 'https://kfqcayidcbemuocnprjx.supabase.co/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := '{"mode":"scheduled"}'::jsonb
    );
  $$
);
