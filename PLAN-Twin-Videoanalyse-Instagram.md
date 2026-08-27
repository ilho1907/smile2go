# Plan · Coach Twin, Videoanalyse, Instagram

Stand 27.08.2026. Reihenfolge nach Nutzen pro Aufwand, alles ohne laufende Kosten,
solange nicht ausdrücklich anders vermerkt.

---

## 0 · Was schon im Code steht

| Baustein | Zustand |
|---|---|
| `CoachTwinInterview` | Konfigurationsinterview für Methode, Sprache, Grenzen — erzeugt ein **Dossier** |
| `coach_dossier` | versioniert, mit ausdrücklicher **Freigabe** (`freigegeben`, `freigegeben_am`) |
| `tonalitaetsZusatz()` | hängt Ton, Anrede, Kernbegriffe, Tabus an jeden ilho-Prompt |
| `stimm_profile` + `/tts` | Stimmklon-Anbindung samt Einwilligungstext und Widerruf |
| `SessionIntelligenz` | Transkript → strukturierte Notiz (Claude), Diktat über Web Speech |
| `content_embeddings` + `suche_inhalte_text` | Wissensarchiv der Coachin mit Textsuche |
| `coach_beitraege` | Inhalte der Coachin erscheinen in der App — **ohne** Instagram-API |

### Ein Fehler, der jetzt behoben werden kann

`App.jsx` lädt den Twin mit `ladeEigenesDossier()` — das ist das Dossier **der
angemeldeten Person selbst**. Eine Klientin lädt damit ihr eigenes (leeres) Dossier,
nie das ihrer Coachin. Bis jetzt ließ sich das gar nicht richtig auflösen, weil die
Zuordnung fehlte. Mit der neuen `klientinnen`-Bindung ist es ein Zweizeiler:

```js
// statt ladeEigenesDossier()
ladeDossierMeinerCoachin(bindung.coach_id)   // liest coach_dossier_aktiv
```

Ohne diesen Fix spricht ilho bei jeder Klientin im Standardton — der ganze Twin
läuft ins Leere.

---

## 1 · Coach Twin — vier Stufen

