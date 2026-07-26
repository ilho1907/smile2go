# smile2go — Screen-Flow · Supabase-Datenmodell · MVP-Roadmap
### Nurture-App „Frauen unterstützen Frauen" · Zielmarkt DACH · 300–500 verifizierte Coachinnen

> Grundprinzip: Jede Nutzerin kommt über den Referral-Link/QR **ihrer** Coachin. Die App bindet sie langfristig (Audio-Ritual + Nurture), bis aus dem nicht-kaufbereiten Lead eine zahlende Klientin wird. Ein Content-Pool, pro Nutzerin gefiltert — nie ein leerer Screen.

---

## TEIL 1 · Screen-Struktur & User-Flow

### 1.1 Onboarding (Referral → Home)

```
Referral-Link / QR der Coachin
        │  (referral_code in URL)
        ▼
[1] Splash / Marken-Intro  ──►  "smile2go · Dein Raum für Ruhe & Wachstum"
        ▼
[2] Coach-Willkommen        ──►  Foto + Name + 1 Satz der eigenen Coachin
        │                        "Schön, dass [Coachin] dich eingeladen hat 🤍"
        ▼
[3] Mini-Quiz (30 Sek)      ──►  Nische/Ziel: Ruhe · Selbstvertrauen · Schlaf · Karriere · Spiritualität
        ▼
[4] Registrierung           ──►  Apple / Google / E-Mail  →  referred_by wird gesetzt
        ▼
[5] DSGVO-Einwilligung       ──►  Double-Opt-in, EU-Hosting, sensible Daten (Mood) opt-in
        ▼
[6] Erste Belohnung          ──►  "Ritual des Tages" sofort freigeschaltet → 1-Tap-Play
        ▼
      HOME
```

