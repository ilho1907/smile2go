# CLAUDE.md — smile2go

Bu dosya Claude Code için projenin haritasıdır. Amaç: her oturumda depoyu
yeniden keşfetmek zorunda kalmamak.

## Proje

smile2go — kadınlar için koçluk & kişisel gelişim PWA'sı (React 18 + Vite).
Üç arayüz tek uygulamada, URL hash'iyle ayrılır (`app/src/main.jsx`):

| Hash | Dosya | Kim için |
|---|---|---|
| (yok) | `App.jsx` | Mitglieder-App (üye) |
| `#coach` | `Coach.jsx` | Coach paneli — gerçek veri |
| `#admin` | `Admin.jsx` | Plattform-Dashboard — şimdilik demo veri |

**Arayüz ve kod dili Almanca (Du-Form).** Kullanıcıyla iletişim Türkçe.
Yeni metin, değişken ve yorumlar mevcut Almanca üsluba uyar.

## Çalıştırma

```bash
cd app && npm install && npm run dev     # http://localhost:5173
npm run build                            # Vite build
```

Test/lint kurulu değil — doğrulama `npm run build` ve tarayıcıda elle kontrol.

## Dizinler

| Yol | İçerik |
|---|---|
| `app/src/` | React kaynak — `ui/` `lib/` `daten/` `screens/` (aşağıya bak) |
| `app/public/media/` | Video/ses/görsel — **okuma, 39 MB** |
| `backend/supabase/migrations/` | 16 SQL migration, tarih öneki ile sıralı |
| `backend/supabase/functions/` | Edge Functions: `ai`, `tts`, `push`, `konto-loeschen` |
| `datenbank/` | Şema anlık görüntüsü (referans) |
| `automation/` | n8n workflow JSON'ları |
| `konfiguration/ilho.env.example` | Tüm ENV anahtarlarının şablonu |
| `doku/` | Production guide |
| `*.md` (kök) | Strateji/hukuk/plan notları — kod değil |

## app/src — dosya haritası

`App.jsx` eskiden 9.572 satırlık tek dosyaydı; 2026-09'da modüllere bölündü.
Artık kök bileşen 525 satır, geri kalan her ekran kendi dosyasında.

**Kök**

| Dosya | Satır | Ne yapar |
|---|---|---|
| `App.jsx` | 525 | `ROOTS`, `TITLES`, `IlhoApp` — tüm state ve yönlendirme burada |
| `supabase.js` | 1.020 | Tüm veri erişimi, 86 export'luk API katmanı |
| `Coach.jsx` | 858 | Coach paneli (`#coach`) |
| `Admin.jsx` | 343 | Admin dashboard (`#admin`) |
| `media.js` `sprache.js` | 140 / 66 | Medya manifestosu, sesli okuma |

**Paylaşılan katman** — ekranlar buradan besleniyor, ters yönde bağımlılık yok:

| Dosya | İçerik |
|---|---|
| `ui/tema.js` | Renk paleti `C` — 80 yerde kullanılıyor |
| `ui/basis.jsx` | `Card` `Btn` `H` `Eyebrow` `Mikro` `TeilenBtn` `Hoerknopf` `Hoerspur` `QRCode` `Absatz` `RechtSeite` |
| `lib/zeit.js` | `dayIndex` `kalenderwoche` `mondphase` `wochenNummer` `useSekundenTakt` … |
| `lib/ki.js` | `askLuma` `ILHO_SYSTEM` `tonalitaetsZusatz` — **tek KI giriş noktası** |
| `lib/wetter.js` | open-meteo sorgusu, `wmoIcon` |
| `lib/farben.js` | Marka renk matematiği (yalnız `Office` kullanıyor) |
| `lib/energy.js` | Enerji hesabı |
| `daten/inhalte.js` | `MOTIVATION` `SPRUECHE` `AFFIRMATIONEN` `KURSE` `TRACKS` `BADGES` `ENERGIE` |

