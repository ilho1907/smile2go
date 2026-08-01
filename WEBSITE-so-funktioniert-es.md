# Website-Abschnitt „So funktioniert es" — fertiger Text zum Einsetzen
## Für die Coachinnen-Seite (Webflow) · Stand: 1. August 2026

**Wo das hingehört:** Nach „Coaching-Paket mit Expertinnen" / „Das ILHO-System" und **vor** „Unser Versprechen". Die Seite hat genau eine Aufgabe: das kostenlose Erstgespräch. Alles davor erklärt nur, warum dieses Gespräch sich lohnt.

---

## Teil 1 — Der Hauptbereich: fünf Schritte

**Überschrift:** So funktioniert es

**Untertitel:** Von deinem ersten Gespräch bis zu deinen ersten Klientinnen — in fünf Schritten. Du musst nichts können außer coachen.

### Schritt 1 · Kostenloses Erstgespräch
Wir sprechen 45 Minuten. Du erzählst, wen du begleitest und wo du gerade stehst. Wir erzählen ehrlich, ob smile2go zu dir passt — und wenn nicht, sagen wir das auch.

### Schritt 2 · Wir lernen deine Arbeit kennen
Du beantwortest Fragen zu deiner Methode, deiner Sprache und deinen Grenzen. Daraus entsteht dein Methoden-Dossier — ein Dokument, das viele Coachinnen zum ersten Mal schwarz auf weiß vor sich sehen. Es gehört dir, auch wenn du wieder gehst.

### Schritt 3 · Dein Auftritt entsteht
Ein Drehtag: Interview-Video, Fotoshooting, fertige Kurzclips. Dazu deine Landingpage mit deinem Briefkopf. Danach hast du Material für Wochen — und musst nie wieder vor der leeren Kamera stehen.

### Schritt 4 · Deine App geht an den Start
Deine Klientinnen bekommen einen eigenen Bereich: Tageskarte, Rituale, Tagebuch — und ilho, der zwischen euren Sessions da ist und in deinem Ton spricht. Du lädst sie mit einem Link ein, mehr braucht es nicht.

### Schritt 5 · Du coachst, wir halten den Rest
Du siehst montags auf einen Blick, wie es deinen Klientinnen geht. Content, Erinnerungen und Verwaltung laufen im Hintergrund. Deine Zeit gehört wieder dem, wofür du Coachin geworden bist.

---

## Teil 2 — Was daneben steht

Rechts neben den Schritten gehört **eine mitscrollende Karte** (sticky). Sie macht zwei Dinge gleichzeitig: einladen **und** vorfiltern. Das Vorfiltern ist kein Verlust — es ist Teil des Modells. Du willst nicht jede Anfrage, du willst die passenden.

### Die Karte (sticky, scrollt mit)

> **Lass uns sprechen**
>
> 45 Minuten, kostenlos, ohne Verpflichtung.
>
> **[ Kostenloses Erstgespräch ]**
>
> ✓ Kein Verkaufsgespräch
> ✓ Keine Vorbereitung nötig
> ✓ Du entscheidest danach in Ruhe

**Darunter, kleiner:**

> **Passt smile2go zu dir?**
>
> **Ja, wenn du …**
> · Frauen begleitest und deine Arbeit ernst nimmst
> · eine Ausbildung oder echte Praxiserfahrung hast
> · sichtbar werden willst, aber nicht weißt wie
> · Klientinnen verlierst, weil dein 1:1 zu teuer für sie ist
>
> **Eher nicht, wenn du …**
> · schnelle Umsätze ohne eigene Arbeit erwartest
> · nur eine Website suchst — dafür gibt es günstigere Wege
> · nicht bereit bist, dein Gesicht zu zeigen

**Warum diese „Eher nicht"-Liste hineingehört:** Sie kostet dich ein paar Anfragen und spart dir viele falsche Gespräche. In einem Markt, in dem Verbraucherzentralen vor Coaching-Anbietern warnen, ist die Bereitschaft, jemanden wegzuschicken, das stärkste Vertrauenssignal, das du senden kannst. Anbieter, die alle nehmen, wirken wie alle anderen.

### Gestaltung (Webflow)

- Zwei Spalten: links Schritte (ca. 60 %), rechts Karte (ca. 40 %), Abstand 48 px
- Rechte Spalte: `position: sticky`, `top: 100px` — bleibt beim Scrollen stehen
- Schritte als vertikale Zeitleiste: nummerierter Kreis (40 px, Hintergrund `#DE8A6E`, weiße Zahl) plus dünne Verbindungslinie `#EADAD5`
- Karte: `border-radius: 20px`, `border: 1px solid #EADAD5`, `padding: 28px`, leicht abgesetzter Hintergrund
- Mobil: Karte rutscht unter die Schritte, `position: static` — sticky auf dem Handy nervt

---

## Teil 3 — Der Button unter den Coachinnen-Karten

Du wolltest unter den Coachinnen-Karten einen Button für das kostenlose Gespräch. Zwei verschiedene Dinge, nicht verwechseln:

- Auf der **Coachinnen-Werbeseite** (diese Seite): „Kostenloses Erstgespräch" → führt zum Bewerbungsformular für Coachinnen
- Auf der **Klientinnen-Seite** unter den Coachinnen-Profilen: „Kennenlerngespräch anfragen" → führt zur jeweiligen Coachin

Gleicher Wortlaut an beiden Stellen verwirrt beide Zielgruppen. Deshalb unterschiedliche Beschriftung.

---

## Teil 4 — Ein Hinweis zum Text „Unser Versprechen"

Der aktuelle Satz lautet sinngemäß: *„Du startest direkt, findest deine ersten Kundinnen und berührst Herzen."*

Das ist ein **Erfolgsversprechen** — und genau die Formulierung, vor der die Verbraucherzentralen bei Coaching-Anbietern warnen. Es macht dich angreifbar und klingt wie die Anbieter, von denen du dich abgrenzen willst.

**Vorschlag, gleiche Wärme, ohne Versprechen:**

> **Unser Versprechen**
>
> Wir machen dich sichtbar und geben dir das Werkzeug. Was daraus wächst, entsteht durch deine Arbeit — wir versprechen dir keine Kundinnen, sondern einen professionellen Start und jemanden an deiner Seite. Herz zu Herz.