Wichtig: Wird die App **ohne** Referral geöffnet (organisch), greift eine Default-Zuordnung (Marken-Content der Plattform als „Coachin") + späteres Matching.

### 1.2 Kern-Navigation (Tab-Bar)

| Tab | Screen | Zweck |
|---|---|---|
| 🏠 Home | Ritual des Tages, Mood-Check-in, Nischen-Element, CTA | Täglicher Öffnungsanreiz |
| 🎧 Mediathek | Alle freigeschalteten Audios, Kategorien, Favoriten, Downloads | Konsum & Wiederkehr |
| 🔥 Challenges | 7/14-Tage-Formate | Bindung über Serie |
| 👩‍🏫 Meine Coachin | Profil, Audios, Produkte, „Erstgespräch" | Parasoziale Bindung + Conversion |
| ✦ Mehr | Community, Shop, Konto, Einstellungen | Sekundär |

### 1.3 Screens im Detail

**Home**
- „Ritual des Tages"-Karte: 3–5 Min Audio **mit der Stimme der eigenen Coachin**, Foto + Name, 1-Tap-Play.
- Mood-/Energie-Check-in: „Wie geht's dir heute?" (1 Tap) → anonymisiertes Signal an Coachin + Nurture-Trigger.
- Nischen-Element (personalisiert): Mondkalender (spirituell) · Wochenfokus (Karriere) · Schlaf-Tipp (Achtsamkeit).
- CTA-Karte „Ich bin bereit" → direkte Erstgespräch-Buchung.

**Meine Coachin (Coach-Profil)**
- Header: Foto, Name, Nische, kurze Bio.
- Tab „Meditationen & Impulse": alle Audios; frei = offen, Premium = 🔒 → Stripe-Checkout (9–19 €).
- Tab „Produkte": digitaler Shelf (Journals-PDF, Meditationspakete, Affirmationskarten 5–50 €).
- Button „Erstgespräch buchen" (kostenlos).

**Player (global)**
- **Immer** Foto + Name der Coachin sichtbar (Bindung).
- Audio: eigener Player aus Supabase Storage. Freies Video: YouTube-Embed (unlisted) im In-App-Player.
- Premium gesperrt → Schloss → Checkout → nach Zahlung sofort abspielbar.

**Mediathek**
- Kategorien: Schlaf · Stress · Selbstvertrauen · Morgenritual.
- Favoriten (❤️), Offline-Download (nur freigeschaltete/gekaufte), Suche.

**Challenges**
- Liste (7/14 Tage) → Detail: Tag-für-Tag, jeder Tag = 1 Audio + 1 Mini-Aufgabe, Fortschrittsanzeige.

**Shop / Produkt-Shelf**
- Einstiegsprodukte pro Coachin, Stripe-Checkout, sofortiger Download (Storage).

**Community (moderiert)**
- Feed, Beitrag erstellen, Herz/Antwort, Moderations-Status.

**Konto**
- Abo/Käufe, Benachrichtigungen, DSGVO (Export/Löschen), Coachin-Zuordnung.

### 1.4 Conversion-Pfad (nicht kaufbereit → zahlend)

```
Freies Ritual (Tag 1)
   → tägliche Audios + Mood-Check-in (Gewohnheit)
      → Einstiegsprodukt 5–19 € (erster Kauf, geringe Hürde)
         → Challenge 7/14 Tage (Commitment)
            → Nurture Tag 30/60/90 (persönliches Video der Coachin)
               → "Ich bin bereit" → Erstgespräch → 1:1-Paket
```

---

## TEIL 2 · Supabase-Datenmodell

> Region: EU (Frankfurt/Paris). Alle Tabellen mit RLS. `auth.uid()` = Nutzerin.

### 2.1 Tabellen (Kern)

**coaches**
| Feld | Typ | Notiz |
|---|---|---|
| id | uuid PK | |
| name | text | |
| foto_url | text | Player/Profil |
| nische | text | spirituell/karriere/meditation/yoga/persoenlichkeit |
| bio | text | |
| referral_code | text UNIQUE | für Link/QR |
| stripe_account_id | text | Stripe Connect (Auszahlung) |
| aktiv | bool | |

**profiles** (Nutzerinnen)
| Feld | Typ | Notiz |
|---|---|---|
| id | uuid PK = auth.uid() | |
| referred_by | uuid FK → coaches.id | **Kern der Coach-Bindung** |
| nische_praeferenz | text | aus Onboarding-Quiz |
| onboarding_done | bool | |
| hybrid_ab | timestamptz | referred-Datum + 90 Tage → Hybrid-Öffnung |
| created_at | timestamptz | |

**content_items** (EIN Pool, getaggt)
| Feld | Typ | Notiz |
|---|---|---|
| id | uuid PK | |
| coach_id | uuid FK → coaches.id | NULL = Marken-Content der Plattform |
| typ | text | audio / video / pdf / **kurs** |
| titel | text | |
| kategorie | text | schlaf/stress/selbstvertrauen/morgenritual/**praevention**/**finanzen** |
| nische_tags | text[] | für Personalisierung |
| storage_path | text | Supabase Storage (Audio/Premium) |
| youtube_id | text | nur freie Videos (unlisted) |
| dauer_sec | int | |
| is_premium | bool | |
| preis | numeric | 9–19 € (Kurse 100–150 €) |
| is_marken_content | bool | Fallback-Quelle |
| **erstattbar** | **bool** | **§20 SGB V — Krankenkasse erstattet (Prio-Service 1)** |
| **zpp_kursnummer** | **text** | **ZPP-Zertifizierungsnummer (nur wenn erstattbar)** |
| **handlungsfeld** | **text** | **Bewegung/Ernährung/Stressbewältigung/Suchtmittel** |
| **einheiten** | **int** | **Kurs-Einheiten (z. B. 8) für Teilnahmebescheinigung** |
| **finanz_disclaimer** | **bool** | **true bei kategorie=finanzen → „Bildung, keine Anlageberatung"** |
| published_at | timestamptz | Fallback-Sortierung |

**products** (digitaler Shelf)
| id uuid PK · coach_id FK · typ (journal/paket/affirmation) · titel · preis (5–50) · datei_path · aktiv |

**challenges**
| id uuid PK · coach_id FK · titel · laenge_tage (7/14) · nische · aktiv |

**challenge_days**
| id uuid PK · challenge_id FK · tag_nr int · content_id FK → content_items · aufgabe_text |

**purchases** (Käufe + Provision)
| Feld | Typ | Notiz |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | |
| content_id | uuid FK | ODER product_id |
| product_id | uuid FK | |
| coach_id | uuid FK | **Provision bleibt bei ursprünglicher Coachin** |
| betrag | numeric | |
| plattform_cut | numeric | Take-Rate |
| stripe_payment_id | text | |
| created_at | timestamptz | |

**entitlements** (Freischaltungen, schnelle Zugriffsprüfung)
| user_id · content_id/product_id · quelle (kauf/frei/challenge) · created_at |

**mood_checkins**
| id · user_id · wert int (1–5) · datum · notiz (opt) · → anonymisiertes Signal (Art. 9 DSGVO opt-in) |

**favorites** | user_id · content_id · created_at |
**downloads** | user_id · content_id · geladen_am (Offline) |

**bookings** („Ich bin bereit")
| id · user_id · coach_id · typ (erstgespraech) · status (angefragt/bestätigt) · created_at |

**nurture_log** (n8n-Automation)
| id · user_id · coach_id · stufe (30/60/90) · typ (nachricht/video) · sent_at |

**community_posts**
| id · user_id · text · moderation (offen/freigegeben/blockiert) · herzen · created_at |

**kurs_teilnahme** (§20 — Nachweis für Krankenkassen-Erstattung · Prio-Service 1)
| id · user_id · content_id FK (erstattbar=true) · fortschritt_prozent · abgeschlossen_am · bescheinigung_pdf_path (Teilnahmebescheinigung) |

**events** (lokale Community-Circles & Treffen · Prio-Service 3)
| id · coach_id FK (opt) · titel · stadt · adresse · datum · typ (circle/treffen/live_qa/mastermind) · max_plaetze · online_link (opt) · moderiert bool |

**event_signups**
| id · user_id · event_id FK · status (angemeldet/warteliste/teilgenommen) · created_at |

**buddy_matches** (Accountability-Partnerin · Prio-Service 3)
| id · user_a · user_b · nische · status (offen/aktiv/beendet) · matched_at |

### 2.2 Filter- & Fallback-Logik (pro Nutzerin)

Feed-Query-Reihenfolge für eine Nutzerin `u` mit Coachin `c = u.referred_by`:

1. **Primär:** `content_items WHERE coach_id = c` (neuester zuerst).
2. **Fallback a:** kein neuer Content → älterer Content derselben Coachin.
3. **Fallback b:** immer noch leer → `is_marken_content = true` (Plattform-Content).
4. **Ab Tag 90** (`now() >= profiles.hybrid_ab`): **Hybrid** — Content anderer Coachinnen erscheint zusätzlich; aber jede daraus resultierende `purchase`/`booking` schreibt `coach_id = c` (Provision bleibt bei der ursprünglichen Coachin).

### 2.3 RLS-Grundregeln
- `profiles`: Nutzerin sieht/ändert nur eigene Zeile.
- `content_items`: lesbar, wenn `coach_id = referred_by` ODER `is_marken_content` ODER (Nutzerin im Hybrid-Fenster). Premium-Audio-URL nur bei vorhandenem `entitlement`.
- `purchases/bookings`: Nutzerin nur eigene; Coachin sieht nur aggregierte/erlaubte Signale.
- `mood_checkins`: nur mit Einwilligung; an Coachin **anonymisiert/aggregiert**.

---

## TEIL 3 · MVP-Roadmap (Phase 1 / 2 / 3)

### Phase 1 — MVP (must-have, „App lebt")
Ziel: Referral → tägliches Audio-Ritual → erster Kleinkauf.
- Onboarding mit **referral_by** (Link/QR) + Coach-Willkommen + Nische-Quiz.
- **Home + „Ritual des Tages"** (Audio der eigenen Coachin, 1-Tap-Play).
- **Coach-Profil** mit Audios: frei + Premium (🔒) → **Stripe-Checkout** (9–19 €).
- **Player** mit Foto/Name der Coachin (Audio = Supabase Storage; freie Videos = YouTube unlisted).
- **Mediathek** (Kategorien, freigeschaltete Audios).
- **Datenmodell + Filter/Fallback + Marken-Content** (nie leerer Screen).
- **Mood-Check-in** täglich.
- **„Ich bin bereit"** → Erstgespräch-Buchung.
- **Push** via n8n: „Neue Meditation von deiner Coachin 🎧".
- DSGVO: Double-Opt-in, EU-Hosting, Einwilligung für Mood.

### Phase 2 — Bindung & Monetarisierung vertiefen
- **Challenges** 7/14 Tage (Audio + Mini-Aufgabe pro Tag).
- **⭐ Prio-Service 1 — Präventionskurse (§20 SGB V):** Kategorie „Von der Krankenkasse erstattbar", Kurs-Format (`typ=kurs`, `erstattbar`, `zpp_kursnummer`, `handlungsfeld`, `einheiten`); nach Abschluss **Teilnahmebescheinigung-PDF** (`kurs_teilnahme`) für die Erstattung. Stärkster Verkaufshebel („bis zu 100 % zurück").
- **⭐ Prio-Service 2 — Finanz-Modul „Finanzielle Unabhängigkeit":** Kurse/Journals mit `kategorie=finanzen`, Pflicht-Label `finanz_disclaimer` („Bildung & Coaching, keine Anlageberatung"). Themen: Rentenlücke, Geldanlage-Basics, Finanzen nach Trennung.
- **Digitaler Produkt-Shelf** (Journals-PDF, Meditationspakete, Affirmationskarten 5–50 €) — auch Einstiegsprodukt für Finanz & Prävention.
- **Favoriten + Offline-Download**.
- **Nurture-Sequenzen** via n8n (Tag 30/60/90: persönliche Nachricht/Video).
- **Nischen-Personalisierung** (Mondkalender / Wochenfokus).
- Stripe **Connect** (Auszahlung an Coachin + Plattform-Provision), Provisions-Tracking in `purchases`.

