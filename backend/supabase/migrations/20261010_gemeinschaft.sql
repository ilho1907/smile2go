-- ---------------------------------------------------------------------------
-- smile2go · Gemeinschaft: die freie Mediathek, die von den Coachinnen kommt
-- (10.10.2026)
--
-- Ausgangslage: Die meisten Frauen in der App haben KEINE Coachin — kein Geld,
-- keine Entscheidung, oder einfach noch nicht so weit. Bisher sah genau diese
-- Mehrheit gar nichts: materialien, angebote und kurs_module haengen alle an
-- einer bestehenden Bindung (klientinnen).
--
-- Die Gemeinschaft dreht das um:
--   · Jede Coachin bringt beim Start mindestens einen freien Beitrag ein —
--     ihr Eintritt ins System, nicht die Anmeldung.
--   · Jede angemeldete Frau sieht alle freien Beitraege, ohne Bindung,
--     sortiert nach dem, was sie gerade braucht ("Ich kann nicht schlafen").
--   · Jeder Beitrag traegt das Gesicht seiner Coachin. So begegnen sich die
--     beiden Seiten ueber Inhalte statt ueber Werbung.
--
-- Nichts Bestehendes wird ersetzt: materialien bleibt das private Material
-- der eigenen Klientinnen, angebote bleibt das bezahlte Angebot. Das hier ist
-- die offene Ebene darunter.
--
-- Vier Entscheidungen, die bei 300 Coachinnen nicht mehr nachholbar waeren und
-- deshalb jetzt schon drinstecken:
--   1) gesehen.anteil — die Vollendungsquote ist das einzige ehrliche
--      Ranking-Signal. Herzen und Klicks messen das Vorschaubild.
--   2) Video liegt NIE bei uns (CHECK weiter unten). Der Kanal gehoert ihr,
--      die Abonnentin auch.
--   3) beduerfnis ist EIN gemeinsames Vokabular fuer Mediathek, Live,
--      Wochenbericht und Profil.
--   4) Teures (Stimme, Video) stoesst die Coachin an, nicht die Besucherin.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1 · Die freien Beitraege
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gemeinschaft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  einleitung TEXT,                       -- ein, zwei Saetze: fuer wen ist das?
  typ TEXT NOT NULL DEFAULT 'uebung'
    CHECK (typ IN ('video','audio','uebung','text')),
  -- Das Beduerfnis, nicht das Thema: wonach eine Frau um 23 Uhr sucht.
  -- Die gueltige Liste steht als BEDUERFNISSE in der App, damit neue
  -- Zustaende ohne Migration dazukommen koennen.
  beduerfnis TEXT NOT NULL,
  dauer_min INTEGER,
  datei_pfad TEXT,                       -- gemeinschaft/<coach_id>/… (nur Audio)
  extern_url TEXT,                       -- YouTube, Vimeo …
  text TEXT,                             -- fuer typ='text' und 'uebung'
  sprache TEXT NOT NULL DEFAULT 'de',
  freigegeben BOOLEAN NOT NULL DEFAULT true,
  aufrufe INTEGER NOT NULL DEFAULT 0,
  herzen INTEGER NOT NULL DEFAULT 0,
  -- Laufender Durchschnitt der Vollendungsquote (0–100) und Zahl der Messungen.
  -- Daraus entsteht spaeter das Ranking; bei wenigen Beitraegen noch egal,
  -- bei zweitausend ist es das ganze Produkt.
  anteil_schnitt NUMERIC(5,2) NOT NULL DEFAULT 0,
  anteil_anzahl INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (datei_pfad IS NOT NULL OR extern_url IS NOT NULL OR text IS NOT NULL),
  -- Video liegt immer extern. Kein Videospeicher bei uns, auf keiner Stufe.
  CHECK (typ <> 'video' OR extern_url IS NOT NULL),
  CHECK (typ <> 'video' OR datei_pfad IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_gem_beduerfnis
  ON gemeinschaft(beduerfnis, anteil_schnitt DESC, created_at DESC)
  WHERE freigegeben;
CREATE INDEX IF NOT EXISTS idx_gem_coach ON gemeinschaft(coach_id, created_at DESC);

ALTER TABLE gemeinschaft ENABLE ROW LEVEL SECURITY;

-- Jede angemeldete Frau sieht alles Freigegebene — ohne Bindung, ohne Bezahlung.
DROP POLICY IF EXISTS "Alle sehen die freien Beitraege" ON gemeinschaft;
CREATE POLICY "Alle sehen die freien Beitraege" ON gemeinschaft
  FOR SELECT TO authenticated USING (freigegeben);

DROP POLICY IF EXISTS "Coachin verwaltet ihre Beitraege" ON gemeinschaft;
CREATE POLICY "Coachin verwaltet ihre Beitraege" ON gemeinschaft
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- ---------------------------------------------------------------------------
-- 2 · Herz und Gesehen — getrennt, damit die Zaehler nicht manipulierbar sind
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gemeinschaft_herz (
  beitrag_id UUID NOT NULL REFERENCES gemeinschaft(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (beitrag_id, user_id)
);

ALTER TABLE gemeinschaft_herz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigenes Herz" ON gemeinschaft_herz;
CREATE POLICY "Eigenes Herz" ON gemeinschaft_herz
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS gemeinschaft_gesehen (
  beitrag_id UUID NOT NULL REFERENCES gemeinschaft(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anteil INTEGER NOT NULL DEFAULT 0 CHECK (anteil BETWEEN 0 AND 100),
  zurueck BOOLEAN NOT NULL DEFAULT false,   -- spaeter noch einmal geoeffnet
  zuletzt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (beitrag_id, user_id)
);

ALTER TABLE gemeinschaft_gesehen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigenes Gesehen" ON gemeinschaft_gesehen;
CREATE POLICY "Eigenes Gesehen" ON gemeinschaft_gesehen
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Zaehler pflegen sich selbst — niemand schreibt direkt in gemeinschaft.
CREATE OR REPLACE FUNCTION gem_herz_zaehlen() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gemeinschaft SET herzen = herzen + 1 WHERE id = NEW.beitrag_id;
  ELSE
    UPDATE gemeinschaft SET herzen = GREATEST(herzen - 1, 0) WHERE id = OLD.beitrag_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_gem_herz ON gemeinschaft_herz;
CREATE TRIGGER trg_gem_herz AFTER INSERT OR DELETE ON gemeinschaft_herz
  FOR EACH ROW EXECUTE FUNCTION gem_herz_zaehlen();

-- Aufruf beim ersten Oeffnen, Vollendungsquote bei jeder Aktualisierung.
CREATE OR REPLACE FUNCTION gem_gesehen_zaehlen() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gemeinschaft SET aufrufe = aufrufe + 1 WHERE id = NEW.beitrag_id;
  END IF;
  -- Laufender Mittelwert: nur wenn der Anteil wirklich gestiegen ist, zaehlt
  -- er als neue Messung. Mehrfaches Speichern desselben Fortschritts
  -- verfaelscht das Ranking damit nicht.
  IF NEW.anteil > COALESCE(OLD.anteil, -1) THEN
    UPDATE gemeinschaft g
       SET anteil_schnitt = ROUND(
             (g.anteil_schnitt * g.anteil_anzahl + NEW.anteil)::numeric
             / (g.anteil_anzahl + 1), 2),
           anteil_anzahl = g.anteil_anzahl + 1
     WHERE g.id = NEW.beitrag_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_gem_gesehen ON gemeinschaft_gesehen;
CREATE TRIGGER trg_gem_gesehen AFTER INSERT OR UPDATE ON gemeinschaft_gesehen
  FOR EACH ROW EXECUTE FUNCTION gem_gesehen_zaehlen();

-- ---------------------------------------------------------------------------
-- 3 · Wer etwas beitraegt, wird sichtbar
-- ---------------------------------------------------------------------------
-- Bisher war ein Coach-Profil nur fuer die eigenen Klientinnen lesbar. Damit
-- eine Frau ohne Bindung erfahren kann, von wem die Uebung kommt, die ihr
-- gerade geholfen hat, wird ein Profil oeffentlich — aber erst, wenn die
-- Coachin etwas eingebracht hat.

DROP POLICY IF EXISTS "Coachin mit Beitrag ist sichtbar" ON coaches;
CREATE POLICY "Coachin mit Beitrag ist sichtbar" ON coaches
  FOR SELECT TO authenticated USING (
    ist_coach AND EXISTS (
      SELECT 1 FROM gemeinschaft g WHERE g.coach_id = coaches.id AND g.freigegeben
    )
  );

-- Dasselbe fuer ihr Schaufenster. Anfragen und Kauf bleiben an die Bindung
-- gekoppelt — das aendert diese Regel nicht.
DROP POLICY IF EXISTS "Angebote einer sichtbaren Coachin" ON angebote;
CREATE POLICY "Angebote einer sichtbaren Coachin" ON angebote
  FOR SELECT TO authenticated USING (
    aktiv AND EXISTS (
      SELECT 1 FROM gemeinschaft g WHERE g.coach_id = angebote.coach_id AND g.freigegeben
    )
  );

-- ---------------------------------------------------------------------------
-- 4 · Dateien der Gemeinschaft (nur Audio — Video liegt extern)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('gemeinschaft', 'gemeinschaft', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Gemeinschaft lesen" ON storage.objects;
CREATE POLICY "Gemeinschaft lesen" ON storage.objects
  FOR SELECT USING (bucket_id = 'gemeinschaft');

DROP POLICY IF EXISTS "Coachin laedt in die Gemeinschaft" ON storage.objects;
CREATE POLICY "Coachin laedt in die Gemeinschaft" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'gemeinschaft' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Coachin loescht aus der Gemeinschaft" ON storage.objects;
CREATE POLICY "Coachin loescht aus der Gemeinschaft" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'gemeinschaft' AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 5 · Beduerfnis-Profil: woher die App weiss, was eine Frau gerade braucht
-- ---------------------------------------------------------------------------
-- Kein Modell, kein Embedding: ein Zaehler je Beduerfnis, der woechentlich
-- abklingt. Erklaerbar, billig, und von der Frau selbst einsehbar und
-- loeschbar. Gespeist wird er NUR aus dem, was sie bewusst antippt —
-- niemals aus Tagebuchtext.

CREATE TABLE IF NOT EXISTS beduerfnis_profil (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beduerfnis TEXT NOT NULL,
  wert NUMERIC(7,2) NOT NULL DEFAULT 0,
  aktualisiert TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, beduerfnis)
);

ALTER TABLE beduerfnis_profil ENABLE ROW LEVEL SECURITY;

-- Ihr eigenes Profil. Keine Coachin, kein Admin liest hier mit; das Matching
-- laeuft serverseitig in einer Edge Function, nicht ueber eine Abfrage.
DROP POLICY IF EXISTS "Eigenes Beduerfnis-Profil" ON beduerfnis_profil;
CREATE POLICY "Eigenes Beduerfnis-Profil" ON beduerfnis_profil
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Punkte addieren und dabei die vergangene Zeit abklingen lassen (~15 % pro
-- Woche). So verfolgt ein "schlaflos" von vor drei Monaten niemanden ewig.
CREATE OR REPLACE FUNCTION beduerfnis_merken(p_beduerfnis TEXT, p_punkte NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_neu  NUMERIC;
BEGIN
  IF v_user IS NULL THEN RETURN NULL; END IF;
  IF p_punkte IS NULL OR p_punkte <= 0 OR p_punkte > 20 THEN RETURN NULL; END IF;

  INSERT INTO beduerfnis_profil (user_id, beduerfnis, wert, aktualisiert)
  VALUES (v_user, p_beduerfnis, p_punkte, now())
  ON CONFLICT (user_id, beduerfnis) DO UPDATE
    SET wert = LEAST(
          beduerfnis_profil.wert
            * POWER(0.85, EXTRACT(EPOCH FROM (now() - beduerfnis_profil.aktualisiert)) / 604800)
          + p_punkte, 100),
        aktualisiert = now()
  RETURNING wert INTO v_neu;

  RETURN v_neu;
END $$;

-- "Das interessiert mich nicht mehr" — setzt genau dieses Beduerfnis zurueck.
CREATE OR REPLACE FUNCTION beduerfnis_vergessen(p_beduerfnis TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  DELETE FROM beduerfnis_profil
   WHERE user_id = auth.uid() AND beduerfnis = p_beduerfnis;
END $$;

-- Was die App fuer die Startreihenfolge braucht: die abgeklungenen Werte.
CREATE OR REPLACE FUNCTION meine_beduerfnisse()
RETURNS TABLE (beduerfnis TEXT, wert NUMERIC)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT b.beduerfnis,
         ROUND(b.wert * POWER(0.85,
           EXTRACT(EPOCH FROM (now() - b.aktualisiert)) / 604800), 2) AS wert
    FROM beduerfnis_profil b
   WHERE b.user_id = auth.uid()
   ORDER BY 2 DESC;
$$;

GRANT EXECUTE ON FUNCTION beduerfnis_merken(TEXT, NUMERIC)  TO authenticated;
GRANT EXECUTE ON FUNCTION beduerfnis_vergessen(TEXT)        TO authenticated;
GRANT EXECUTE ON FUNCTION meine_beduerfnisse()              TO authenticated;
