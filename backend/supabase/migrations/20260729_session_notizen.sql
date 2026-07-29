-- smile2go · Katman 1 · Baustein 5: Session Intelligence
-- Transkript → strukturierter Notiz-ENTWURF. Freigabe-Prinzip: nichts erreicht eine Klientin
-- ohne explizite Freigabe der Coachin. Einwilligungs-Gate: Analyse nur mit bestätigter
-- Einwilligung der Klientin (Art.-9-Nähe) — das Flag wird mitgespeichert und ist Pflicht.

CREATE TABLE IF NOT EXISTS session_notizen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  titel TEXT,                                   -- z. B. "Session 12.08. · A." (Coachin wählt; keine Klarnamen-Pflicht)
  transkript TEXT NOT NULL,
  notiz JSONB,                                  -- { kernthemen[], vereinbarungen[], aufgaben[], offene_punkte[] }
  notiz_text TEXT,                              -- lesbare Markdown-Fassung
  einwilligung_bestaetigt BOOLEAN NOT NULL DEFAULT false,  -- Pflicht-Gate VOR der Analyse
  freigegeben BOOLEAN NOT NULL DEFAULT false,   -- erst nach Freigabe später an Klientin teilbar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analyse ohne bestätigte Einwilligung darf gar nicht erst gespeichert werden können.
ALTER TABLE session_notizen
  ADD CONSTRAINT chk_einwilligung CHECK (einwilligung_bestaetigt = true);

ALTER TABLE session_notizen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coachin sieht nur ihre eigenen Session-Notizen" ON session_notizen
  FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coachin legt nur eigene Session-Notizen an" ON session_notizen
  FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coachin aktualisiert nur eigene Session-Notizen" ON session_notizen
  FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coachin loescht nur eigene Session-Notizen" ON session_notizen
  FOR DELETE USING (auth.uid() = coach_id);
