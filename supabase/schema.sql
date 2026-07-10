-- ============================================================
-- EcoCycle CI — Schéma de base de données Supabase
-- À exécuter dans le SQL Editor de Supabase (projet zuaohociddfdwaygdrpl).
-- Couche 2 — Auth, tables, PostGIS, RLS, triggers.
-- ============================================================

-- 0. Extensions
create extension if not exists postgis;
create extension if not exists "pgcrypto";

-- 1. Enums
do $$ begin
  create type user_role as enum (
    'producteur','collecteur','recycleur','acheteur','mairie','citoyen'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type lot_status as enum (
    'publie','reserve','collecte','livre_recycleur','traite'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type type_dechet as enum (
    'plastique','metal','papier_carton','verre','organique',
    'electronique','textile','mixte','inconnu'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type confirmation_step as enum ('couche_1','couche_2','couche_3');
exception when duplicate_object then null; end $$;

do $$ begin
  create type confirmation_status as enum ('en_attente','valide','litige');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stock_status as enum ('disponible','reserve','livre');
exception when duplicate_object then null; end $$;

do $$ begin
  create type signalement_status as enum ('nouveau','pris_en_charge','resolu');
exception when duplicate_object then null; end $$;

do $$ begin
  create type abonnement_plan as enum ('mensuel','annuel','institutionnel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type abonnement_statut as enum ('actif','expire','suspendu','en_attente');
exception when duplicate_object then null; end $$;

-- 2. Table public.users (profil étendu, lié à auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'citoyen',
  name text not null default '',
  phone text not null default '',
  email text,
  commune text,
  quartier text,
  type_producteur text,
  points_balance integer not null default 0,
  points_total integer not null default 0,
  statut_abonnement abonnement_statut not null default 'en_attente',
  date_inscription timestamptz not null default now()
);

-- 3. Table public.lots
create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  producteur_id uuid not null references public.users(id) on delete cascade,
  type_dechet type_dechet not null default 'inconnu',
  status lot_status not null default 'publie',
  score_tri integer,
  volume_ia numeric,
  weight_real numeric,
  latitude double precision,
  longitude double precision,
  location geometry(Point,4326),
  adresse_texte text,
  commune text,
  quartier text,
  photo_url text,
  disponibilite text,
  note text,
  collecteur_id uuid references public.users(id) on delete set null,
  date_publication timestamptz not null default now(),
  date_collecte timestamptz,
  date_livraison timestamptz
);

-- Index pour la carte (lots publiés par zone)
create index if not exists idx_lots_status on public.lots(status);
create index if not exists idx_lots_location on public.lots using GIST(location);
create index if not exists idx_lots_producteur on public.lots(producteur_id);
create index if not exists idx_lots_collecteur on public.lots(collecteur_id);

-- 4. Table public.analyse_ia
create table if not exists public.analyse_ia (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid references public.lots(id) on delete cascade,
  score_qualite integer not null default 0,
  score_tri integer not null default 1,
  type_dominant text not null default 'inconnu',
  volume_estime numeric not null default 0,
  etat text not null default 'inconnu',
  collectable boolean not null default true,
  recommandations jsonb not null default '[]'::jsonb,
  items_trouves jsonb,
  fallback_used boolean not null default false,
  confidence_score numeric,
  date_analyse timestamptz not null default now()
);

-- 5. Table public.confirmations
create table if not exists public.confirmations (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots(id) on delete cascade,
  step confirmation_step not null,
  actor_a_id uuid references public.users(id) on delete set null,
  actor_a_confirmed boolean not null default false,
  actor_a_at timestamptz,
  actor_b_id uuid references public.users(id) on delete set null,
  actor_b_confirmed boolean not null default false,
  actor_b_at timestamptz,
  status confirmation_status not null default 'en_attente',
  poids_reel_kg numeric,
  note text,
  created_at timestamptz not null default now()
);

-- 6. Table public.stocks
create table if not exists public.stocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  type_matiere text not null,
  weight_kg numeric not null default 0,
  status stock_status not null default 'disponible',
  date_mise_a_jour timestamptz not null default now()
);

-- 7. Table public.point_transactions
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  producteur_id uuid not null references public.users(id) on delete cascade,
  lot_id uuid references public.lots(id) on delete set null,
  points integer not null,
  motif text not null default 'collecte',
  date_credit timestamptz not null default now()
);

-- 8. Table public.signalements
create table if not exists public.signalements (
  id uuid primary key default gen_random_uuid(),
  citoyen_id uuid references public.users(id) on delete set null,
  latitude double precision,
  longitude double precision,
  location geometry(Point,4326),
  commune text,
  quartier text,
  description text,
  photo_url text,
  status signalement_status not null default 'nouveau',
  date_signalement timestamptz not null default now(),
  date_prise_en_charge timestamptz,
  date_resolution timestamptz
);
create index if not exists idx_signalements_status on public.signalements(status);
create index if not exists idx_signalements_location on public.signalements using GIST(location);

-- 9. Table public.abonnements
create table if not exists public.abonnements (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid not null references public.users(id) on delete cascade,
  plan abonnement_plan not null default 'mensuel',
  date_debut timestamptz not null default now(),
  date_fin timestamptz,
  statut abonnement_statut not null default 'en_attente',
  montant_fcfa integer
);

-- ============================================================
-- 10. TRIGGERS
-- ============================================================

-- 10a. Création automatique du profil public.users à l'inscription
-- Le rôle est lu dans raw_user_meta_data->>'role' (passé par signUp).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, role, name, phone, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'citoyen'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 10b. Crédit automatique des points après double confirmation couche 1
-- Quand confirmations.status passe à 'valide' pour couche_1,
-- crédite les points au producteur (basé sur score_tri + weight_real).
create or replace function public.credit_points_on_confirmation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_lot public.lots%rowtype;
  v_score integer;
  v_poids numeric;
  v_coef_tri numeric;
  v_coef_vol numeric;
  v_points integer;
begin
  -- Seulement si couche_1 validée
  if new.step <> 'couche_1' or new.status <> 'valide' then
    return new;
  end if;

  select * into v_lot from public.lots where id = new.lot_id;
  if not found then return new; end if;

  v_score := coalesce(v_lot.score_tri, 1);
  v_poids := coalesce(new.poids_reel_kg, v_lot.weight_real, 0);

  -- Coefficient de tri
  v_coef_tri := case
    when v_score >= 5 then 3
    when v_score = 4 then 2
    when v_score = 3 then 1
    else 0
  end;

  -- Coefficient de volume
  v_coef_vol := case
    when v_poids > 100 then 5
    when v_poids > 50 then 3
    when v_poids > 20 then 2
    when v_poids > 5 then 1
    else 0.5
  end;

  v_points := greatest(1, round(5 * v_coef_tri * v_coef_vol)::integer);

  -- Créditer le producteur
  update public.users
    set points_balance = points_balance + v_points,
        points_total = points_total + v_points
    where id = v_lot.producteur_id;

  -- Tracer la transaction
  insert into public.point_transactions (producteur_id, lot_id, points, motif)
    values (v_lot.producteur_id, v_lot.id, v_points, 'collecte_couche_1');

  return new;
end;
$$;

drop trigger if exists on_confirmation_validated on public.confirmations;
create trigger on_confirmation_validated
  after update on public.confirmations
  for each row
  when (old.status <> 'valide' and new.status = 'valide')
  execute function public.credit_points_on_confirmation();

-- 10c. Auto-géolocalisation : remplir location depuis lat/lng
create or replace function public.set_lot_location()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326);
  end if;
  return new;
