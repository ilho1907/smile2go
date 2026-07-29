# smile2go · BACKLOG — bewusst verschoben

Alles hier ist geprüft und **absichtlich nicht gebaut**. Grundlage: Katman-Bewertung der
Feature-Liste (Marktforschung, KI-Positionierung, Produkt-/Preismodell, Produkt-Loop).
Nichts aus dieser Liste wird "nebenbei" umgesetzt — jede Zeile braucht eine eigene Entscheidung.

## Katman 2 — wertvoll, aber externe API-Freigabe nötig

| Baustein | Was fehlt | Frühester sinnvoller Zeitpunkt |
|---|---|---|
| **AI Sales Copilot** (Instagram-DM/WhatsApp-Analyse, Lead-Ranking, Antwortentwürfe) | Meta Graph API + WhatsApp Business API inkl. App-Review durch Meta | Nach öffentlichem Launch; E-Mail-/Formular-Variante wäre vorher möglich |
| **AI Funnel Optimizer** | TikTok/Meta Analytics-API; zusätzlich hohes Fehlerrisiko bei Kausalaussagen ("warum kommen keine Anfragen") | Erst eigene Funnel-Zähler (Landing Page + App), Deutung später |
| **Trend Radar** (DE-TikTok/IG/YouTube/Google-Themen) | Keine offizielle API für deutsche Trenddaten; Social-Listening-SaaS wäre kostenpflichtig | Start als manuelle Wochenliste + KI-Ideengenerierung — das wäre Katman-1-Aufwand |
| **AI Reputation Manager** | Kein API-Zugang zu TikTok/IG-Kommentaren; Scraping wäre ToS-Verstoß und fragil | Niedrige Priorität |
| **Echtes Auto-Posting** | Meta Graph API / TikTok Content Posting API + Review | Phase 2 laut Fahrplan |

## Katman 3 — rechtlich/ethisch riskant: nur beschnitten oder gar nicht

| Baustein | Warum verschoben | Sichere Teilvariante |
|---|---|---|
| **Emotion Timeline** (Ableitung aus Text/Stimme) | Nähe zu Emotionserkennung (AI Act) und Heilkunde (HeilprG); widerspricht dem Befund, dass 79 % der KI keine Empathie zutrauen | ✅ **gebaut**: Verlauf ausschließlich aus **selbst eingegebenen** Check-ins |
| **Blind Spot Detector** | Deutet Vermeidung/Selbstsabotage → diagnosenah, hohes Halluzinationsrisiko | Reine Häufigkeit wiederkehrender Themen, ohne Deutung |
| **Conversation Heatmap** (Emotionsverlauf je Minute) | Wie oben, zusätzlich sensible Einwilligungslage bei Aufzeichnungen | — |
| **Goal Prediction** | Geringe Trefferquote; Fehlalarme kosten das Vertrauen der Coachin | Bestehende Signale (still/aktiv) leisten dasselbe fehlerfrei |
| **Energy Calendar** | Zu dünne Datenbasis; Verwechslungsgefahr mit Astrologie-Features | Später, wenn genug Verlaufsdaten vorliegen |
| **Dynamic Program Builder** | Automatisch erzeugtes Programm **mit Lernerfolgskontrolle** fällt unter FernUSG (BGH 2025/26) — Verträge sonst nichtig | Nur nach anwaltlicher Prüfung der Vertragsstruktur |

## Katman 4 — der eigentliche Daten-Hendek, braucht Skalierung

| Baustein | Voraussetzung | Vorbereitung heute |
|---|---|---|
| **AI Opportunity Finder** ("500 Frauen ringen mit Selbstwert → Webinar anbieten") | Hunderte Coachinnen, tausende Nutzerinnen | ✅ `app_events` schreibt bereits anonymisiert mit |
| **Intervention Library** (was hat bei ähnlichen Profilen gewirkt) | Statistisch belastbare Fallzahlen; Darstellung nur als Entscheidungshilfe, nie als Empfehlung | ✅ Event-Schema angelegt; Auswertung ausdrücklich später |

## Aus der Umsetzung heraus entstandene offene Punkte

1. **Embedding-Anbieter für das Wissensarchiv.** Claude liefert keine Embeddings. Die Suche läuft
   aktuell über deutsche Postgres-Volltextsuche (`suche_inhalte_text`) — funktioniert ab Tag 1,
   ist aber wortbasiert. Für echte semantische Suche braucht es einen Embedding-Anbieter
   (OpenAI / Voyage / Mistral, EU-Hosting prüfen). Tabelle und Vektor-Suchfunktion sind bereits
   angelegt — der Wechsel erfordert keine Datenmigration, nur das Nachfüllen der `embedding`-Spalte.
2. **Zustellkanal für Journeys.** Der n8n-Workflow schreibt den Reisefortschritt fort, versendet
   aber noch nichts. Es fehlt die Entscheidung: Web-Push (PWA), E-Mail oder In-App-Postfach.
3. **Mehrklientinnen-Betrieb.** Coach-Dashboard und Heute-Liste arbeiten im Prototyp auf der
   Einzelnutzerin. Für echte Klientinnen-Verknüpfung fehlen: Einladungscodes, `klientin_coach`-
   Zuordnungstabelle, Digest über alle verknüpften Klientinnen.
4. **Rhythmusschicht** (aus dem Produkt-Loop): Web-Push, Streak-Anzeige, Karte↔Journal-Verweis,
   Impuls-Ausspielung. Das ist der nächste Bauabschnitt nach Katman 1 — wichtiger als jedes
   weitere KI-Feature.
5. **FernUSG-Prüfung** aller Angebotsformate vor der ersten Zahlungsintegration (anwaltlich).
