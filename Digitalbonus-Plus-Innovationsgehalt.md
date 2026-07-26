# Digitalbonus Bayern PLUS — Innovationsgehalt & technisches Konzept
### Vorhaben: smile2go „Coaching-Intelligenz" (ilhoVA)

> Modul zum Nachschärfen des bestehenden Antrags (`ilhoVA-Digitalbonus-Plus-Antrag.docx`).
> Ziel: den **besonderen Innovationsgehalt** so darlegen, dass er über eine Standard-KI-/Chatlösung klar hinausgeht.
> Platzhalter [ … ] = von dir zu ergänzende Angaben (nicht erfunden).

---

## 1. Ausgangslage & Problem
Der Coaching-Markt in der DACH-Region ist weitgehend undigitalisiert: Coaches arbeiten mit Word, Excel und E-Mail, ohne systematische Datenerfassung. Zwischen den wöchentlichen Sessions gibt es keine professionelle Begleitung, keine Fortschrittsmessung und **keine Früherkennung von Abbruch- oder Krisensignalen**. Das führt zu Klientinnen-Abbrüchen und ineffizienter Betreuung.

## 2. Innovationsgehalt (der Kern des PLUS-Antrags)

**Abgrenzung — was hier NICHT beantragt wird:** Es geht ausdrücklich **nicht** um die bloße Einbindung eines Standard-Chatbots (z. B. ChatGPT-/Claude-Zugang). Ein reiner Chat hat nach den Förderkriterien **keinen** Innovationsgehalt.

**Was den Innovationsgehalt begründet:** eine **branchenspezifische, intelligente Datenanalyse-Engine für den Coaching-Sektor** („Coaching-Intelligenz"), die aus täglichen, multimodalen Nutzungssignalen automatisiert Kennzahlen, Frühwarnungen und Handlungsempfehlungen erzeugt. Das entspricht dem Förderkriterium *„Künstliche Intelligenz / intelligente Datenanalyse zur Verbesserung der betrieblichen Ergebnisse"* und ist branchenspezifisch (Coaching), nicht mit einer Standardlösung abbildbar.

**Die fünf Innovationsmodule:**

1. **Multimodaler Wohlbefindens-/Fortschritts-Index.** Tägliche Signale (Stimmung, Energie-Check 1–5, Sentiment aus Journal-Texten, Gewohnheiten/Streak, Aufgaben- und Kursfortschritt) werden zu einem **personalisierten, erklärbaren Index** aggregiert — ein für den Coaching-Sektor neuartiges, kontinuierliches Fortschrittsmaß statt punktueller Selbstauskunft.

2. **Krisen-/Abbruch-Früherkennung.** Musteranalyse über Zeitreihen (z. B. abfallende Energie-Serie, ausbleibende Logins, sich stauende Aufgaben) erzeugt automatisierte **Frühwarn-Flags** und benachrichtigt die Coachin — Prävention statt Reaktion.

3. **Automatisiertes Coach-Briefing.** Vor jeder Session generiert das System eine **verdichtete, empathische Zusammenfassung** je Klientin (Was hat sich verändert? Worauf achten?) — automatisierte Vorsitzungsvorbereitung, die es in dieser Form am Markt nicht gibt.

4. **Adaptive Empfehlungen.** Auf Basis von Index und Verlauf schlägt das System der Klientin die **nächste passende Übung/Inhalt** vor (z. B. Atemübung, Ritual, Kurslektion) — kontextsensitiv statt statischer Content-Liste.

5. **Human-in-the-Loop.** Die Coachin bleibt Entscheiderin; die KI liefert Analyse & Vorschläge, keine autonome Beratung.

**Warum das über Standardlösungen hinausgeht:** kein etabliertes Coaching-Tool (CoachAccountable, Simply.Coach, CleverMemo u. a.) verbindet ein **täglich genutztes Klientinnen-Frontend** mit einer **branchenspezifischen KI-Analyse + automatischem Coach-Reporting + Krisenfrüherkennung** — deutschsprachig und DSGVO/EU-nativ.

## 3. Technisches Konzept & Architektur

- **Frontend:** React-PWA (mobile-first), Hosting in der EU.
- **Backend:** Supabase (Region EU/Frankfurt) — PostgreSQL mit Row Level Security, Auth, Storage, Edge Functions.
- **KI-Anbindung:** Analyse- und Sprachfunktionen laufen über **serverseitige Edge Functions** (API-Schlüssel niemals im Client). Nur **Textanalyse**, keine biometrischen Daten.
- **Analyse-Pipeline:** tägliche Signale → Aggregation (Postgres-Views/Functions) → Index & Frühwarnung → Coach-Report (zeitgesteuert via Automations-Workflow).
- **Datenquellen (Auszug):** Energie-Checks, Journal-Einträge (Sentiment), Gewohnheiten/Streak, Aufgaben-/Kursfortschritt, Session-Verlauf.

## 4. EU-AI-Act- & DSGVO-Konformität
- **Nur Textanalyse**, transparente Verarbeitung, Coachin als Human-in-the-Loop → geringes Risikoprofil im Sinne des EU AI Act.
- **DSGVO:** EU-Hosting, RLS (jede Nutzerin nur eigene Daten; Coachin nur zustimmende eigene Klientinnen), **granulare Einwilligung** für Gesundheits-/Stimmungsdaten (Art. 9), Auskunft/Export/Löschung (Art. 15–20), AVV nach Art. 28 mit allen Dienstleistern.

## 5. IT-Sicherheit (zusätzlich förderfähig — ISO 27001:2022-Richtung)
- EU-Hosting, verschlüsselte Übertragung & Speicherung, **API-Schlüssel serverseitig** (Edge Functions).
- Zugriffskontrolle über RLS & Rollen, regelmäßige Backups, Datensicherungs- und Netzwerksicherheitskonzept.
- Einführung/Verbesserung von IT-Sicherheitsprozessen (Richtlinien, Rollen-/Rechtekonzept, Löschkonzept) — Orientierung an ISO 27001:2022.

## 6. Förderfähige Maßnahmen (Kostenarten)
> Beträge bewusst offen gelassen — bitte mit realen Zahlen/Angeboten füllen.

- Externe **Softwareentwicklung** der Coaching-Intelligenz-Engine (Analyse-Pipeline, Frühwarnung, Coach-Briefing, adaptive Empfehlungen): [ … €]
- Externe **Beratung/Umsetzung IT-Sicherheit** (ISO-27001-Richtung, Sicherheitskonzept): [ … €]
- Ggf. förderfähige **IKT-Komponenten** (Datensicherung/Netzwerksicherheit): [ … €]
- **Gesamtausgaben (netto):** [ … €] · **Fördersatz bis 50 %** · **Digitalbonus PLUS bis 30.000 €**

## 7. Offene Punkte (von dir zu bestätigen — nicht erfunden)
1. **Antragsteller:** Unternehmensname, Rechtsform, Anschrift (Betriebsstätte in Bayern?).
2. **KMU-Status:** < 50 Beschäftigte und ≤ 10 Mio. € Jahresumsatz/-bilanz? Angemeldetes Gewerbe?
3. **Umsetzer:** wird extern entwickelt (Agentur/Freelancer) — Digitalbonus fördert v. a. **externe** Leistungen, keine eigenen Personalkosten.
4. **Budget-Größenordnung** des Projekts (bestimmt Förderhöhe / Standard vs. PLUS).
5. **Projektstart:** Vorhaben darf **noch nicht begonnen** sein.

> Hinweis: Dies ist keine Förderberatung. Vor Einreichung mit der Digitalbonus-Servicestelle / einem Förderberater final prüfen.
