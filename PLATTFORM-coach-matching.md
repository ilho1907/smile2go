# Coach-Matching — gehört auf die PLATTFORM (Website), NICHT in die tägliche App

Die Coach-Suche/Matching läuft auf der Marketing-Plattform (Webflow/Website), damit neue Klientinnen dort ihre passende Coachin finden und sich anmelden. Die tägliche App (smile2go PWA) bleibt schlank und begleitet die bereits gematchte Klientin.

Diese Datei bewahrt die Coach-Daten + die Matching-Logik auf, damit nichts verloren geht und die Plattform sie übernehmen kann.

## Filter (Matching-Kriterien)
- **Bereich:** Alle · Life · Business · Persönlichkeit · Prüfung
- **Sprache:** Alle · DE · EN · TR
- **Budget je Session:** Alle · ≤ 80 € · ≤ 120 € · ≤ 200 €

Logik: Coach wird angezeigt, wenn (Bereich = Alle ODER enthält gewählten Bereich) UND (Sprache = Alle ODER enthält gewählte Sprache) UND (Preis ≤ Budget-Grenze).

## Coach-Datensatz (Startbestand, erweiterbar)

```json
[
  { "name": "Anja M.",    "emoji": "🌿", "bereiche": ["Persönlichkeit","Life"], "sprachen": ["DE","EN"],      "preis": 120, "rating": 4.9, "bio": "Ruhe, Selbstfürsorge & innere Klarheit — Begleiterin bei smile2go.", "mine": true },
  { "name": "Sabrina K.", "emoji": "💼", "bereiche": ["Business"],               "sprachen": ["DE"],           "preis": 180, "rating": 4.8, "bio": "Führung, Sichtbarkeit & Selbstvertrauen im Job." },
  { "name": "Leyla T.",   "emoji": "📚", "bereiche": ["Prüfung","Life"],         "sprachen": ["DE","TR","EN"], "preis": 75,  "rating": 4.7, "bio": "Prüfungsangst, Fokus & Lernstruktur." },
  { "name": "Miriam W.",  "emoji": "✨", "bereiche": ["Persönlichkeit"],          "sprachen": ["DE","EN"],      "preis": 95,  "rating": 5.0, "bio": "Glaubenssätze, Achtsamkeit & Neuanfang." },
  { "name": "Deniz A.",   "emoji": "🌙", "bereiche": ["Life","Business"],         "sprachen": ["DE","TR"],      "preis": 110, "rating": 4.6, "bio": "Work-Life-Balance & gesunde Grenzen setzen." }
]
```

## Empfohlene Coach-Felder für die spätere DB (Plattform)
`id, name, foto_url, bereiche[], sprachen[], preis_min, preis_max, rating, anzahl_bewertungen, bio, standort, verfügbarkeit, profil_url, aktiv`

## Übergang Plattform → App
Nach Match auf der Plattform bucht die Klientin ihre Coachin und erhält Zugang zur App; in der App ist diese Coachin dann fest als „Deine Coachin" hinterlegt (Coach-Chat, Termine, Ziele, Aufgaben).
