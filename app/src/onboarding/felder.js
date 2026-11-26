// Gemeinsame Auswahllisten für Kennenlerngespräch, Verifizierung und Gratis-Produkt
// (Formulare A–E). Mitglieder-App, Coach-Bereich und s2g.admin lesen von hier,
// damit überall dieselben Werte in der Datenbank landen.

export const LEBENSTHEMEN = [
  "Trauer", "Trennung & Liebeskummer", "Beziehung", "Selbstwert", "Grenzen",
  "Neuanfang", "Geld & Fülle", "Loslassen", "Unruhe & Anspannung", "Nach dem Betrug",
];
export const THEMA_OFFEN = "Weiß ich noch nicht";

export const INTERESSEN = ["Meditation", "Tagebuch", "Yoga", "Community", "Kurse", "1:1 mit Coachin"];
export const SPRACHEN = ["Deutsch", "Türkisch", "Englisch"];
export const QUELLEN = ["Instagram", "Empfehlung", "Google", "Über eine Coachin", "Sonstiges"];

export const ROLLEN = ["Coachin", "Expertin", "Mentorin"];

export const PRODUKT_ARTEN = [
  { id: "videokurs", t: "Videokurs", icon: "🎬", umfang: "Anzahl Lektionen + Gesamtdauer, z. B. „5 Lektionen · 45 Min“", inhalte: "Ein Link pro Zeile (Vimeo/YouTube „nicht gelistet“ — wird nicht eingebettet)", mass: "3–7 Lektionen, 20–90 Minuten" },
  { id: "workbook", t: "Workbook", icon: "📘", umfang: "Seitenzahl, z. B. „16 Seiten“", inhalte: "Link zur PDF (z. B. Google Drive, nur Lesen)", mass: "8–30 Seiten" },
  { id: "workshop", t: "Workshop (live)", icon: "🎥", umfang: "Dauer + Termine, z. B. „60 Min · 3 Termine“", inhalte: "Termine (Datum, Uhrzeit) + max. Teilnehmerinnen; den Zoom-Link schickst du später", mass: "45–90 Minuten, max. 20 Frauen" },
];
export const artName = (id) => PRODUKT_ARTEN.find((a) => a.id === id)?.t || id;

export const METHODEN = [
  "Kognitive Verhaltenstherapie (angelehnt)", "DBT (angelehnt)", "ACT (angelehnt)", "Self-Compassion",
  "Achtsamkeit", "Yoga", "Positive Psychologie", "Sonstiges",
];

// Formular E — Checkliste. Die Freigabe geht nur, wenn ALLE Punkte abgehakt sind
// (die Datenbank prüft das ebenfalls: admin_gratis_pruefen verlangt 10 × true).
export const FREIGABE_CHECK = [
  { k: "coach_verifiziert", t: "Coachin ist verifiziert (Formular C)" },
  { k: "thema_passt", t: "Thema passt zum Hauptthema der Coachin" },
  { k: "mindestmass", t: "Mindestmaß erfüllt (Lektionen / Seiten / Dauer)" },
  { k: "keine_heilversprechen", t: "Keine Heilversprechen, Diagnosen oder Medikamentenhinweise" },
  { k: "hinweise_da", t: "„Angelehnt an …, keine Therapie“ und Krisenhinweis vorhanden" },
  { k: "links_ok", t: "Links funktionieren, Videos nicht öffentlich, nichts eingebettet" },
  { k: "keine_fremdwerbung", t: "Keine Werbung für fremde Plattformen im Gratis-Teil" },
  { k: "rechte", t: "Rechte an Musik und Bildern bestätigt" },
  { k: "sprache", t: "Sprache respektvoll, ohne Druck oder Angst-Marketing" },
  { k: "vorschau", t: "Vorschaubild und Beschreibung passen" },
];

// Formular C, Teil 3 — Prüfpunkte im Videogespräch
export const VERIFIZIERUNG_CHECK = [
  { k: "video", t: "Videogespräch (20 Min.) geführt" },
  { k: "identitaet", t: "Name stimmt mit dem gezeigten Zertifikat überein" },
  { k: "zertifikat", t: "Zertifikat plausibel (Institut existiert, passt zum Thema)" },
  { k: "auftreten", t: "Öffentliches Auftreten ohne Heilversprechen" },
];

export const KRISE_HINWEIS = "Dies ist kein Therapieangebot. In einer Krise: 112 oder TelefonSeelsorge 0800 111 0 111 (rund um die Uhr, kostenfrei).";
