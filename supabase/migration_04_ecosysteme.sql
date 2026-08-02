-- ============================================================
-- EcoCycle CI — Migration 04 : Écosystème 6 acteurs + Admin
-- À exécuter dans le SQL Editor de Supabase APRÈS migration_03.
-- Contenu :
--   1. Rôle 'admin' (7e rôle)
--   2. users : sous_activite (collecte/recyclage/mixte) + capacite_vehicule_kg
--   3. lots : validation_pin (4 chiffres) + qr_hash (double validation)
--   4. market_prices (prix du marché au kg, géré par l'admin)
--   5. Realtime sur lots + signalements
--   6. EcoCoins civiques : points crédités au citoyen à la résolution
--   7. handle_new_user enrichi (commune, quartier, sous_activite)
--   8. RLS admin
-- ============================================================

-- ============================================================
-- 1. Rôle admin
-- ============================================================
do $$ begin
  alter type user_role add value if not exists 'admin';
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. users : sous-activité + capacité véhicule
-- ============================================================
alter table public.users
  add column if not exists sous_activite text
    check (sous_activite in ('collecte','recyclage','mixte') or sous_activite is null);

alter table public.users
  add column if not exists capacite_vehicule_kg numeric;

-- ============================================================
-- 3. lots : double validation QR + PIN
-- ============================================================
-- PIN à 4 chiffres généré automatiquement à la création du lot.
alter table public.lots
  add column if not exists validation_pin varchar(4)
    default lpad(floor(random() * 10000)::text, 4, '0');

-- Hash de sécurité embarqué dans le QR Code (16 octets hex).
alter table public.lots
  add column if not exists qr_hash text
    default encode(gen_random_bytes(16), 'hex');

-- Rétro-remplissage pour les lots existants (DEFAULT ne s'applique
-- qu'aux nouvelles lignes).
update public.lots set validation_pin = lpad(floor(random() * 10000)::text, 4, '0')
  where validation_pin is null;
update public.lots set qr_hash = encode(gen_random_bytes(16), 'hex')
  where qr_hash is null;

-- ============================================================
-- 4. market_prices — prix du marché au kilo (admin)
-- ============================================================
create table if not exists public.market_prices (
  id uuid primary key default gen_random_uuid(),
  type_matiere text not null unique,
  prix_fcfa_kg integer not null check (prix_fcfa_kg >= 0),
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Prix de référence initiaux (filiale Abidjan, ordres de grandeur FCFA/kg)
insert into public.market_prices (type_matiere, prix_fcfa_kg) values
  ('plastique', 150),
  ('metal', 300),
  ('papier_carton', 50),
  ('verre', 25),
  ('organique', 10),
  ('electronique', 500),
  ('textile', 75),
  ('mixte', 40)
on conflict (type_matiere) do nothing;

alter table public.market_prices enable row level security;

-- Lecture : tout utilisateur connecté (sert à l'estimation de rentabilité)
drop policy if exists "market_prices_read" on public.market_prices;
create policy "market_prices_read" on public.market_prices
  for select to authenticated using (true);

-- Écriture : admin uniquement
drop policy if exists "market_prices_admin_write" on public.market_prices;
create policy "market_prices_admin_write" on public.market_prices
  for all to authenticated using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role::text = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role::text = 'admin'
    )
  );

-- ============================================================
-- 5. Realtime (publication Supabase)
-- ============================================================
-- Idempotent : ignore l'erreur si la table est déjà membre.
do $$ begin
  alter publication supabase_realtime add table public.lots;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.signalements;
exception when others then null; end $$;

-- ============================================================
-- 6. EcoCoins civiques — points au citoyen quand le signalement
--    est résolu par la mairie (Amélioration 2 validée)
-- ============================================================
create or replace function public.credit_points_on_signalement_resolu()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_points constant integer := 10;
begin
  if new.citoyen_id is null then
    return new;
  end if;

  update public.users
    set points_balance = points_balance + v_points,
        points_total = points_total + v_points
    where id = new.citoyen_id;

  insert into public.point_transactions (producteur_id, lot_id, points, motif)
    values (new.citoyen_id, null, v_points, 'signalement_resolu');

  return new;
end;
$$;

drop trigger if exists on_signalement_resolu on public.signalements;
create trigger on_signalement_resolu
  after update on public.signalements
  for each row
  when (old.status is distinct from 'resolu' and new.status = 'resolu')
  execute function public.credit_points_on_signalement_resolu();

-- ============================================================
-- 7. handle_new_user enrichi : commune, quartier, sous_activite
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, role, name, phone, email, commune, quartier, sous_activite)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'citoyen'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    new.raw_user_meta_data->>'commune',
    new.raw_user_meta_data->>'quartier',
    new.raw_user_meta_data->>'sous_activite'
  );
  return new;
end;
$$;

-- ============================================================
-- 8. RLS : l'admin lit tout (supervision)
-- ============================================================
drop policy if exists "users_select_admin" on public.users;
create policy "users_select_admin" on public.users
  for select to authenticated using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role::text = 'admin'
    )
  );

drop policy if exists "lots_select_admin" on public.lots;
create policy "lots_select_admin" on public.lots
  for select to authenticated using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role::text = 'admin'
    )
  );

drop policy if exists "signalements_select_admin" on public.signalements;
create policy "signalements_select_admin" on public.signalements
  for select to authenticated using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role::text = 'admin'
    )
  );

-- ============================================================
-- Note sécurité connue (MVP) : validation_pin et qr_hash sont
-- lisibles via les policies SELECT permissives de démo. La route
-- API de validation vérifie systématiquement PIN + collecteur_id
-- du lot, ce qui bloque la fraude par un tiers. Durcissement
-- possible post-MVP : table validation_secrets séparée.
-- ============================================================

-- ============================================================
-- Fin de la migration 04
-- ============================================================
