-- ---------------------------------------------------------------------------
-- smile2go · Team-Nachrichten (20.11.2026)
--
-- Direkter Draht zwischen jeder Nutzerin und dem smile2go-Team (Admins).
-- Getrennt von `nachrichten` (Klientin ↔ Coachin): was eine Frau ihrer
-- Coachin schreibt, sieht der Admin weiterhin NICHT. Nur was sie bewusst
-- an das Team schreibt, landet hier.
--
--   team_nachrichten           — ein Verlauf pro Nutzerin (user_id)
--   admin_team_postfach()      — Übersicht: wer hat geschrieben, wie viel ungelesen
--   admin_team_verlauf(user)   — Verlauf mit einer Nutzerin (markiert gelesen)
--   admin_team_senden(user,t)  — Antwort an eine Nutzerin
--   admin_team_rundnachricht(t)— eine Nachricht an alle Mitglieder
--   team_nachrichten_gelesen() — Nutzerin markiert Team-Antworten als gelesen
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS team_nachrichten (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  absender    TEXT NOT NULL CHECK (absender IN ('team', 'mitglied')),
  text        TEXT NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 4000),
  rund        BOOLEAN NOT NULL DEFAULT false,   -- Teil einer Rundnachricht
  gelesen_am  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_nachrichten_user ON team_nachrichten(user_id, created_at);

ALTER TABLE team_nachrichten ENABLE ROW LEVEL SECURITY;

-- Nutzerin: liest nur ihren eigenen Verlauf, schreibt nur als „mitglied“.
DROP POLICY IF EXISTS "Eigener Team-Verlauf" ON team_nachrichten;
CREATE POLICY "Eigener Team-Verlauf" ON team_nachrichten
  FOR SELECT USING (auth.uid() = user_id OR ist_admin());

DROP POLICY IF EXISTS "Nutzerin schreibt ans Team" ON team_nachrichten;
CREATE POLICY "Nutzerin schreibt ans Team" ON team_nachrichten
  FOR INSERT WITH CHECK (auth.uid() = user_id AND absender = 'mitglied' AND rund = false);

-- Kein UPDATE/DELETE über die Tabelle — gelesen setzen läuft über Funktionen.

CREATE OR REPLACE FUNCTION team_nachrichten_gelesen()
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE team_nachrichten SET gelesen_am = now()
   WHERE user_id = auth.uid() AND absender = 'team' AND gelesen_am IS NULL;
$$;
GRANT EXECUTE ON FUNCTION team_nachrichten_gelesen() TO authenticated;

-- ── Admin ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_team_postfach()
RETURNS TABLE (user_id UUID, email TEXT, letzte TEXT, letzte_von TEXT, letzte_am TIMESTAMPTZ, ungelesen BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  RETURN QUERY
    SELECT t.user_id, u.email::text, l.text, l.absender, l.created_at,
           count(*) FILTER (WHERE t.absender = 'mitglied' AND t.gelesen_am IS NULL)
      FROM team_nachrichten t
      JOIN auth.users u ON u.id = t.user_id
      JOIN LATERAL (
        SELECT x.text, x.absender, x.created_at FROM team_nachrichten x
         WHERE x.user_id = t.user_id ORDER BY x.created_at DESC LIMIT 1
      ) l ON true
     -- Verläufe, die nur aus einer Rundnachricht bestehen, blähen die Liste nicht auf.
     WHERE EXISTS (SELECT 1 FROM team_nachrichten y WHERE y.user_id = t.user_id AND NOT y.rund)
     GROUP BY t.user_id, u.email, l.text, l.absender, l.created_at
     ORDER BY 6 DESC, 5 DESC;
END $$;

CREATE OR REPLACE FUNCTION admin_team_verlauf(p_user UUID)
RETURNS TABLE (id UUID, absender TEXT, text TEXT, rund BOOLEAN, gelesen_am TIMESTAMPTZ, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  UPDATE team_nachrichten t SET gelesen_am = now()
   WHERE t.user_id = p_user AND t.absender = 'mitglied' AND t.gelesen_am IS NULL;
  RETURN QUERY
    SELECT t.id, t.absender, t.text, t.rund, t.gelesen_am, t.created_at
      FROM team_nachrichten t WHERE t.user_id = p_user ORDER BY t.created_at;
END $$;

CREATE OR REPLACE FUNCTION admin_team_senden(p_user UUID, p_text TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE neu UUID;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  INSERT INTO team_nachrichten (user_id, absender, text)
    VALUES (p_user, 'team', btrim(p_text)) RETURNING id INTO neu;
  RETURN neu;
END $$;

CREATE OR REPLACE FUNCTION admin_team_rundnachricht(p_text TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE n INTEGER;
BEGIN
  IF NOT ist_admin() THEN RAISE EXCEPTION 'nur für Admins'; END IF;
  INSERT INTO team_nachrichten (user_id, absender, text, rund)
    SELECT u.id, 'team', btrim(p_text), true FROM auth.users u;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION admin_team_postfach(), admin_team_verlauf(UUID), admin_team_senden(UUID, TEXT), admin_team_rundnachricht(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_team_postfach(), admin_team_verlauf(UUID), admin_team_senden(UUID, TEXT), admin_team_rundnachricht(TEXT) TO authenticated;