end;
$$;

drop trigger if exists on_lot_set_location on public.lots;
create trigger on_lot_set_location
  before insert or update on public.lots
  for each row execute function public.set_lot_location();

create or replace function public.set_signalement_location()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326);
  end if;
  return new;
end;
$$;

drop trigger if exists on_signalement_set_location on public.signalements;
create trigger on_signalement_set_location
  before insert or update on public.signalements
  for each row execute function public.set_signalement_location();

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.users enable row level security;
alter table public.lots enable row level security;
alter table public.analyse_ia enable row level security;
alter table public.confirmations enable row level security;
alter table public.stocks enable row level security;
alter table public.point_transactions enable row level security;
alter table public.signalements enable row level security;
alter table public.abonnements enable row level security;

-- --- users ---
drop policy if exists "users_select_self" on public.users;
create policy "users_select_self" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Les mairies voient les users de leur commune (pour stats)
drop policy if exists "users_select_mairie" on public.users;
create policy "users_select_mairie" on public.users
  for select using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'mairie'
    )
  );

-- --- lots ---
-- Producteur voit ses lots
drop policy if exists "lots_select_own" on public.lots;
create policy "lots_select_own" on public.lots
  for select using (auth.uid() = producteur_id);

-- Collecteur/recycleur/mairie voient les lots publiés ou ceux qu'ils gèrent
drop policy if exists "lots_select_pros" on public.lots;
create policy "lots_select_pros" on public.lots
  for select using (
    status = 'publie'
    or auth.uid() = collecteur_id
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('collecteur','recycleur','mairie')
      and (status in ('reserve','collecte','livre_recycleur') or u.role = 'mairie')
    )
  );

-- Producteur insère ses lots
drop policy if exists "lots_insert_own" on public.lots;
create policy "lots_insert_own" on public.lots
  for insert with check (auth.uid() = producteur_id);

