# Twin bauen · Stimme, Reaktionen, Kanäle

Wie aus dem Dossier ein Gegenüber wird, das schreibt wie sie, klingt wie sie —
und irgendwann auch über WhatsApp erreichbar ist. Stand 27.08.2026.

---

## Der Twin besteht aus drei Schichten

| Schicht | Was sie leistet | Zustand |
|---|---|---|
| **1 · Haltung** | *was* gesagt wird und *wie* | Dossier + Tonalitäts-Layer stehen, Wissen fehlt noch |
| **2 · Stimme** | *wie* es klingt | `stimm_profile` + `/tts` vorbereitet, Anbieter fehlt |
| **3 · Kanal** | *wo* sie erreichbar ist | in der App gebaut, WhatsApp und Telefon offen |

Die Reihenfolge ist keine Geschmackssache: eine geklonte Stimme, die inhaltlich
danebenliegt, ist schlimmer als gar keine Stimme. Erst Schicht 1 fertig, dann 2.

---

## Schicht 1 · Haltung — dass es *klingt wie sie*, bevor es *klingt wie sie*

Heute prägt das Dossier nur die Tonalität. Drei Ergänzungen machen den Unterschied:

**a) Echte Antwortbeispiele (few-shot).**
Das Interview fragt nach Prinzipien — Modelle lernen aber schneller aus Beispielen.
Die Coachin schreibt 20–30 typische Situationen samt ihrer echten Antwort auf
(„Klientin sagt X" → „ich antworte Y"). Diese Paare gehen mit in den Prompt.
Das bringt mehr Ähnlichkeit als jede Feinjustierung am Systemtext.

**b) Reaktionen, nicht nur Sätze.**
Was eine Person erkennbar macht, sind die kleinen Dinge: womit sie beginnt, wie sie
zustimmt („Mmh", „Das kenne ich"), wann sie schweigt statt zu raten, wie lange ihre
Sätze sind, ob sie Emojis benutzt und welche. Als Felder im Dossier:
`reaktionen[]`, `satzlaenge`, `emoji_stil`, `pausenverhalten`.

**c) Wissen statt Allgemeinplätze.**
Bei jeder Frage die drei besten Treffer aus `content_embeddings` in den Prompt geben,
mit der Regel: *nur daraus antworten, sonst an die Coachin verweisen*. Damit sagt der
Twin ihre Sätze, nicht die des Internets.

**Prüfung:** Die Coachin bekommt fünf Antworten ihres Twins zu blinden Fragen und
sagt bei jeder „so würde ich" / „so nicht". Unter 4 von 5 ist er nicht bereit für
Klientinnen.

---

## Schicht 2 · Stimme

### Aufnahme (die Qualität hier entscheidet alles)

- 15–30 Minuten sauberes Material, ein Mikrofon, ein Raum, kein Hall
- verschiedene Register: ruhig erklärend, warm zugewandt, klar abgrenzend
- vorgelesene Texte **und** freies Sprechen — sonst klingt der Klon wie ein Hörbuch
- keine Hintergrundmusik, kein Schnitt mit Effekten

### Klonen — zwei Wege

| Weg | Kosten | Latenz | Wofür |
|---|---|---|---|
| **Lokal** (XTTS-v2, F5-TTS, Chatterbox auf dem Mac) | 0 € | Sekunden | App-Texte vorlesen, Testen, Demo |
| **Anbieter** (ElevenLabs, Cartesia, PlayHT) | ca. 5–25 €/Monat | unter 1 s | echte Gespräche, Sprachnachrichten in Serie |

Im Code vorbereitet: `stimm_profile` (Anbieter + `voice_id`), Edge Function `/tts`,
der `Hoerknopf` in der App und `STIMME_EINWILLIGUNG_TEXT`. Es fehlt nur die
Anbieter-Entscheidung — lokal beginnen kostet nichts.

### Eingehende Sprache

Sprachnachrichten der Klientin werden lokal mit `whisper.cpp` transkribiert (0 €),
dann normal beantwortet. Damit ist der Kreis geschlossen: sie spricht, er antwortet
mit Stimme.

---

## Schicht 3 · Kanäle

### A · In der App — heute, kostenlos
Text plus Vorlese-Knopf. Sprachnachricht rein (Mikrofon ist gebaut), Antwort als
Text oder Audio zurück. Kein fremder Dienst, keine Nummer, keine Freigabe nötig.
**Hier gehört der erste echte Twin hin.**

