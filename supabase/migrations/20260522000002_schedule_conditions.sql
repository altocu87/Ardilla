alter table notification_schedules
  add column if not exists condition_type text    default null,
  add column if not exists condition_days integer default 1;

-- condition_type: null | 'no_any' | 'no_diario' | 'no_caca' | 'no_emocional' | 'no_practica'
-- condition_days: cuántos días sin registro para que la condición se cumpla
