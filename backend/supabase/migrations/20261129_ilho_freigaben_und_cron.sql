-- Bei bestehenden Installationen ebenfalls wirksam. Keine historischen Lernmerkmale ableiten.
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS lern_thema TEXT;
ALTER TABLE public.insights ADD COLUMN IF NOT EXISTS lern_stimmung SMALLINT
  CHECK (lern_stimmung BETWEEN 1 AND 5);

-- Direkter Zugriff auf den früheren SECURITY-DEFINER-Helfer würde fremde Freigaben verraten.
REVOKE ALL ON FUNCTION public.hat_freigabe(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- Der Zeitpunkt stammt aus der authentifizierten Edge Function. Erneut prüfen,
-- weil ein Widerruf während der Modellantwort erfolgt sein kann.
CREATE OR REPLACE FUNCTION public.ilho_erkenntnis_speichern(
  p_user UUID, p_beginn TIMESTAMPTZ, p_modell TEXT, p_stimmung SMALLINT,
  p_themen TEXT[], p_ziele TEXT[], p_kurz TEXT, p_lernthema TEXT
) RETURNS void LANGUAGE sql SET search_path = '' AS $$
  WITH erlaubt AS (
    SELECT array_agg(c.bereich) AS bereiche FROM public.consent c
     WHERE c.user_id = p_user AND c.aktiv AND c.erteilt_am <= p_beginn
  )
  INSERT INTO public.insights
    (user_id, created_at, modell, stimmung, themen, ziele, zusammenfassung, lern_thema, lern_stimmung)
  SELECT p_user, p_beginn, p_modell,
    CASE WHEN 'stimmung' = ANY(bereiche) THEN p_stimmung END,
    CASE WHEN 'themen' = ANY(bereiche) THEN p_themen ELSE '{}'::text[] END,
    CASE WHEN 'ziele' = ANY(bereiche) THEN p_ziele ELSE '{}'::text[] END,
    CASE WHEN 'fortschritt' = ANY(bereiche) THEN p_kurz END,
    CASE WHEN 'ilho_lernen' = ANY(bereiche) THEN
      CASE WHEN p_lernthema IN ('Alltag','Beruf','Beziehungen','Grenzen','Selbstwert','Ziele')
        THEN p_lernthema ELSE 'Sonstiges' END END,
    CASE WHEN 'ilho_lernen' = ANY(bereiche) THEN p_stimmung END
  FROM erlaubt WHERE bereiche IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.ilho_erkenntnis_speichern(UUID,TIMESTAMPTZ,TEXT,SMALLINT,TEXT[],TEXT[],TEXT,TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ilho_erkenntnis_speichern(UUID,TIMESTAMPTZ,TEXT,SMALLINT,TEXT[],TEXT[],TEXT,TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION coach_klientin_analyse(p_klientin UUID, p_tage INT DEFAULT 90)
RETURNS TABLE (
  created_at TIMESTAMP WITH TIME ZONE,
  stimmung SMALLINT,
  themen TEXT[],
  ziele TEXT[],
  zusammenfassung TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID;
BEGIN
  SELECT k.user_id INTO v_user FROM klientinnen k
   WHERE k.id = p_klientin AND k.coach_id = auth.uid() AND k.status IN ('aktiv','pausiert');
  IF v_user IS NULL THEN RAISE EXCEPTION 'keine Klientin von dir'; END IF;

  RETURN QUERY
  SELECT i.created_at,
         CASE WHEN 'stimmung' = ANY(f.bereiche) THEN i.stimmung END,
         CASE WHEN 'themen' = ANY(f.bereiche) THEN i.themen ELSE '{}'::TEXT[] END,
         CASE WHEN 'ziele' = ANY(f.bereiche) THEN i.ziele ELSE '{}'::TEXT[] END,
         CASE WHEN 'fortschritt' = ANY(f.bereiche) THEN i.zusammenfassung END
    FROM public.insights i
    CROSS JOIN LATERAL (
      SELECT array_agg(c.bereich) AS bereiche
        FROM public.consent c
       WHERE c.user_id = i.user_id AND c.aktiv AND c.erteilt_am <= i.created_at
         AND c.bereich <> 'ilho_lernen'
    ) f
   WHERE i.user_id = v_user AND f.bereiche IS NOT NULL
     AND i.created_at > now() - make_interval(days => LEAST(GREATEST(p_tage, 1), 365))
   ORDER BY i.created_at DESC LIMIT 200;
END $$;

-- Nur gruppierte Werte aus festgelegten Kategorien verlassen die Datenbank.
CREATE OR REPLACE FUNCTION public.ilho_wochenzahlen(p_von DATE)
RETURNS JSONB LANGUAGE sql STABLE SET search_path = '' AS $$
  WITH basis AS (
    SELECT i.user_id, i.lern_thema, i.lern_stimmung
      FROM public.insights i JOIN public.consent c ON c.user_id = i.user_id
     WHERE c.bereich = 'ilho_lernen' AND c.aktiv AND c.erteilt_am <= i.created_at
       AND i.created_at >= (p_von::timestamp AT TIME ZONE 'UTC')
       AND i.created_at < ((p_von + 7)::timestamp AT TIME ZONE 'UTC')
       AND i.lern_thema IS NOT NULL
  ), themen AS (
    SELECT lern_thema, count(*) AS n FROM basis GROUP BY lern_thema
    HAVING count(DISTINCT user_id) >= 3
  )
  SELECT jsonb_build_object('gespraeche', count(*), 'auswertbar',
    count(*) >= 10 AND count(DISTINCT user_id) >= 3, 'stimmung',
    CASE WHEN count(DISTINCT user_id) FILTER (WHERE lern_stimmung IS NOT NULL) >= 3
      THEN round(avg(lern_stimmung), 1) END,
    'themen', COALESCE((SELECT jsonb_object_agg(lern_thema,n) FROM themen),'{}'::jsonb))
  FROM basis;
$$;
REVOKE ALL ON FUNCTION public.ilho_wochenzahlen(DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ilho_wochenzahlen(DATE) TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Pro Umgebung: lokale Projekt-URL in Vault (ilho_project_url) und eigener
-- Cron-Token (ilho_cron_token), derselbe Wert als Edge Secret ILHO_CRON_TOKEN.
-- Ohne vollständige Konfiguration versendet der Job keine Anfrage.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'ilho-lernen';
SELECT cron.schedule('ilho-lernen', '17 4 * * 1', $job$
  SELECT net.http_post(
    url := rtrim(u.decrypted_secret, '/') || '/functions/v1/ilho-lernen',
    headers := jsonb_build_object('Content-Type','application/json','X-Ilho-Cron',k.decrypted_secret),
    body := '{}'::jsonb)
  FROM vault.decrypted_secrets u CROSS JOIN vault.decrypted_secrets k
  WHERE u.name = 'ilho_project_url' AND k.name = 'ilho_cron_token'
    AND u.decrypted_secret ~ '^https://[a-z0-9-]+[.]supabase[.]co/?$'
    AND length(k.decrypted_secret) >= 32;
$job$);
