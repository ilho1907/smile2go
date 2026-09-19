-- smile2go · Coach-Rolle bei der Registrierung
-- Bisher entstand eine coaches-Zeile als Nebenwirkung (upsert in der Coach-Werkstatt).
-- Jetzt ist es eine bewusste Entscheidung der Nutzerin: "Ich bin Coachin".

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS ist_coach BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN coaches.ist_coach IS
  'true = Nutzerin hat sich selbst als Coachin markiert (Registrierung oder Profil). '
  'Steuert nur die Sichtbarkeit des Coach-Bereichs, keine Rechte an fremden Daten.';
