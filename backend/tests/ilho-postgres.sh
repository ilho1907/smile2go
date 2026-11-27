#!/usr/bin/env bash
# Nur mit einer eigenen, neu angelegten Testdatenbank auf dem lokalen Rechner ausführen.
set -euo pipefail
: "${PGDATABASE:?PGDATABASE fehlt}"
case "${PGHOST:-}" in ""|localhost|127.0.0.1|/var/run/postgresql) ;; *) echo "Nur eine lokale Testdatenbank verwenden." >&2; exit 1;; esac
[[ "$PGDATABASE" == ilho_regression* ]] || { echo "Eine neue Datenbank ilho_regression* verwenden." >&2; exit 1; }
cd "$(dirname "$0")/../supabase/migrations"
{
cat <<'SQL'
BEGIN;
CREATE ROLE authenticated;
CREATE ROLE anon;
CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.uid', true),'')::uuid $$;
CREATE TABLE public.klientinnen(id uuid PRIMARY KEY, user_id uuid, coach_id uuid, status text);
-- Für diese isolierte PostgreSQL-Prüfung nur die externen Plattform-APIs nachbilden.
CREATE SCHEMA cron; CREATE SCHEMA vault; CREATE SCHEMA net;
CREATE TABLE cron.job(jobid serial,jobname text,command text);
CREATE FUNCTION cron.unschedule(integer) RETURNS void LANGUAGE sql AS $$ DELETE FROM cron.job WHERE jobid=$1 $$;
CREATE FUNCTION cron.schedule(text,text,text) RETURNS void LANGUAGE sql AS $$ INSERT INTO cron.job(jobname,command) VALUES($1,$3) $$;
CREATE TABLE vault.decrypted_secrets(name text,decrypted_secret text);
CREATE TABLE public.test_http(url text,headers jsonb);
CREATE FUNCTION net.http_post(url text, headers jsonb, body jsonb) RETURNS void LANGUAGE sql AS $$ INSERT INTO public.test_http VALUES($1,$2) $$;
SQL
for repeat in 1 2; do
  cat 20261128_consent_insights.sql
  sed '/^CREATE EXTENSION /d' 20261129_ilho_freigaben_und_cron.sql
done
cat <<'SQL'
SELECT command FROM cron.job WHERE jobname='ilho-lernen' \gexec
DO $$ BEGIN ASSERT (SELECT count(*) FROM test_http)=0; END $$;
INSERT INTO vault.decrypted_secrets VALUES ('ilho_project_url','https://test-preview.supabase.co'),('ilho_cron_token',repeat('x',36));
SELECT command FROM cron.job WHERE jobname='ilho-lernen' \gexec
DO $$
DECLARE
  u uuid := gen_random_uuid(); v uuid := gen_random_uuid(); w uuid := gen_random_uuid();
  k uuid := gen_random_uuid(); coach uuid := gen_random_uuid();
  basis timestamptz := date_trunc('week',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  z jsonb; r record;
BEGIN
  ASSERT (SELECT count(*) FROM test_http WHERE url='https://test-preview.supabase.co/functions/v1/ilho-lernen'
    AND headers->>'X-Ilho-Cron'=repeat('x',36))=1;
  ASSERT NOT has_function_privilege('anon','public.ilho_wochenzahlen(date)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','public.hat_freigabe(uuid,text)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','public.ilho_erkenntnis_speichern(uuid,timestamptz,text,smallint,text[],text[],text,text)','EXECUTE');
  INSERT INTO auth.users VALUES(u),(v),(w);
  INSERT INTO klientinnen VALUES(k,u,coach,'aktiv');
  PERFORM public.ilho_erkenntnis_speichern(u,basis,'test',4::smallint,'{x}','{y}','privat','Alltag');
  ASSERT NOT EXISTS(SELECT FROM insights);
  INSERT INTO consent(user_id,bereich,aktiv,erteilt_am)
    VALUES (u,'stimmung',true,basis),(u,'fortschritt',true,basis+interval '2 hours');
  PERFORM public.ilho_erkenntnis_speichern(u,basis+interval '1 hour','test',4::smallint,'{x}','{y}','privat','Alltag');
  SELECT * INTO STRICT r FROM insights;
  ASSERT r.stimmung=4 AND r.zusammenfassung IS NULL AND cardinality(r.themen)=0 AND r.lern_thema IS NULL;
  UPDATE insights SET zusammenfassung='historischer Testwert';
  PERFORM set_config('test.uid',coach::text,true);
  SELECT * INTO STRICT r FROM coach_klientin_analyse(k,365);
  ASSERT r.zusammenfassung IS NULL AND r.stimmung=4;
  UPDATE consent SET aktiv=false WHERE user_id=u AND bereich='stimmung';
  ASSERT NOT EXISTS(SELECT FROM coach_klientin_analyse(k,365));
  INSERT INTO consent(user_id,bereich,aktiv,erteilt_am)
    SELECT x,'ilho_lernen',true,basis FROM unnest(ARRAY[u,v,w]) x;
  FOR i IN 1..10 LOOP
    PERFORM public.ilho_erkenntnis_speichern(u,basis+interval '1 hour','test',4::smallint,'{}','{}','privat','Alltag');
  END LOOP;
  z := ilho_wochenzahlen((basis AT TIME ZONE 'UTC')::date);
  ASSERT (z->>'gespraeche')::int=10 AND NOT (z->>'auswertbar')::boolean;
  PERFORM public.ilho_erkenntnis_speichern(v,basis+interval '1 hour','test',4::smallint,'{}','{}','privat','Alltag');
  PERFORM public.ilho_erkenntnis_speichern(w,basis+interval '1 hour','test',5::smallint,'{}','{}','privat','Alltag');
  z := ilho_wochenzahlen((basis AT TIME ZONE 'UTC')::date);
  ASSERT (z->>'auswertbar')::boolean AND z->'themen'->>'Alltag'='12' AND (z->>'stimmung')::numeric=4.1;
  UPDATE consent SET erteilt_am=basis+interval '2 hours' WHERE user_id=w AND bereich='ilho_lernen';
  z := ilho_wochenzahlen((basis AT TIME ZONE 'UTC')::date);
  ASSERT (z->>'gespraeche')::int=11 AND NOT (z->>'auswertbar')::boolean;
END $$;
ROLLBACK;
SQL
} | psql -X -v ON_ERROR_STOP=1