**Stufe 1 · Bindung (klein, sofort)**
Twin über `bindung.coach_id` laden, in der App sichtbar machen („ilho spricht im Ton
von …"), Widerruf durch die Coachin wirkt sofort. Aufwand: ein halber Tag.

**Stufe 2 · Wissen statt nur Ton**
Heute prägt das Dossier die *Tonalität*. Der nächste Schritt ist Inhalt: bei jeder
Frage `sucheInhalte()` laufen lassen und die drei besten Treffer aus dem Archiv der
Coachin in den Prompt geben — mit der Anweisung, ausschließlich daraus zu antworten
und sonst an die Coachin zu verweisen. Damit antwortet ilho mit *ihren* Inhalten,
nicht mit Allgemeinwissen. Aufwand: ein bis zwei Tage.

**Stufe 3 · Stimme**
`stimm_profile` ist vorbereitet. Freischalten erst, wenn die schriftliche
Einwilligung, der Widerruf und die Kennzeichnung („KI-Stimme") stehen — beides ist
im Code schon angelegt. Kosten entstehen erst beim TTS-Anbieter.

**Stufe 4 · Qualitätsschleife**
Die Coachin bekommt im Panel fünf Beispielantworten ihres Twins, korrigiert sie im
Freitext, die Korrekturen fließen als Version v+1 ins Dossier. So wird der Twin mit
jeder Runde ähnlicher — ohne Training, nur über das Dossier.

**Grenzen, die bleiben:** ilho sagt immer, dass er eine KI ist, gibt sich nie als die
Coachin aus, stellt keine Diagnosen und übergibt bei Krisenanzeichen an einen
Menschen. Das steht bereits im Systemprompt und darf nicht aufgeweicht werden.

---

## 2 · Videoanalyse für Coachinnen

Ziel: Session-Aufnahme → Transkript → strukturierte Notiz. Der zweite Teil existiert
schon (`SessionIntelligenz`), es fehlt nur der Weg von der Datei zum Text.

### Drei Wege zur Transkription

| Weg | Kosten | Daten | Urteil |
|---|---|---|---|
| **A · Lokal auf dem Mac** (whisper.cpp / MacWhisper) | 0 € | verlassen den Rechner nie | **Empfehlung.** Für Coaching-Aufnahmen der sauberste Weg |
| B · Cloud-STT (Deepgram, AssemblyAI, OpenAI) | pro Minute | Auftragsverarbeitung nötig, EU-Region prüfen | später, wenn Menge es verlangt |
| C · Web Speech im Browser | 0 € | lokal | nur live und unzuverlässig — taugt zum Diktieren, nicht für Aufnahmen |

### Ablauf im Coach-Panel (neuer Reiter „Session")

1. Coachin wählt die Aufnahme aus — sie wird **nicht** hochgeladen
2. Ein mitgeliefertes Skript transkribiert lokal (`whisper.cpp`, deutsches Modell)
3. Transkript landet im Feld, das heute schon existiert
4. Claude strukturiert: Themen, Muster, offene Fäden, Vorschlag für die nächste Session
5. Notiz speichern — optional für die Klientin freigeben

### Vor dem ersten Einsatz zu klären

- Einwilligung der Klientin **zur Aufnahme** und **getrennt davon** zur KI-Auswertung
  (Art. 9 DSGVO — die Checkbox dafür ist bereits eingebaut)
- Aufbewahrungsfrist und Löschroutine für Aufnahmen
- Wo Aufnahmen liegen (lokal empfohlen, nicht im Bucket)

Auswertung „über den Inhalt hinaus" (Redeanteile, Pausen, Sprechtempo) ist erst
sinnvoll, wenn das Transkript Zeitstempel hat — und heikel: sie beschreibt die
Klientin, nicht ihre Worte. Frühestens nach den obigen Punkten, dann getrennt
einwilligungspflichtig.

---

## 3 · Instagram-Anbindung

### Wie die Lage 2026 wirklich ist

- Die **Basic Display API ist seit dem 4.12.2024 abgeschaltet.** Zugriff auf
  beliebige Privatkonten gibt es nicht mehr.
- Es bleiben zwei Wege:
  - **Instagram API with Instagram Login** — ohne Facebook-Seite, liest Profil und
    Medien des angemeldeten Kontos
  - **Instagram Graph API (Facebook Login)** — Business- oder Creator-Konto,
    zusätzlich Veröffentlichen, Insights, Nachrichten
- **Die Aufrufe selbst kosten nichts.** Der Preis ist Entwicklungszeit und das
  Meta App Review für den Livebetrieb.
- Grenzen: 25 per API veröffentlichte Feed-Posts in 24 Stunden; bei Nachrichten
  200 automatisierte DMs pro Stunde.
- Zugangstoken müssen regelmäßig erneuert werden (rund 60 Tage).

### Phasen

**Phase 0 — läuft bereits, null Aufwand**
`coach_beitraege`: die Coachin (oder ihr n8n-Workflow) schreibt Inhalte direkt in die
App, der Link führt zum Original. Kein Meta-Konto, kein Review, nichts kann brechen.

**Phase 1 — Lesen (~1 Woche + Wartezeit auf das Review)**
Meta-App anlegen, Instagram Login, letzte Beiträge holen und in `coach_beitraege`
spiegeln. Nutzen: die Coachin pflegt nichts doppelt. Risiko: gering, denn fällt die
Verbindung aus, bleibt Phase 0 als Grundlage bestehen.

**Phase 2 — Veröffentlichen (~1–2 Wochen)**
Business- oder Creator-Konto plus Facebook-Seite. Claude schreibt aus einem
Journal-Impuls oder einer Wochenkarte einen Entwurf, die Coachin sieht ihn im Panel,
**gibt ihn frei**, erst dann geht er raus. Nie automatisch veröffentlichen — weder
rechtlich noch für die Marke ist das ein guter Tausch.

**Phase 3 — Nachrichten: nur mit Bremse**
Hier gilt, was in der `interessentinnen`-Migration schon steht: **werbliche
Kontaktaufnahme ohne vorherige ausdrückliche Einwilligung ist unzulässig (§ 7 UWG)** —
eine Instagram-DM ist da keine Ausnahme. Erlaubt ist: auf eingehende Nachrichten
antworten. Nicht erlaubt: Follower anschreiben, weil sie geliked haben. Wer diese
Phase baut, baut zuerst die Einwilligungsprüfung.

### Klientinnen-Seite

Braucht **keine** Instagram-API: Tageskarte und Streak werden lokal als Bild
gerendert und ans Teilen-Menü des Geräts übergeben. Ist gebaut und funktioniert.

---

## 4 · Reihenfolge

| # | Schritt | Aufwand | Kosten | Abhängig von |
|---|---|---|---|---|
| 1 | Twin-Bindung reparieren | ½ Tag | – | `klientinnen` (fertig) |
| 2 | Twin Stufe 2 (Wissen im Prompt) | 1–2 Tage | Claude-Tokens | Wissensarchiv (fertig) |
| 3 | Videoanalyse lokal | 2 Tage | – | whisper.cpp auf dem Mac |
| 4 | Instagram Phase 1 (Lesen) | 1 Woche + Review | – | Meta-App |
| 5 | Twin Stufe 4 (Korrekturschleife) | 2 Tage | – | Stufe 2 |
| 6 | Instagram Phase 2 (Posten) | 1–2 Wochen | – | Business-Konto, Review |
| 7 | Stimme freischalten | 1 Tag | TTS-Anbieter | Einwilligungstexte |

Alles bis Schritt 3 kommt ohne Meta, ohne Abo und ohne fremde Dienste aus.
