-- smile2go · Materialien, Angebote, Kursinhalte, Anfragen
--
-- Ersetzt die fest im Code stehenden Listen (DOWNLOADS, RESSOURCEN,
-- PLATTFORM_KURSE, SHOP …). Ohne Bezahlung: statt Kauf gibt es eine Anfrage,
-- die bei der Coachin landet. Preise stehen als Cent-Betrag bereit, damit
-- spaeter nur noch ein Zahlungsschritt ergaenzt werden muss.

-- ---------------------------------------------------------------------------
-- 1 · Materialien der Coachin (PDF, Video, Audio, Artikel)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS materialien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  klientin_id UUID REFERENCES klientinnen(id) ON DELETE CASCADE,  -- NULL = fuer alle
  titel TEXT NOT NULL,
  beschreibung TEXT,
  kategorie TEXT NOT NULL DEFAULT 'Artikel'
    CHECK (kategorie IN ('Artikel','E-Books','Videos','Audio','Aufgabe')),
  datei_pfad TEXT,                       -- coach-material/<coach_id>/…
  extern_url TEXT,
  sichtbar_ab TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (datei_pfad IS NOT NULL OR extern_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_material_coach ON materialien(coach_id, sichtbar_ab DESC);

ALTER TABLE materialien ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coachin verwaltet ihre Materialien" ON materialien;
CREATE POLICY "Coachin verwaltet ihre Materialien" ON materialien
  FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Klientin sieht ihre Materialien" ON materialien;
CREATE POLICY "Klientin sieht ihre Materialien" ON materialien
  FOR SELECT USING (
    sichtbar_ab <= now()
    AND EXISTS (
      SELECT 1 FROM klientinnen k
      WHERE k.user_id = auth.uid()
        AND k.coach_id = materialien.coach_id
        AND (materialien.klientin_id IS NULL OR materialien.klientin_id = k.id)
    )
  );

-- ---------------------------------------------------------------------------
-- 2 · Angebote: Kurse, Pakete, Retreats, Shop
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS angebote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  typ TEXT NOT NULL DEFAULT 'kurs' CHECK (typ IN ('kurs','paket','retreat','shop')),
  titel TEXT NOT NULL,
  untertitel TEXT,
  beschreibung TEXT,
  thema TEXT,
  preis_cent INTEGER,
  waehrung TEXT NOT NULL DEFAULT 'EUR',
  einheiten TEXT,                        -- z. B. "8 Einheiten", "4 Wochen"
  bild_pfad TEXT,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  reihenfolge INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_angebote_coach ON angebote(coach_id, reihenfolge) WHERE aktiv;

ALTER TABLE angebote ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coachin verwaltet ihre Angebote" ON angebote;
CREATE POLICY "Coachin verwaltet ihre Angebote" ON angebote
  FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Klientin sieht die Angebote ihrer Coachin" ON angebote;
CREATE POLICY "Klientin sieht die Angebote ihrer Coachin" ON angebote
  FOR SELECT USING (
    aktiv AND EXISTS (SELECT 1 FROM klientinnen k
                      WHERE k.user_id = auth.uid() AND k.coach_id = angebote.coach_id)
  );

-- ---------------------------------------------------------------------------
-- 3 · Kursinhalt und Fortschritt
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS kurs_module (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  angebot_id UUID NOT NULL REFERENCES angebote(id) ON DELETE CASCADE,
  nr INTEGER NOT NULL DEFAULT 1,
  titel TEXT NOT NULL,
  typ TEXT NOT NULL DEFAULT 'text' CHECK (typ IN ('video','audio','text','aufgabe')),
  text TEXT,
  datei_pfad TEXT,
  dauer_min INTEGER,
  UNIQUE (angebot_id, nr)
);

ALTER TABLE kurs_module ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coachin verwaltet ihre Module" ON kurs_module;
CREATE POLICY "Coachin verwaltet ihre Module" ON kurs_module
  FOR ALL USING (
    EXISTS (SELECT 1 FROM angebote a WHERE a.id = kurs_module.angebot_id AND a.coach_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM angebote a WHERE a.id = kurs_module.angebot_id AND a.coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "Klientin sieht Module ihrer Coachin" ON kurs_module;
CREATE POLICY "Klientin sieht Module ihrer Coachin" ON kurs_module
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM angebote a
      JOIN klientinnen k ON k.coach_id = a.coach_id
      WHERE a.id = kurs_module.angebot_id AND a.aktiv AND k.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS kurs_fortschritt (
  klientin_id UUID NOT NULL REFERENCES klientinnen(id) ON DELETE CASCADE,
  modul_id UUID NOT NULL REFERENCES kurs_module(id) ON DELETE CASCADE,
  erledigt_am TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (klientin_id, modul_id)
);

ALTER TABLE kurs_fortschritt ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fortschritt gehoert beiden Seiten" ON kurs_fortschritt;
CREATE POLICY "Fortschritt gehoert beiden Seiten" ON kurs_fortschritt
  FOR ALL USING (
    EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = kurs_fortschritt.klientin_id
            AND (k.user_id = auth.uid() OR k.coach_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = kurs_fortschritt.klientin_id AND k.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4 · Anfragen statt Kauf (bis es eine Bezahlung gibt)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS anfragen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  angebot_id UUID REFERENCES angebote(id) ON DELETE SET NULL,
  klientin_id UUID NOT NULL REFERENCES klientinnen(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  nachricht TEXT,
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','beantwortet','erledigt')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anfragen_coach ON anfragen(coach_id, status, created_at DESC);

ALTER TABLE anfragen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Beide Seiten sehen ihre Anfragen" ON anfragen;
CREATE POLICY "Beide Seiten sehen ihre Anfragen" ON anfragen
  FOR SELECT USING (
    auth.uid() = coach_id
    OR EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = anfragen.klientin_id AND k.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Klientin stellt eigene Anfrage" ON anfragen;
CREATE POLICY "Klientin stellt eigene Anfrage" ON anfragen
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM klientinnen k WHERE k.id = anfragen.klientin_id AND k.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Coachin bearbeitet Anfragen" ON anfragen;
CREATE POLICY "Coachin bearbeitet Anfragen" ON anfragen
  FOR UPDATE USING (auth.uid() = coach_id);
