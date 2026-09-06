-- Tageslimit für die KI-Nutzung: schützt vor unerwarteten API-Kosten.
CREATE TABLE IF NOT EXISTS ki_nutzung (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag     DATE NOT NULL DEFAULT CURRENT_DATE,
  anzahl  INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, tag)
);

ALTER TABLE ki_nutzung ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutzerin sieht nur ihren eigenen Verbrauch" ON ki_nutzung;
CREATE POLICY "Nutzerin sieht nur ihren eigenen Verbrauch" ON ki_nutzung
  FOR SELECT USING (auth.uid() = user_id);

-- Zaehlt eine Anfrage und liefert den neuen Tagesstand zurueck.
CREATE OR REPLACE FUNCTION ki_zaehlen(p_user UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_neu INT;
BEGIN
  INSERT INTO ki_nutzung (user_id, tag, anzahl)
  VALUES (p_user, CURRENT_DATE, 1)
  ON CONFLICT (user_id, tag) DO UPDATE SET anzahl = ki_nutzung.anzahl + 1
  RETURNING anzahl INTO v_neu;
  RETURN v_neu;
END $$;

REVOKE ALL ON FUNCTION ki_zaehlen(UUID) FROM PUBLIC;
