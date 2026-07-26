# ilho — KI-Begleiter der smile2go-App
### Konzept: Rollen · Personalisierung · Guardrails · Technik · Kostenmodell

> ilho ist der persönliche In-App-Begleiter jeder Nutzerin — **kein generischer Chatbot**, sondern an die Daten und die Coachin der Nutzerin gebunden. ilho ergänzt die menschliche Coachin, ersetzt sie nie.

---

## 1 · Die vier Rollen von ilho

1. **Rehber / Navigator** — „Wie funktioniert die App? Was ist heute dran?" → führt durch Features, schlägt den nächsten Schritt vor.
2. **Begleiter** — täglicher Check-in, Journaling-Impulse, kurze Motivation, Reflexionsfragen.
3. **Empfehlungs-Engine** — „Heute passt [Meditation deiner Coachin] zu dir." → Content-/Kurs-Vorschläge aus dem Pool der eigenen Coachin.
4. **Brücke zur Coachin** — bei tiefen/ernsten Themen: „Das besprichst du am besten mit [Coachin]." → leitet zum Menschen weiter (Erstgespräch / Nachricht).

---

## 2 · Personalisierung (der entscheidende Unterschied)

ilho kennt den Kontext der Nutzerin und antwortet **datenbasiert**, nicht generisch:

| Signal | Quelle | Wirkung |
|---|---|---|
| eigene Coachin | `profiles.referred_by` | Ton & Empfehlungen im Stil/Nische der Coachin |
| Nische | `nische_praeferenz` | thematischer Fokus (Spiritualität / Karriere / Gesundheit) |
| Stimmung | `mood_checkins` | passt Ansprache & Vorschlag an Tagesform an |
| Ziele/Fortschritt | Ziele + Coaching-Intelligenz | erinnert, bestärkt, ordnet ein |

Wichtig: ilho **imitiert die Coachin nicht** — bleibt erkennbar der Plattform-Begleiter, nimmt aber deren Nische/Ton als Färbung.

---

## 3 · Guardrails (rechtlich + Marke — verbindlich)

- **Keine medizinische / therapeutische Beratung**, kein Heilversprechen (HeilprG). ilho ist kein Therapieersatz.
- **Keine Anlageberatung** (§34f GewO) — im Finanz-Kontext nur Bildung/Reflexion.
- **Krisensignale** (Selbstgefährdung, akute Not): ilho gibt **keine** Bewältigungstechniken, sondern verweist einfühlsam auf professionelle Hilfe / die Coachin.
- **EU-AI-Act-Transparenz:** Nutzerin weiß jederzeit, dass ilho eine KI ist.
- **DSGVO:** Zugriff auf persönliche Inhalte (Journal, Mood, Gesundheitsdaten) nur mit **ausdrücklicher Einwilligung** (Art. 9). Verarbeitung EU-seitig.
- **Marke:** wissenschaftlich fundierte Achtsamkeit, **keine** Manifestations-/Heilsversprechen.

**Digitalbonus-Einordnung:** ilho allein ist noch nicht „der Innovationsgehalt". Der Kern ist die **Coaching-Intelligenz** (regelbasierte, erklärbare Analyse). ilho ist deren **Konversations-Schicht**. Beide müssen zusammen präsentiert werden, um das „kein reiner Chatbot"-Argument zu tragen.

---

## 4 · Technische Architektur (Basis vorhanden)

```
App (Nutzerin)
   │  askLuma(messages, system)
   ▼
Supabase Edge Function  ── ANTHROPIC_API_KEY (nur serverseitig)
   ▼
Claude API  ──►  Antwort zurück in die App
```

- API-Schlüssel **niemals im Browser** — nur in der Edge Function.
- System-Prompt injiziert den Nutzerinnen-Kontext (Coachin, Nische, Stimmung) — mit Einwilligung.
- Antworten optional protokolliert (für Verbesserung), DSGVO-konform, löschbar.

---

## 5 · Kostenmodell & Skalierung

Jede Nachricht an Claude verursacht API-Kosten → bei tausenden Nutzerinnen relevant.

- **Free-Tier:** Nachrichten-Limit pro Tag/Woche.
- **Modellwahl:** günstiges Modell für einfache Navigation/FAQ; stärkeres Modell nur für tiefere Reflexion.
- **Caching:** häufige Antworten (App-Hilfe, Standard-Impulse) vorhalten statt neu generieren.
- **Premium:** unbegrenztes/erweitertes ilho als Abo-Bestandteil.
- **Kurze Kontexte:** nur nötige Nutzerdaten in den Prompt (Kosten + Datenschutz).

---

## 6 · Interaktionsbeispiele

- **Navigation:** „Wo finde ich meine Meditationen?" → ilho zeigt Mediathek + startet „Ritual des Tages".
- **Begleitung:** Mood = niedrig → „Klingt nach einem vollen Tag. Magst du 3 Minuten Atemübung von [Coachin]?"
- **Empfehlung:** „Ich will besser schlafen." → schlägt §20-Kurs „Besser schlafen" der Coachin vor (mit Krankenkassen-Hinweis).
- **Brücke:** „Mir geht's seit Wochen schlecht." → „Das sollte jemand mit dir persönlich anschauen — [Coachin] bietet ein kostenloses Erstgespräch an. Soll ich es öffnen?"

---

## 7 · Rollout (an MVP-Phasen gekoppelt)

- **Phase 1:** ilho als Navigator + einfacher Begleiter (Edge Function steht), Nachrichten-Limit, Transparenz-Hinweis.
- **Phase 2:** Personalisierung (Coachin/Nische/Mood im Kontext, mit Einwilligung), Empfehlungs-Engine, Brücke zum Erstgespräch.
- **Phase 3:** enge Kopplung an Coaching-Intelligenz (proaktive, erklärbare Hinweise), Premium-Stufen.

*Stand: Juli 2026 · Technik: Supabase Edge Functions + Claude · Guardrails: DSGVO · EU AI Act · HeilprG · §34f GewO.*