-- Producteur modifie ses lots (avant collecte)
drop policy if exists "lots_update_own" on public.lots;
create policy "lots_update_own" on public.lots
  for update using (auth.uid() = producteur_id) with check (auth.uid() = producteur_id);

-- Collecteur peut réserver et mettre à jour les lots qu'il a réservés
drop policy if exists "lots_update_collecteur" on public.lots;
create policy "lots_update_collecteur" on public.lots
  for update using (auth.uid() = collecteur_id) with check (auth.uid() = collecteur_id);

-- --- analyse_ia ---
-- Producteur voit l'analyse de ses lots ; pros voient les analyses des lots visibles
drop policy if exists "analyse_ia_select" on public.analyse_ia;
create policy "analyse_ia_select" on public.analyse_ia
  for select using (
    exists (
      select 1 from public.lots l
      where l.id = analyse_ia.lot_id
      and (
        l.producteur_id = auth.uid()
        or l.status = 'publie'
        or l.collecteur_id = auth.uid()
        or exists (
          select 1 from public.users u where u.id = auth.uid() and u.role in ('recycleur','mairie')
        )
      )
    )
  );

-- Insert uniquement via service role (route handler /api/ia/analyze)
-- Pas de policy insert → bloqué pour les clients anon/auth

-- --- confirmations ---
-- Les deux parties voient et modifient leurs confirmations
drop policy if exists "confirmations_select_parties" on public.confirmations;
create policy "confirmations_select_parties" on public.confirmations
  for select using (
    auth.uid() = actor_a_id or auth.uid() = actor_b_id
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'mairie'
    )
  );

drop policy if exists "confirmations_insert_parties" on public.confirmations;
create policy "confirmations_insert_parties" on public.confirmations
  for insert with check (
    auth.uid() = actor_a_id or auth.uid() = actor_b_id
  );

drop policy if exists "confirmations_update_parties" on public.confirmations;
create policy "confirmations_update_parties" on public.confirmations
  for update using (
    auth.uid() = actor_a_id or auth.uid() = actor_b_id
  ) with check (
    auth.uid() = actor_a_id or auth.uid() = actor_b_id
  );

-- --- stocks ---
-- Owner voit/modifie son stock ; recycleur/acheteur voient les stocks disponibles
drop policy if exists "stocks_select" on public.stocks;
create policy "stocks_select" on public.stocks
  for select using (
    auth.uid() = owner_id
    or status = 'disponible'
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'mairie'
    )
  );

drop policy if exists "stocks_insert_own" on public.stocks;
create policy "stocks_insert_own" on public.stocks
  for insert with check (auth.uid() = owner_id);

drop policy if exists "stocks_update_own" on public.stocks;
create policy "stocks_update_own" on public.stocks
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- --- point_transactions ---
-- Producteur voit son historique de points ; insert uniquement via trigger (SECURITY DEFINER)
drop policy if exists "points_select_own" on public.point_transactions;
create policy "points_select_own" on public.point_transactions
  for select using (auth.uid() = producteur_id);
-- Pas de policy insert → seul le trigger SECURITY DEFINER peut insérer

-- --- signalements ---
-- Citoyen voit ses signalements ; mairie voit ceux de sa commune
drop policy if exists "signalements_select" on public.signalements;
create policy "signalements_select" on public.signalements
  for select using (
    auth.uid() = citoyen_id
    or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'mairie'
    )
  );

drop policy if exists "signalements_insert" on public.signalements;
create policy "signalements_insert" on public.signalements
  for insert with check (auth.uid() is not null);

drop policy if exists "signalements_update_mairie" on public.signalements;
create policy "signalements_update_mairie" on public.signalements
  for update using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'mairie'
    )
  );

-- --- abonnements ---
drop policy if exists "abonnements_select_own" on public.abonnements;
create policy "abonnements_select_own" on public.abonnements
  for select using (auth.uid() = utilisateur_id);

-- ============================================================
-- 12. STORAGE BUCKET pour les photos de lots
-- ============================================================
insert into storage.buckets (id, name, public)
values ('lots-photos', 'lots-photos', true)
on conflict (id) do nothing;

-- Policy : un utilisateur authentifié peut uploader dans son dossier
drop policy if exists "lots_photos_upload" on storage.objects;
create policy "lots_photos_upload" on storage.objects
  for insert with check (
    bucket_id = 'lots-photos'
    and auth.uid() is not null
  );

-- Public read
drop policy if exists "lots_photos_read" on storage.objects;
create policy "lots_photos_read" on storage.objects
  for select using (bucket_id = 'lots-photos');

-- Owner peut supprimer ses photos
drop policy if exists "lots_photos_delete" on storage.objects;
create policy "lots_photos_delete" on storage.objects
  for delete using (
    bucket_id = 'lots-photos'
    and auth.uid() = owner
  );

-- ============================================================
-- Fin du schéma — Couche 2
-- ============================================================
