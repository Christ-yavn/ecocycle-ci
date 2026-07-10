-- ============================================================
-- EcoCycle CI — Migration 02 : Couche 3 (Recycleur ↔ Acheteur)
-- Tables pour les matières premières recyclées + commandes acheteur
-- + double confirmation couche 3.
-- À exécuter dans le SQL Editor de Supabase après schema.sql.
-- ============================================================

-- 0. Rendre lot_id nullable dans confirmations (couche_3 = matière, pas lot)
alter table public.confirmations alter column lot_id drop not null;

-- 1. Table public.matiere_premiere
-- Les matières premières recyclées publiées par les recycleurs.
create table if not exists public.matiere_premiere (
  id uuid primary key default gen_random_uuid(),
  recycleur_id uuid not null references public.users(id) on delete cascade,
  type_matiere text not null,
  volume_disponible_kg numeric not null default 0,
  specifications text,
  grade text,
  conditionnement text,
  photo_url text,
  status text not null default 'disponible',
  -- disponible | reservee | vendue
  acheteur_id uuid references public.users(id) on delete set null,
  date_publication timestamptz not null default now(),
  date_vente timestamptz
);

create index if not exists idx_mp_status on public.matiere_premiere(status);
create index if not exists idx_mp_recycleur on public.matiere_premiere(recycleur_id);
create index if not exists idx_mp_type on public.matiere_premiere(type_matiere);

-- 2. Insert du trigger set_lot_location déjà existant.
-- Pas besoin de nouveaux triggers pour cette table (pas de géoloc).

-- 3. RLS pour matiere_premiere
alter table public.matiere_premiere enable row level security;

-- Le recycleur voit/modifie ses matières
drop policy if exists "mp_select_own" on public.matiere_premiere;
create policy "mp_select_own" on public.matiere_premiere
  for select using (
    auth.uid() = recycleur_id
    or status = 'disponible'
    or auth.uid() = acheteur_id
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'mairie'
    )
  );

drop policy if exists "mp_insert_own" on public.matiere_premiere;
create policy "mp_insert_own" on public.matiere_premiere
  for insert with check (auth.uid() = recycleur_id);

drop policy if exists "mp_update_own" on public.matiere_premiere;
create policy "mp_update_own" on public.matiere_premiere
  for update using (
    auth.uid() = recycleur_id or auth.uid() = acheteur_id
  ) with check (
    auth.uid() = recycleur_id or auth.uid() = acheteur_id
  );

-- ============================================================
-- Fin de la migration 02
-- ============================================================