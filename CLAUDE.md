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
| `app/src/` | React kaynak (aşağıya bak) |
| `app/public/media/` | Video/ses/görsel — **okuma, 39 MB** |
| `backend/supabase/migrations/` | 16 SQL migration, tarih öneki ile sıralı |
| `backend/supabase/functions/` | Edge Functions: `ai`, `tts`, `push`, `konto-loeschen` |
| `datenbank/` | Şema anlık görüntüsü (referans) |
| `automation/` | n8n workflow JSON'ları |
| `konfiguration/ilho.env.example` | Tüm ENV anahtarlarının şablonu |
| `doku/` | Production guide |
| `*.md` (kök) | Strateji/hukuk/plan notları — kod değil |

## app/src — dosya haritası

| Dosya | Satır | Ne yapar |
|---|---|---|
| `App.jsx` | **9.572** | Üye uygulamasının tamamı — tüm ekranlar tek dosyada |
| `supabase.js` | 1.020 | Tüm veri erişimi, 86 export'luk API katmanı |
| `Coach.jsx` | 858 | Coach paneli |
| `Admin.jsx` | 343 | Admin dashboard |
| `OrakelReveal.jsx` `MediaScreens.jsx` `HeuteHero.jsx` `BookOpen.jsx` `MediaBanner.jsx` | <260 | Ayrık görsel bileşenler |
| `media.js` | 140 | Medya manifestosu (kart görselleri, video/ses yolları) |
| `sprache.js` | 66 | Web Speech API ile sesli okuma |
| `lib/energy.js` | 49 | Enerji hesabı |

### App.jsx'te gezinme — ÖNEMLİ

`App.jsx` 692 KB. **Tamamını okuma** (~175.000 token). Önce konumu bul, sonra
sadece o aralığı oku:

```bash
grep -n "^function Orakel" app/src/App.jsx      # → satır no
```
sonra Read ile `offset`/`limit` vererek o bölümü aç.

Kabaca bölgeler (satır numaraları değişir, grep'e güven):

- **1–750** sabitler: renk paleti `C`, motivasyon/affirmasyon/göttin listeleri,
  tarot & karta ait veriler, hava durumu, ay evresi, ortak UI parçaları
  (`Card`, `Btn`, `H`, `Hoerknopf`, `Hoerspur`, `Mikro`, `TeilenBtn`)
- **391 `askLuma`** — tek KI giriş noktası
- **751–1200** `Auth`, `EnergieKompass`, `HeuteWidget`, `Heute`, `Luma`
- **1290–1800** burç, tarot, `Horoskop`, `Mystik`, `Orakel`
- **1816–2065** kurslar/teklifler (`KursDetail`, `Kurse`)
- **2066–2770** günlük & ritüeller (`Journal`, `Rituale`, `Challenge369`,
  `Brief`, `MoneyMind`, `Musik`)
- **2767–3620** coach tarafı zekâsı (`WissensSuche`, `SessionIntelligenz`,
  `StimmProfil`, `CoachTwinInterview`, `CoachDashboard`, `Wochenbild`)
- **3618–4520** `Fortschritt`, `Profil`, `Buchen`, `CoachChat`
- **4407–5230** marka/`Office` üretimi, `Mediathek`
- **5231–5930** `Ziele`, `Aufgaben`, hukuk sayfaları, `Meditation`,
  `Community`, `AppGuide`, `Fragebogen`, `Pakete`, `Podcast`
- **5925–6600** `CoachingHub`, `Wochenbericht`, `ThemaScreen`, `WochenChallenge`
- **6714–7350** `Mehr`, puan/rozet sistemi, `PunkteModal`, `Schattenspiegel`,
  `ZukunftsIch`
- **7350–9020** `SOSOverlay`, arketip testi ve tüm ritüel modülleri
  (`Qigong`, `Achtsamkeit`, `Dankbarkeit`, `Loslassen`, `MeTime`,
  `Mondrituale`, `Intuition`, `Reisen`, `Jahreskreis`, `WochenOrakel`)
- **9076–sonu** yönlendirme: `ROOTS`, `TITLES`, `IlhoApp` (kök bileşen, tüm
  state burada)

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
