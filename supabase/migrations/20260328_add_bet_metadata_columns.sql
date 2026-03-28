alter table public.bets
  add column if not exists bookmaker text,
  add column if not exists sport text,
  add column if not exists "time" text,
  add column if not exists probability numeric;