### B · WhatsApp — der erste Schritt nach außen
Über die **WhatsApp Cloud API**: eigenes Meta-Business-Konto, verifiziertes
Unternehmen, eine Nummer, die nicht schon in der normalen WhatsApp-App läuft.

Der Trick für das Telefongefühl: **keine Anrufe, sondern Sprachnachrichten.**
Eingehende Sprachnachricht → Transkript → Antwort → als Audio zurück. Fühlt sich an
wie ein Gespräch, kostet aber nur Nachrichten und braucht keine Calling-Freigabe.

Kosten und Regeln, die man vorher wissen muss:
- Die API selbst ist kostenlos, bezahlt wird **pro Nachricht**
- Utility-Nachrichten sind 2026 um rund 45 % billiger geworden (ca. 0,014 $)
- **Ab 1. Oktober 2026 werden auch Service-Nachriten im 24-Stunden-Fenster
  berechnet** — bisher waren sie frei. Das ist die Änderung, die ein Twin-Chat spürt
- Meta beobachtet Antwortquoten; unter 30 % Reaktion auf Rundnachrichten drohen
  Einschränkungen
- § 7 UWG bleibt: Klientin schreibt zuerst, sonst keine werbliche Ansprache

### C · Echter Anruf — zuletzt, und nur wenn es sich lohnt

**WhatsApp Business Calling API:** eingehende Anrufe der Nutzerin kostenlos,
ausgehende nach Dauer (grob 0,05–0,10 $/Min). Aber: Freischaltung pro Land, und die
Nummer muss „in gutem Zustand" sein — genannt werden Größenordnungen von 2.000
geschäftsinitiierten Konversationen in 24 Stunden. Für eine einzelne Coachin ist
diese Hürde derzeit nicht realistisch.

**Eigene Telefonnummer + Echtzeit-Sprachagent** (Twilio plus einem Realtime-Dienst):
funktioniert überall, kostet pro Minute, Einrichtung an einem Tag. Der ehrlichere
Weg, wenn wirklich telefoniert werden soll.

---

## Reihenfolge

| # | Schritt | Kosten | Ergebnis |
|---|---|---|---|
| 1 | Twin-Bindung reparieren (`coach_id` statt eigenes Dossier) | – | Twin wirkt überhaupt |
| 2 | Antwortbeispiele + Reaktionsfelder ins Dossier | – | klingt nach ihr |
| 3 | Wissen aus dem Archiv in den Prompt | Claude-Tokens | sagt ihre Inhalte |
| 4 | Lokales TTS, Vorlesen in der App | – | erste eigene Stimme |
| 5 | Freigabe-Test durch die Coachin (4 von 5) | – | Reifegrad belegt |
| 6 | WhatsApp: Text + Sprachnachrichten | pro Nachricht | erreichbar ohne App |
| 7 | Anbieter-Stimme (niedrige Latenz) | 5–25 €/Monat | Gespräch in Echtzeit |
| 8 | Telefonie | pro Minute | nur wenn Schritt 6 getragen hat |

Schritte 1–5 kosten nichts außer Arbeit.

---

## Was nicht verhandelbar ist

- **Der Twin gibt sich nie als die Coachin aus.** Er sagt zu Beginn jedes Gesprächs,
  dass er eine KI in ihrem Auftrag ist — auch am Telefon, auch in einer
  Sprachnachricht. Das ist nicht nur Anstand: der AI Act verlangt Transparenz bei
  KI-Interaktion und die Kennzeichnung synthetischer Stimmen.
- **Die Stimme gehört ihr.** Klonen nur mit eigener, schriftlicher, jederzeit
  widerrufbarer Einwilligung. Widerruf löscht das Stimmprofil — die Funktion dafür
  ist bereits gebaut.
- **Die Klientin darf jederzeit zu einem Menschen.** Ein Satz genügt, und der Twin
  gibt weiter, statt weiterzureden.
- **Krisen gehen sofort an Menschen.** Steht schon im Systemprompt und bleibt so.
- **Kein Twin ohne Wissen der Klientin.** Sie erfährt vorher, dass sie mit einer KI
  schreibt — nicht im Kleingedruckten, sondern im Chat selbst.
