-- ---------------------------------------------------------------------------
-- smile2go · Automatische Termin-Erinnerungen (26.09.2026)
-- Alle 15 Minuten ruft pg_cron die Edge Function "erinnerungen" auf.
-- Die Function ist idempotent: sie markiert jeden Termin atomar, bevor sie
-- sendet (erinnert_24h / erinnert_1h) — ein Termin wird nie doppelt erinnert.
-- ---------------------------------------------------------------------------

ALTER TABLE termine ADD COLUMN IF NOT EXISTS erinnert_24h TIMESTAMP WITH TIME ZONE;
ALTER TABLE termine ADD COLUMN IF NOT EXISTS erinnert_1h TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_termine_offen ON termine(beginn) WHERE status = 'gebucht';

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Bestehenden Job ersetzen, falls die Migration erneut läuft.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'termin-erinnerungen';

SELECT cron.schedule(
  'termin-erinnerungen',
  '*/15 * * * *',
  $$ SELECT net.http_post(
       url := 'https://bquqghnxlvszvxrygiyc.supabase.co/functions/v1/erinnerungen',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
