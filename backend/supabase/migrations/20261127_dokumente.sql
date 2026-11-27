-- ─────────────────────────────────────────────
-- smile2go · Office / Dokumente
-- • Team (Admin) legt Dokumente an: Datei (PDF …), Link oder selbst geschriebener
--   Text (wird im Browser zu einem PDF und als Datei gespeichert).
-- • Team gibt Dokumente frei: an Mitglieder in der App oder per E-Mail-Link an
--   Personen außerhalb (Mitarbeitende, Onboarding).
-- • Mitglieder laden Unterlagen hoch: Expertinnen-Bewerbung, Vertrag/Einwilligung,
--   Sonstiges — schon auf der Warteseite nach der Registrierung.
-- Bewusst nur additiv: Richtlinien werden per DO-Block geprüft und nur neu angelegt.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dokumente (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titel                text NOT NULL,
  beschreibung         text,
  art                  text NOT NULL DEFAULT 'datei' CHECK (art IN ('datei','link')),
  kategorie            text NOT NULL DEFAULT 'sonstiges' CHECK (kategorie IN ('onboarding','vertrag','bewerbung','sonstiges')),
  pfad                 text,          -- Pfad im Bucket „dokumente“
  link                 text,          -- bei art = 'link'
  dateiname            text,
  groesse              bigint,
  quelle               text NOT NULL DEFAULT 'team' CHECK (quelle IN ('team','mitglied')),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE,  -- Hochladende (nur bei quelle = 'mitglied')
  bestaetigung_noetig  boolean NOT NULL DEFAULT false,
  status               text NOT NULL DEFAULT 'neu' CHECK (status IN ('neu','geprueft')),
  erstellt             timestamptz NOT NULL DEFAULT now(),
  CHECK (art <> 'link' OR link IS NOT NULL),
  CHECK (quelle <> 'mitglied' OR user_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS dokumente_user_idx ON dokumente (user_id);
CREATE INDEX IF NOT EXISTS dokumente_quelle_idx ON dokumente (quelle, status);

CREATE TABLE IF NOT EXISTS dokument_freigaben (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokument_id  uuid NOT NULL REFERENCES dokumente(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,   -- Mitglied in der App
  email        text,                                               -- Person außerhalb
  gesendet     timestamptz NOT NULL DEFAULT now(),
  geoeffnet    timestamptz,
  bestaetigt   timestamptz,
  CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS dokument_freigaben_user_idx ON dokument_freigaben (user_id);
CREATE INDEX IF NOT EXISTS dokument_freigaben_dok_idx ON dokument_freigaben (dokument_id);

ALTER TABLE dokumente ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokument_freigaben ENABLE ROW LEVEL SECURITY;

-- Hilfsfunktion: darf die angemeldete Frau dieses Dokument sehen? (vermeidet RLS-Rekursion)
CREATE OR REPLACE FUNCTION dokument_fuer_mich(p_dok uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM dokument_freigaben WHERE dokument_id = p_dok AND user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION dokument_fuer_mich(uuid) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dokumente' AND policyname = 'Team verwaltet Dokumente') THEN
    CREATE POLICY "Team verwaltet Dokumente" ON dokumente FOR ALL USING (ist_admin()) WITH CHECK (ist_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dokumente' AND policyname = 'Eigene und freigegebene Dokumente') THEN
    CREATE POLICY "Eigene und freigegebene Dokumente" ON dokumente FOR SELECT
      USING (user_id = auth.uid() OR dokument_fuer_mich(id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dokumente' AND policyname = 'Mitglied laedt eigene Unterlagen hoch') THEN
    CREATE POLICY "Mitglied laedt eigene Unterlagen hoch" ON dokumente FOR INSERT
      WITH CHECK (quelle = 'mitglied' AND user_id = auth.uid() AND art = 'datei' AND status = 'neu');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dokument_freigaben' AND policyname = 'Team verwaltet Freigaben') THEN
    CREATE POLICY "Team verwaltet Freigaben" ON dokument_freigaben FOR ALL USING (ist_admin()) WITH CHECK (ist_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dokument_freigaben' AND policyname = 'Eigene Freigaben sehen') THEN
    CREATE POLICY "Eigene Freigaben sehen" ON dokument_freigaben FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Speicher: privater Bucket „dokumente“ (20 MB je Datei) ──
-- Team-Dateien liegen unter team/…, Unterlagen eines Mitglieds unter <user_id>/…
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('dokumente', 'dokumente', false, 20971520)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Dokumente: Team alles') THEN
    CREATE POLICY "Dokumente: Team alles" ON storage.objects FOR ALL
      USING (bucket_id = 'dokumente' AND ist_admin()) WITH CHECK (bucket_id = 'dokumente' AND ist_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Dokumente: eigene hochladen') THEN
    CREATE POLICY "Dokumente: eigene hochladen" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'dokumente' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Dokumente: eigene und freigegebene lesen') THEN
    CREATE POLICY "Dokumente: eigene und freigegebene lesen" ON storage.objects FOR SELECT
      USING (bucket_id = 'dokumente' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (SELECT 1 FROM public.dokumente d WHERE d.pfad = storage.objects.name AND public.dokument_fuer_mich(d.id))
      ));
  END IF;
END $$;

-- ── Admin: Übersicht mit E-Mail der Hochladenden und Freigaben ──
CREATE OR REPLACE FUNCTION admin_dokumente()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY x.erstellt DESC) FROM (
      SELECT d.*, u.email AS von_email,
        COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', f.id, 'user_id', f.user_id, 'email', COALESCE(f.email, fu.email),
            'gesendet', f.gesendet, 'geoeffnet', f.geoeffnet, 'bestaetigt', f.bestaetigt) ORDER BY f.gesendet DESC)
          FROM dokument_freigaben f LEFT JOIN auth.users fu ON fu.id = f.user_id
          WHERE f.dokument_id = d.id), '[]'::jsonb) AS freigaben
      FROM dokumente d LEFT JOIN auth.users u ON u.id = d.user_id
    ) x
  ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION admin_dokumente() TO authenticated;

CREATE OR REPLACE FUNCTION admin_dokumente_neu()
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RETURN 0; END IF;
  RETURN (SELECT count(*) FROM dokumente WHERE quelle = 'mitglied' AND status = 'neu');
END $$;
GRANT EXECUTE ON FUNCTION admin_dokumente_neu() TO authenticated;

-- ── Mitglied: geöffnet / gelesen & einverstanden ──
CREATE OR REPLACE FUNCTION dokument_markieren(p_freigabe uuid, p_bestaetigen boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE dokument_freigaben
     SET geoeffnet  = COALESCE(geoeffnet, now()),
         bestaetigt = CASE WHEN p_bestaetigen THEN COALESCE(bestaetigt, now()) ELSE bestaetigt END
   WHERE id = p_freigabe AND user_id = auth.uid();
END $$;
GRANT EXECUTE ON FUNCTION dokument_markieren(uuid, boolean) TO authenticated;
