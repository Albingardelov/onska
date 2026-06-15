-- ==============================================
-- ÖNSKA – Migration: "alltid öppet" för fantasier
-- Klistra in i Supabase SQL Editor och kör en gång.
-- ==============================================

-- Profil-flagga: när true räknas alla användarens snusk-fantasier
-- som öppna varje dag, utan att rader behövs i service_availability.
alter table public.profiles
  add column if not exists always_open boolean not null default false;