**Ekranlar** (`screens/`) — hangi işi arıyorsan doğrudan o dosyayı aç:

| Dosya | Satır | İçindekiler |
|---|---|---|
| `Uebungen.jsx` | 1.287 | Qigong, Achtsamkeit, Dankbarkeit, Loslassen, MeTime, Mondrituale, Intuition, Reisen, Jahreskreis, WochenOrakel, RitualDerLeere, Flamme, FreundinnenKreis, Jahresrueckblick |
| `CoachIntelligenz.jsx` | 860 | WissensSuche, SessionIntelligenz, StimmProfil, CoachTwinInterview, CoachDashboard, CoachReflexion, WochenCheckin, Wochenbild |
| `Journal.jsx` | 652 | Journal, JournalHeute, Rituale, Challenge369, DankbarkeitsChallenge, Brief, MoneyMind |
| `Profil.jsx` | 646 | Profil, CoachVerbinden, Buchen, CoachChat |
| `Orakel.jsx` | 624 | Orakel, Horoskop, Mystik, KartenArt, göttin/tarot verileri, sternzeichen |
| `SOS.jsx` | 594 | SOSOverlay, ArchetypTest, Schattenspiegel, ZukunftsIch |
| `CoachingHub.jsx` | 514 | CoachingHub, Wochenbericht |
| `Mehr.jsx` | 492 | Mehr, ThemaScreen, WochenChallenge, THEMEN |
| `Office.jsx` | 442 | Marken-Baukasten |
| `Info.jsx` | 440 | Community, AppGuide, Fragebogen, Pakete, Impressum, Datenschutz |
| `Fortschritt.jsx` | 414 | Fortschritt, PunkteModal, abzeichen/ödül sistemi |
| `Mediathek.jsx` | 412 | Mediathek, Musik, Meditation, Podcast |
| `Heute.jsx` | 342 | Heute, Luma (ilho sohbeti), EnergieKompass, HeuteWidget |
| `Auth.jsx` | 279 | Anmeldung, Registrierung, PasswortNeu |
| `Kurse.jsx` | 265 | Kurse, KursDetail |
| `Ziele.jsx` | 117 | Ziele, Aufgaben |

Bir bileşeni nerede olduğunu bilmiyorsan:
```bash
grep -rn "^export function Orakel" app/src/screens/
```

## Mimari kurallar

- **API anahtarı tarayıcıya girmez.** KI çağrıları `askLuma` → `VITE_AI_FUNCTION_URL`
  → Supabase Edge Function `ai` üzerinden gider; `ANTHROPIC_API_KEY` yalnız
  sunucuda. Bu kuralı bozan öneri yapma.
- **Supabase opsiyonel.** ENV yoksa `supabase` = `null` ve uygulama
  localStorage ile çalışmaya devam eder. Yeni veri yolları bu düşüşü korumalı.
- **Veri erişimi `supabase.js` üzerinden.** Bileşenlerin içine doğrudan
  `supabase.from(...)` yazma; oraya bir fonksiyon ekle.
- **Üye durumu tek JSONB blob:** `app_state` tablosu, `ladeAppState` /
  `speichereAppState`. localStorage anahtarı `s2g_state` ile birebir aynı.
- **RLS her tabloda açık** — her kadın yalnız kendi satırını görür.
  Yeni tablo eklerken migration'da RLS politikası da yaz.
- Yeni migration: `backend/supabase/migrations/YYYYMMDD_konu.sql`.

## Çalışma tarzı

- Büyük dosyalarda arama için alt ajan kullan (`Explore`,
  `Codebase Onboarding Engineer`) — dosya içeriği ana bağlama girmez.
- `.claude/agents/` altında uzman ajanlar var, listesi
  `.claude/AGENTS-KURULUM.md` içinde.
- Sürüm notu: geliştirme `claude/*` dallarında, `main`'e PR ile.
- `app/public/media/` altındaki dosyaları açma; sadece yol referansı ver.
