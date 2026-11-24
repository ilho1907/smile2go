-- Minimaler Supabase-Nachbau für lokale Tests (NICHT in Produktion ausführen).
-- Stellt bereit: Rollen anon/authenticated/service_role, auth.users, auth.uid(),
-- storage.buckets/objects/foldername, sowie die Vorgänger-Objekte, auf die
-- 20261124_ilho_technik.sql aufbaut (admins, ist_admin, coaches).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY, email TEXT, created_at TIMESTAMPTZ DEFAULT now(), last_sign_in_at TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (id TEXT PRIMARY KEY, name TEXT, public BOOLEAN, file_size_limit BIGINT, allowed_mime_types TEXT[]);
CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id TEXT, name TEXT, owner UUID, metadata JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1];
$$;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
-- Wie in Supabase-Projekten (Altbestand): neue Objekte bekommen automatisch Rechte.
-- Die Migration muss sich dagegen selbst absichern.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Vorgänger aus 20260927_ki_fairness.sql / 20260906_coach_rolle.sql
CREATE TABLE IF NOT EXISTS admins (user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE OR REPLACE FUNCTION ist_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION ist_admin() TO authenticated;
CREATE TABLE IF NOT EXISTS coaches (id UUID PRIMARY KEY, ist_coach BOOLEAN NOT NULL DEFAULT false);
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigene Coach-Zeile" ON coaches FOR SELECT TO authenticated USING (id = auth.uid());
GRANT SELECT ON coaches TO authenticated;
