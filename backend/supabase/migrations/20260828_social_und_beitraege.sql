-- smile2go · Soziales: Beiträge der Coachin in der App, echte Profil-Links, Einladungen
--
-- Kein Instagram-API-Zwang: die Coachin (oder ihr n8n-Workflow) schreibt ihre
-- Inhalte hierher, die App zeigt sie. Ein Link führt zum Original-Post.

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS youtube   TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS pinterest TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS website   TEXT;

CREATE TABLE IF NOT EXISTS coach_beitraege (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  titel TEXT,
  text TEXT NOT NULL,
  bild_pfad TEXT,                                   -- coach-material/<coach_id>/…
  quelle TEXT NOT NULL DEFAULT 'app'
    CHECK (quelle IN ('app','instagram','youtube','pinterest','blog','newsletter')),
  extern_url TEXT,
  veroeffentlicht_am TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sichtbar BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beitraege_coach ON coach_beitraege(coach_id, veroeffentlicht_am DESC);

ALTER TABLE coach_beitraege ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coachin verwaltet ihre Beitraege" ON coach_beitraege;
DROP POLICY IF EXISTS "Coachin verwaltet ihre Beitraege" ON coach_beitraege;
CREATE POLICY "Coachin verwaltet ihre Beitraege" ON coach_beitraege
  FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Klientin liest die Beitraege ihrer Coachin" ON coach_beitraege;
DROP POLICY IF EXISTS "Klientin liest die Beitraege ihrer Coachin" ON coach_beitraege;
CREATE POLICY "Klientin liest die Beitraege ihrer Coachin" ON coach_beitraege
  FOR SELECT USING (
    sichtbar AND EXISTS (
      SELECT 1 FROM klientinnen k
      WHERE k.coach_id = coach_beitraege.coach_id AND k.user_id = auth.uid()
    )
  );

-- Einladungen von Klientin zu Freundin. Bewusst nur ein Zaehler:
-- wer eingeladen wird, landet in KEINER Verteilerliste — sie registriert sich
-- selbst und gibt ihre Einwilligung dort (§ 7 UWG).
CREATE TABLE IF NOT EXISTS einladungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  von_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  geteilt_am TIMESTAMP WITH TIME ZONE DEFAULT now(),
  kanal TEXT
);

ALTER TABLE einladungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Einladungen" ON einladungen;
DROP POLICY IF EXISTS "Eigene Einladungen" ON einladungen;
CREATE POLICY "Eigene Einladungen" ON einladungen
  FOR ALL TO authenticated USING (von_user_id = auth.uid()) WITH CHECK (von_user_id = auth.uid());
