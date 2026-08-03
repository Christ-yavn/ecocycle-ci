-- ============================================================
-- EcoLoop CI — Migration 05 : Refonte EcoLoop
-- Exécuter APRÈS migration_04_ecosysteme.sql
-- Tout est idempotent (IF NOT EXISTS / DROP ... IF EXISTS).
-- ============================================================

-- 1. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Insert: uniquement via triggers SECURITY DEFINER

-- 2. GAMIFICATION : colonne niveau
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS niveau INTEGER NOT NULL DEFAULT 1;

-- 3. APPELS D'OFFRES
CREATE TABLE IF NOT EXISTS public.appels_offres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acheteur_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type_matiere TEXT NOT NULL,
  volume_demande_kg NUMERIC NOT NULL CHECK (volume_demande_kg > 0),
  description TEXT,
  date_limite TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ouvert',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ao_status ON public.appels_offres(status);

ALTER TABLE public.appels_offres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ao_select_all" ON public.appels_offres;
CREATE POLICY "ao_select_all" ON public.appels_offres
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ao_insert_acheteur" ON public.appels_offres;
CREATE POLICY "ao_insert_acheteur" ON public.appels_offres
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'acheteur')
  );

DROP POLICY IF EXISTS "ao_update_own" ON public.appels_offres;
CREATE POLICY "ao_update_own" ON public.appels_offres
  FOR UPDATE TO authenticated USING (auth.uid() = acheteur_id);

-- 4. PROPOSITIONS AUX APPELS D'OFFRES
CREATE TABLE IF NOT EXISTS public.propositions_offres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appel_id UUID NOT NULL REFERENCES public.appels_offres(id) ON DELETE CASCADE,
  recycleur_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  volume_propose_kg NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.propositions_offres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "po_select_parties" ON public.propositions_offres;
CREATE POLICY "po_select_parties" ON public.propositions_offres
  FOR SELECT TO authenticated USING (
    auth.uid() = recycleur_id OR
    EXISTS (SELECT 1 FROM public.appels_offres ao WHERE ao.id = appel_id AND ao.acheteur_id = auth.uid())
  );

DROP POLICY IF EXISTS "po_insert_recycleur" ON public.propositions_offres;
CREATE POLICY "po_insert_recycleur" ON public.propositions_offres
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text IN ('recycleur', 'collecteur'))
  );

-- 5. REALTIME pour notifications
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. TRIGGER : Notifications automatiques sur changement de statut lot
CREATE OR REPLACE FUNCTION public.notify_on_lot_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'reserve' AND OLD.status = 'publie' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (NEW.producteur_id, 'lot_reserve',
      'Un collecteur a accepté votre mission.',
      'Votre lot sera bientôt collecté.',
      jsonb_build_object('lot_id', NEW.id));
  END IF;
  IF NEW.status = 'collecte' AND OLD.status = 'reserve' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (NEW.producteur_id, 'lot_collecte',
      'Votre lot a été collecté !',
      format('%s kg récupérés.', COALESCE(NEW.weight_real, NEW.volume_ia, 0)),
      jsonb_build_object('lot_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lot_status_change ON public.lots;
CREATE TRIGGER on_lot_status_change
  AFTER UPDATE ON public.lots FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_on_lot_status_change();

-- 7. TRIGGER : Mise à jour automatique du niveau utilisateur
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_niveau INTEGER;
BEGIN
  v_niveau := CASE
    WHEN NEW.points_total >= 1000 THEN 5
    WHEN NEW.points_total >= 500  THEN 4
    WHEN NEW.points_total >= 200  THEN 3
    WHEN NEW.points_total >= 50   THEN 2
    ELSE 1
  END;
  IF v_niveau <> COALESCE(OLD.niveau, 1) THEN
    NEW.niveau := v_niveau;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (NEW.id, 'niveau_atteint',
      format('Vous avez atteint le niveau %s !', v_niveau),
      'Continuez vos efforts pour débloquer des récompenses.',
      jsonb_build_object('niveau', v_niveau));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_points_change ON public.users;
CREATE TRIGGER on_user_points_change
  BEFORE UPDATE ON public.users FOR EACH ROW
  WHEN (OLD.points_total IS DISTINCT FROM NEW.points_total)
  EXECUTE FUNCTION public.update_user_level();

-- 8. CONVERTIR les anciens citoyens en producteurs
UPDATE public.users SET role = 'producteur' WHERE role::text = 'citoyen';

-- ============================================================
-- Fin de la migration 05
-- ============================================================
