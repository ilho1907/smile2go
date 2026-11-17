/* Öffentliches Expertinnen-Verzeichnis – Phase 1 (statische Datenquelle).
   REGEL (Masterplan 01/05): Öffentlich erscheint nur, wer den Prüfprozess
   vollständig durchlaufen hat und von der Administratorin freigegeben wurde.
   Solange `freigegeben` false ist, wird die Person NICHT angezeigt.
   Keine Qualifikationen eintragen, die nicht belegt und geprüft sind.

   Ab Phase 3 kommt diese Liste aus der Datenbank (expert_profiles, Status
   „approved"/„seller_ready"); diese Datei wird dann entfernt. */

export const EXPERTINNEN = [
  // Beispiel-Struktur. Eintrag erst nach dokumentierter Freigabe auf true setzen.
  // { id: "anja", name: "Anja Kretschmer", schwerpunkte: ["Frauen-Coaching"], sprachen: ["DE"], formate: ["Einzelsession", "Retreat"], kurz: "", bild: "", freigegeben: false },
];

export const freigegebeneExpertinnen = () => EXPERTINNEN.filter((e) => e.freigegeben === true);
