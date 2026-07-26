# Digitalbonus PLUS — Verstärkung des Antrags
### Abgleich mit (A) Coaching-App-Standards 2026 und (B) Föderaler Digitalstrategie des IT-Planungsrats
### Vorhaben: smile2go „Coaching-Intelligenz" · Antragsteller: Ilham Savran, München

> Ergänzungsmodul zu `Digitalbonus-Plus-Innovationsgehalt.md`.
> ⚠ Keine Förderberatung. Vor Einreichung mit der Digitalbonus-Servicestelle prüfen.

---

## 0 · Kısa Türkçe özet (ilho için)

**Önemli gerçek:** Föderale Digitalstrategie **kamu idaresi** (Verwaltung) için bir strateji — özel bir coaching app'i için doğrudan bir teşvik programı **değil** ve Digitalbonus jürisi seni buna göre puanlamaz. Ama iki şekilde işine yarar:

1. **Antrag'da "Stand der Technik" argümanı olarak:** Zero Trust, Once-Only, Datensparsamkeit, Security-by-Design, EU AI Act, digitale Souveränität — bunlar devletin kendi belgesinde yazan ilkeler. smile2go bunlara uyduğunu gösterirse jüri için "ciddi, standartlara uygun mimari" sinyali olur.
2. **İleride B2G kapısı:** Kommunen / Krankenkassen / Präventionskurse (§20 SGB V) yönünde büyümek istersen, bu ilkelere baştan uymak seni ihale/nachnutzung açısından uygun hale getirir. Antrag'da "Skalierungsperspektive" olarak yazılabilir.

**Asıl puan getiren şey** yine Bölüm A: 2026 coaching-app standartlarındaki boşlukları kapatan **dışarıya verilecek** geliştirme kalemleri. Aşağıda hangi eksik → hangi förderfähig kalem, tablo halinde.

---

# A · Coaching-App-Standards 2026 → Gap-Analyse smile2go

Bewertung des bestehenden Prototyps (React-PWA, Supabase-Schema, Coaching-Intelligenz-Ansatz).

| Standard 2026 | Status smile2go | Lücke → förderfähige externe Leistung |
|---|---|---|
| **Onboarding & Profil** (2–3 Min., Ziele, Ausgangslage) | Fragebogen/Intake vorhanden | Standardisierte Erstanamnese + Wiedervorlage-Logik → **AP1** |
| **Validierte Messinstrumente** (WHO-5, SWLS, PERMA) | fehlt — nur Selbstauskunft | Implementierung validierter Kurzskalen mit Verlaufsmessung → **AP2** *(zentral für Innovationsgehalt)* |
| **Tägliche Check-ins** (Stimmung, Energie, Schlaf, Stress) | Energie-Check + Journal vorhanden | Erweiterung + Zeitreihen-Speicherung, saubere Datenmodellierung → **AP2** |
| **Wearable-Integration** (Apple Health, Google Fit) | fehlt | *Bewusst zurückgestellt* — Gesundheitsdaten Art. 9 DSGVO, hoher Aufwand. Siehe Abschnitt C. |
| **Personalisierte Programme / adaptive Schwierigkeit** | statische Kurse & Rituale | Regelbasierte + KI-gestützte Programmsteuerung → **AP3** |
| **„Heute die eine wichtige Handlung"** | Heute-Screen vorhanden | Empfehlungsmotor dahinter → **AP3** |
| **Fortschritts-Visualisierung + KI-Wochenbericht** | Fortschritt-Tab rudimentär | Kennzahlen-Engine, Charts, automatischer Wochen-/Monatsbericht → **AP2/AP4** |
| **Drop-off-/Risiko-Analyse** | konzipiert, nicht gebaut | Frühwarn-Engine (Zeitreihenmuster) → **AP4** *(Kern des PLUS-Antrags)* |
| **Coach-Dashboard: alle Klientinnen, Risiko-Flags, Segmente** | fehlt vollständig | Multi-Tenant-Coach-Dashboard → **AP5** |
| **Programm-Builder (Drag & Drop, Vorlagen)** | fehlt | Programm-/Content-Builder für die Coachin → **AP5** |
| **Automatisiertes Coach-Briefing vor der Session** | konzipiert | Report-Generator via Edge Function → **AP4** |
| **Messaging, Sprach-/Videonotiz** | Coach-Chat vorhanden (Prototyp) | Produktivfähige Umsetzung, Medien-Upload, Retention-Regeln → **AP6** |
| **Terminbuchung + Kalender + Erinnerungen** | Buchen-Tab vorhanden | Kalender-Anbindung, automatische Reminder → **AP6** |
| **Zahlungen / Pakete / Abo** | Pakete-Tab statisch | Zahlungsanbindung (Stripe o. ä.), Abo-Logik → **AP7** |
| **Business-Metriken (Churn, LTV, Auslastung)** | fehlt | Auswertung im Coach-Dashboard → **AP5** |
| **Barrierefreiheit (BFSG)** | teilweise | Barrierefreiheits-Audit + Umsetzung → **AP8** *(siehe Abschnitt C)* |
| **Mobile-first, Thumb-Zone, Dark Mode** | mobile-first ✓, Dark Mode fehlt | UI-Ausbau, geringe Priorität |
| **Mikro-Interaktionen, Streaks, Level** | Lichtpunkte/Streak vorhanden ✓ | erfüllt |

