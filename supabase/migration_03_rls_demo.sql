-- ============================================================
-- EcoCycle CI — Migration 03 : RLS spatial_ref_sys + assouplissement démo
-- À exécuter dans le SQL Editor de Supabase (projet zuaohociddfdwaygdrpl).
-- Objectif :
--   1. Activer RLS sur public.spatial_ref_sys (table créée par PostGIS) avec
--      une policy SELECT publique pour faire taître l'alerte Supabase.
--   2. Assouplir les policies SELECT sur les tables métier pour la démo :
--      tout utilisateur authentifié peut LIRE. Les INSERT/UPDATE restent
--      restreints à auth.uid() = ... (logique métier inchangée).
-- ============================================================

-- ============================================================
-- 1. spatial_ref_sys (PostGIS)
-- ============================================================
alter table public.spatial_ref_sys enable row level security;

drop policy if exists "spatial_ref_sys_read" on public.spatial_ref_sys;
create policy "spatial_ref_sys_read" on public.spatial_ref_sys
  for select to anon, authenticated using (true);

-- ============================================================
-- 2. users — SELECT pour tous les authenticated
-- ============================================================
drop policy if exists "users_select_self" on public.users;
drop policy if exists "users_select_mairie" on public.users;
drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated" on public.users
  for select to authenticated using (true);

-- La policy self reste pour compatibilité sémantique (UPDATE inchangé).
drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- 3. lots — SELECT pour tous les authenticated
-- ============================================================
drop policy if exists "lots_select_own" on public.lots;
drop policy if exists "lots_select_pros" on public.lots;
drop policy if exists "lots_select_authenticated" on public.lots;
create policy "lots_select_authenticated" on public.lots
  for select to authenticated using (true);

drop policy if exists "lots_insert_own" on public.lots;
create policy "lots_insert_own" on public.lots
  for insert to authenticated with check (auth.uid() = producteur_id);

drop policy if exists "lots_update_own" on public.lots;
create policy "lots_update_own" on public.lots
  for update to authenticated using (auth.uid() = producteur_id) with check (auth.uid() = producteur_id);

drop policy if exists "lots_update_collecteur" on public.lots;
create policy "lots_update_collecteur" on public.lots
  for update to authenticated using (auth.uid() = collecteur_id) with check (auth.uid() = collecteur_id);

-- ============================================================
-- 4. matiere_premiere — SELECT pour tous les authenticated
-- ============================================================
drop policy if exists "mp_select_own" on public.matiere_premiere;
drop policy if exists "mp_select_authenticated" on public.matiere_premiere;
create policy "mp_select_authenticated" on public.matiere_premiere
  for select to authenticated using (true);

drop policy if exists "mp_insert_own" on public.matiere_premiere;
create policy "mp_insert_own" on public.matiere_premiere
  for insert to authenticated with check (auth.uid() = recycleur_id);

drop policy if exists "mp_update_own" on public.matiere_premiere;
create policy "mp_update_own" on public.matiere_premiere
  for update to authenticated using (
    auth.uid() = recycleur_id or auth.uid() = acheteur_id
  ) with check (
    auth.uid() = recycleur_id or auth.uid() = acheteur_id
  );

-- ============================================================
-- 5. confirmations — SELECT pour tous les authenticated
-- ============================================================
drop policy if exists "confirmations_select_parties" on public.confirmations;
drop policy if exists "confirmations_select_authenticated" on public.confirmations;
create policy "confirmations_select_authenticated" on public.confirmations
  for select to authenticated using (true);

drop policy if exists "confirmations_insert_parties" on public.confirmations;
create policy "confirmations_insert_parties" on public.confirmations
  for insert to authenticated with check (
    auth.uid() = actor_a_id or auth.uid() = actor_b_id
  );

drop policy if exists "confirmations_update_parties" on public.confirmations;
create policy "confirmations_update_parties" on public.confirmations
  for update to authenticated using (
    auth.uid() = actor_a_id or auth.uid() = actor_b_id
  ) with check (
    auth.uid() = actor_a_id or auth.uid() = actor_b_id
  );

-- ============================================================
-- 6. signalements — SELECT pour tous les authenticated
-- ============================================================
drop policy if exists "signalements_select" on public.signalements;
drop policy if exists "signalements_select_authenticated" on public.signalements;
create policy "signalements_select_authenticated" on public.signalements
  for select to authenticated using (true);

drop policy if exists "signalements_insert" on public.signalements;
create policy "signalements_insert" on public.signalements
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "signalements_update_mairie" on public.signalements;
create policy "signalements_update_mairie" on public.signalements
  for update to authenticated using (
    exists (
      select 1 from public.users u where u.id = auth.uid() and u.role = 'mairie'
    )
  );

-- ============================================================
-- 7. point_transactions — SELECT pour tous les authenticated
-- ============================================================
drop policy if exists "points_select_own" on public.point_transactions;
drop policy if exists "points_select_authenticated" on public.point_transactions;
create policy "points_select_authenticated" on public.point_transactions
  for select to authenticated using (true);

-- ============================================================
-- 8. stocks — SELECT pour tous les authenticated
-- ============================================================
drop policy if exists "stocks_select" on public.stocks;
drop policy if exists "stocks_select_authenticated" on public.stocks;
create policy "stocks_select_authenticated" on public.stocks
  for select to authenticated using (true);

drop policy if exists "stocks_insert_own" on public.stocks;
create policy "stocks_insert_own" on public.stocks
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "stocks_update_own" on public.stocks;
create policy "stocks_update_own" on public.stocks
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- 9. analyse_ia — SELECT pour tous les authenticated (lecture seule démo)
-- ============================================================
drop policy if exists "analyse_ia_select" on public.analyse_ia;
drop policy if exists "analyse_ia_select_authenticated" on public.analyse_ia;
create policy "analyse_ia_select_authenticated" on public.analyse_ia
  for select to authenticated using (true);

-- ============================================================
-- Fin de la migration 03
-- ============================================================