### Phase 3 — Netzwerk & Skalierung
- **⭐ Prio-Service 3 — Lokale Community-Circles:** `events` (Stadt, Datum, Typ circle/treffen/live_qa/mastermind) + `event_signups` + **Buddy-Matching** (`buddy_matches`). Der Marken-Burggraben „Frauen unterstützen Frauen" — schwer kopierbar, hohe Retention.
- **Moderierte In-App-Community** (Feed).
- **90-Tage-Hybrid-Öffnung** (Content anderer Coachinnen, Provision bleibt bei Original-Coachin).
- **Coach-Dashboard** (aggregierte Signale, Content-Upload-Self-Service, Umsatz).
- **B2B / BGF** (§20b SGB V): Firmenpakete für Mitarbeiterinnen-Wellness.
- Empfehlungs-Feed, A/B-Tests, erweiterte Analytics.

> **Rechtliche Leitplanken** (siehe `STRATEGIE-Serviceangebote-Deutschland.md`): §20-Kurse nur mit ZPP-Zertifizierung + qualifizierter Kursleitung; Finanzen = Bildung/Coaching, **keine** regulierte Anlageberatung (§34f GewO); keine Heilversprechen (HeilprG); Gesundheitsdaten nur mit Einwilligung (Art. 9 DSGVO).

---

## Anhang · Hosting- & Marken-Regeln (fix)
- **Freie Videos:** YouTube-Embed (unlisted) im In-App-Player.
- **Audios & ALLE Premium-Inhalte:** Supabase Storage + eigener Player (kontrollierbar/monetarisierbar).
- **Ton:** warm, „Sanctuary", nicht „Software". Kernbotschaft „Frauen unterstützen Frauen".
- **Markenschutz:** wissenschaftlich fundierte Achtsamkeit, **keine** aggressiven Manifestations-/Heilsversprechen.

*Stand: Juli 2026 · Techstack: Supabase · n8n · Stripe · Higgsfield/Blotato · Webflow*
