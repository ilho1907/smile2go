# smile2go — Entegrasyon Rehberi (Medien + Backend)

Bu paket app'e eklendi. İçindekiler:

## 1. Medya dosyaları (indirildi)
`public/media/` altında:
- `img/` — orakel, lichtpunkte, welcome, podcast, meditation (4K PNG)
- `video/` — orakel, meditation, podcast, lichtpunkte, welcome, ad_9x16, ad_16x9 (mp4)
- `audio/` — meditation, welcome, lichtpunkte, podcast, dankbarkeit, brief, tagebuch (wav)

Not: PNG'ler 4K (~20–30MB). Prod'da web için `.webp`/1080p'ye küçültmen önerilir.

## 2. Frontend dosyaları (src/)
- `src/media.js` — tüm varlık yolları + voiceover metinleri + palet
- `src/lib/energy.js` — Lichtpunkte + journal (Supabase + localStorage fallback)
- `src/OrakelReveal.jsx` — sinematik kart açılışı (ışık huzmesi + parçacık + flip)
- `src/MediaScreens.jsx` — `Meditation`, `Podcast`, `WelcomeIntro`, `LichtpunkteReward`

### Kullanım örnekleri
```jsx
import OrakelReveal from "./OrakelReveal";
import { Meditation, Podcast, WelcomeIntro, LichtpunkteReward } from "./MediaScreens";

// Orakel tab:
<OrakelReveal onMeaning={() => {/* 'Was bedeutet sie für mich?' */}} />

// Meditation / Podcast tab:
<Meditation />
<Podcast />

// Onboarding (Anmelden sonrası):
<WelcomeIntro onContinue={() => setTab("heute")} />

// Görev tamamlanınca ödül:
{reward && <LichtpunkteReward points={5} onClose={() => setReward(false)} />}
```

## 3. Backend (Supabase)
`supabase_schema.sql` dosyasını Supabase → SQL Editor'da çalıştır.
Oluşturur: profiles, energy_ledger (+energy_balance view), journal_entries,
oracle_cards/draws, media_library/progress, products, purchases — hepsi RLS (DSGVO) ile.

`.env` doldur:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
ENV boşsa app localStorage ile çalışmaya devam eder (kırılmaz).

## 4. Sıradaki (öneri)
- Ödeme: Stripe/Mollie ile PayPal/Klarna/SEPA + GoBD fatura (products/purchases hazır)
- Görselleri web için optimize et (webp)
- App.jsx'teki ilgili tab'lara bileşenleri bağla (istersen ben yapayım)