**Fazit:** Der Prototyp deckt die **Klientinnen-Oberfläche** bereits gut ab (Machbarkeitsnachweis). Es fehlen genau die Teile, die den Innovationsgehalt tragen: **validierte Messung, Analyse-Engine, Frühwarnung, Coach-Dashboard** — und das sind zugleich die Teile, die sich sauber **extern vergeben** lassen.

---

# B · Föderale Digitalstrategie → verwertbare Prinzipien für den Antrag

Die Strategie des IT-Planungsrats richtet sich an die öffentliche Verwaltung. Sie ist **kein Förderprogramm** für smile2go. Ihr Wert für den Antrag: Sie definiert, was der deutsche Staat 2026 als **Stand der Technik** und als **Anforderung an vertrauenswürdige digitale Systeme** ansieht. Wer diese Prinzipien freiwillig erfüllt, argumentiert auf staatlich gesetztem Niveau.

| Prinzip der Strategie | Fundstelle | Umsetzung in smile2go — so im Antrag formulierbar |
|---|---|---|
| **Zero Trust** („jede Instanz kann kompromittiert sein, minimale Rechte") | Ltl. 4.2.6 | Row Level Security in PostgreSQL: jede Klientin sieht nur eigene Daten, die Coachin nur einwilligende Klientinnen; API-Schlüssel ausschließlich serverseitig in Edge Functions. |
| **Datensparsamkeit / Datenminimierung** | Ltl. 4.2.3, 4.2.7 | Nur Daten, die für Index & Begleitung erforderlich sind; bewusster Verzicht auf biometrische und Wearable-Daten in Phase 1. |
| **Once-Only** (Daten nur einmal erheben) | Ltl. 4.2.3 | Erstanamnese wird einmal erhoben und in Programm, Index und Coach-Briefing wiederverwendet — keine Mehrfachabfrage. |
| **Security & Privacy by Design** | Ltl. 4.2.7 | Datenschutz, Löschkonzept und Rollenmodell von Beginn an Teil der Architektur, nicht nachgelagert. |
| **Menschenzentrierte KI, Human-in-the-Loop, Transparenz & Ethik** | Ltl. 4.2.5 | Die KI analysiert und schlägt vor; die Coachin entscheidet. Der Index ist **erklärbar** (welche Signale ihn bewegt haben ist sichtbar). |
| **Digitale Souveränität, Vermeidung von Vendor-Lock-in, Multi-Cloud** | Ltl. 4.2.8, 4.1.4 | EU-Hosting (Frankfurt); offene Standards, PostgreSQL als portabler Kern; Austauschbarkeit des KI-Anbieters durch gekapselte Edge-Function-Schnittstelle. |
| **Nutzendenzentrierung & Barrierefreiheit als Qualitätsstandard** | Ltl. 4.2.11 | Barrierefreiheits-Audit als eigenes Arbeitspaket (AP8), nicht als Nachgedanke. |
| **Verfügbarkeit, Integrität, Notfallpläne** | Ltl. 4.2.6 | Backup-/Wiederherstellungskonzept, definierte Wiederanlaufzeiten — Teil der IT-Sicherheits-Position. |
| **Wirkungsorientierte Umsetzung, MVP-Ansatz** | Ltl. 4.3.4 | Vorhaben ist in Arbeitspakete mit messbaren Wirkungskriterien geschnitten (siehe Abschnitt D). |
| **Evidenzbasierte Entscheidungen durch qualitativ hochwertige Daten** | Ltl. 4.2.4 | Validierte Skalen (WHO-5/SWLS) statt beliebiger Selbstauskunft — vergleichbare, auswertbare Daten. |

### Formulierungsvorschlag für den Antrag (direkt übernehmbar)

> Die Architektur des Vorhabens orientiert sich an den Prinzipien, die der IT-Planungsrat in der Föderalen Digitalstrategie für vertrauenswürdige digitale Systeme formuliert hat — insbesondere Zero-Trust-Zugriffskontrolle, Datensparsamkeit und Once-Only, Security- und Privacy-by-Design, digitale Souveränität durch EU-Hosting und austauschbare Komponenten sowie ein menschenzentrierter KI-Einsatz mit Human-in-the-Loop. Damit erfüllt das Vorhaben freiwillig ein Sicherheits- und Vertrauensniveau, das der Staat für seine eigenen digitalen Verfahren als Zielbild definiert hat.

### Sekundärer Nutzen: Anschlussfähigkeit B2G / Kostenträger

Präventionskurse nach **§ 20 SGB V** sind bereits im Projekt angelegt. Wenn die Plattform später Kommunen, Krankenkassen oder zertifizierte Präventionsanbieter bedienen soll, sind genau diese Prinzipien (EU-Hosting, RLS, Barrierefreiheit, Löschkonzept, AI-Act-Konformität) die Eintrittsvoraussetzung. Im Antrag als **Skalierungsperspektive** darstellbar — aber als Perspektive, nicht als Zusage.

---

# C · Zwei Punkte, bei denen Vorsicht geboten ist

**1 · Wearables / Gesundheitsdaten (Apple Health, Oura, Garmin)**
Der 2026-Standard nennt Wearable-Integration. Für smile2go bedeutet das jedoch die Verarbeitung von **Gesundheitsdaten nach Art. 9 DSGVO** — deutlich höhere Anforderungen an Einwilligung, Zweckbindung und Löschung, und ein größeres Prüfrisiko. Empfehlung: **in Phase 1 bewusst weglassen** und das im Antrag als überlegte Risikoentscheidung darstellen (passt zur Leitlinie Datensparsamkeit). Nachrüstbar bleibt es.

**2 · Barrierefreiheit (BFSG)**
Das Barrierefreiheitsstärkungsgesetz gilt seit dem 28.06.2025 für bestimmte digitale Verbraucherdienstleistungen. Es gibt eine **Ausnahme für Kleinstunternehmen** (unter 10 Beschäftigte und höchstens 2 Mio. € Jahresumsatz) bei Dienstleistungen — ob smile2go darunter fällt, hängt von der konkreten Ausgestaltung ab und ist **rechtlich zu prüfen**, nicht anzunehmen. Unabhängig davon ist Barrierefreiheit als Qualitätsmerkmal im Antrag ein Pluspunkt und als externe Leistung förderfähig.

**3 · Abgrenzung zur Heilkunde**
Coaching ist **keine Therapie**. Der Index darf keine Diagnose sein und keine diagnostische Aussage suggerieren. Ein dokumentiertes **Eskalations-/Weiterleitungskonzept** bei Krisensignalen (Hinweis auf professionelle Hilfe) gehört ins Konzept — schützt rechtlich und stärkt die Human-in-the-Loop-Argumentation gegenüber der Jury.

---

# D · Arbeitspakete mit Wirkungskriterien (für Antrag Abschnitt „Vorhaben")

> Struktur nach dem wirkungsorientierten Prinzip der Digitalstrategie (Ltl. 4.3.4): je Arbeitspaket ein messbares Ziel.

| AP | Inhalt (extern vergeben) | Messbares Wirkungsziel |
|---|---|---|
| **AP1** | Standardisierte Erstanamnese & Datenmodell | Onboarding in ≤ 3 Min. abschließbar |
| **AP2** | Validierte Skalen (WHO-5 u. a.) + Zeitreihen-Erfassung + Wohlbefindens-Index | Index für jede Klientin nach 14 Tagen Nutzung berechenbar & erklärbar |
| **AP3** | Adaptive Programm- und Empfehlungssteuerung | Tagesempfehlung individualisiert statt statisch |
| **AP4** | Frühwarn-Engine + automatisiertes Coach-Briefing | Risikosignal erreicht die Coachin ≤ 24 h nach Auftreten; Briefing vor jeder Session automatisch |
| **AP5** | Coach-Dashboard: Klientinnen-Übersicht, Risiko-Flags, Programm-Builder, Business-Kennzahlen | Vorbereitungszeit je Session messbar reduziert |
| **AP6** | Kommunikation, Terminbuchung, Erinnerungen (produktivfähig) | Terminvereinbarung ohne manuellen E-Mail-Weg |
| **AP7** | Zahlungs-/Abo-Anbindung | Paketbuchung vollständig digital |
| **AP8** | IT-Sicherheit (ISO-27001-Richtung), Löschkonzept, Barrierefreiheits-Audit | Sicherheitskonzept dokumentiert; Audit-Bericht liegt vor |

Diese Struktur lässt sich 1:1 in die **Angebote** der externen Dienstleister übertragen — was die Prüfung durch die Servicestelle erleichtert, weil Ausgaben und Wirkung eindeutig zugeordnet sind.

---

# E · Nächste Schritte

1. **Zahl korrigiert:** Digitalbonus PLUS max. **30.000 €** (nicht 50.000 €) — in `Digitalbonus-Ablauf-und-Checkliste.md` bereits berichtigt. Kostenplan Szenario B passt damit weiterhin (60.000 € netto → 30.000 € gedeckelt).
2. **AP2 und AP4 im Antrag nach vorne stellen** — validierte Messung + Frühwarnung sind der stärkste Innovationsbeleg gegenüber der Jury.
3. **Eskalationskonzept** (Punkt C3) schriftlich ergänzen — kleiner Aufwand, deutliche Wirkung.
4. **1–2 externe Angebote** entlang der AP-Struktur einholen.
5. **BFSG-Anwendbarkeit** und Gewerbe-/Freiberufler-Status rechtlich klären (nicht annehmen).
6. Vor Beauftragung einreichen — Vorhaben darf noch nicht begonnen sein.
