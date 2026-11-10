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
| `#admin` | `Admin.jsx` | Plattform-Dashboard |

**Arayüz ve kod dili Almanca (Du-Form).** Kullanıcıyla iletişim Türkçe.
Yeni metin, değişken ve yorumlar mevcut Almanca üsluba uyar.

## Çalıştırma

```bash
cd app && npm install && npm run dev     # http://localhost:5173
npm run build                            # Vite build
```

Test/lint kurulu değil — `npm run build` ve tarayıcıda elle kontrol.
Derlemenin geçmesi yetmez: eksik bir import'u esbuild global sanar, derleme
geçer, uygulama çalışırken patlar. Riskli değişiklikten sonra tarayıcıda aç.

## Dizinler

| Yol | İçerik |
|---|---|
| `app/src/` | React kaynak (aşağıya bak) |
| `app/public/media/` | Video/ses/görsel — **açma, 39 MB** |
| `backend/supabase/migrations/` | 23 SQL migration, tarih öneki ile sıralı |
| `backend/supabase/functions/` | Edge Functions: `ai`, `tts`, `push`, `erinnerungen`, `fairness`, `konto-loeschen` |
| `datenbank/` | Şema anlık görüntüsü (referans) |
| `automation/` | n8n workflow JSON'ları |
| `konfiguration/ilho.env.example` | Tüm ENV anahtarlarının şablonu |
| `doku/` | Production guide |
| `BACKLOG.md` | Bilinçli ertelenenler — "bu neden yok" sorusunun cevabı |
| `*.md` (kök) | Strateji/hukuk/plan notları — kod değil |

## app/src — dosya haritası

| Dosya | Satır | Ne yapar |
|---|---|---|
| `App.jsx` | **11.425** | Üye uygulamasının tamamı — tüm ekranlar tek dosyada |
| `supabase.js` | 1.396 | Tüm veri erişimi, 126 export'luk API katmanı |
| `Coach.jsx` | 1.209 | Coach paneli |
| `Admin.jsx` | 450 | Admin dashboard |
| `OrakelReveal.jsx` `Ikon.jsx` `sprache.js` `media.js` `HeuteHero.jsx` `ZweiFaktor.jsx` `BookOpen.jsx` `MediaScreens.jsx` `MediaBanner.jsx` | <260 | Ayrık bileşen/yardımcılar |
| `ilho.js` | 9 | `ILHO_SYSTEM` — ilho'nun sistem promptu, **tek kaynak** |
| `export.js` | 26 | PDF (yazdırma penceresi) ve CSV indirme |
| `lib/energy.js` | 49 | Enerji hesabı |

### App.jsx'te gezinme — ÖNEMLİ

`App.jsx` ~11.400 satır, 232 üst düzey tanım. **Tamamını okuma** (~200.000
token). Önce konumu bul, sonra sadece o aralığı oku:

```bash
grep -n "^function Orakel" app/src/App.jsx      # → satır no
```
sonra Read ile `offset`/`limit` vererek o bölümü aç.

Kabaca bölgeler (satır numaraları her commit'te kayar — **grep'e güven**,
bu listeye değil):

- **1–900** sabitler ve ortak parçalar: renk paleti `C`, `DUNKEL_TON`/`Dunkel`
  (karanlık ton), motivasyon/affirmasyon/göttin listeleri, `KartenArt`,
  `Hoerknopf`, `Hoerspur`, `Card`, `Btn`, `H`, `Eyebrow`, `Mikro`,
  `TeilenBtn`, `LogoMark`, `NavIcon`
- **425 `askLuma`** — üye uygulamasının KI çağrısı
- **913–1660** `Auth`, `EnergieKompass`, `Heute`, `Luma` (ilho sohbeti)
- **1700–2160** `Horoskop`, `Mystik`, `Orakel`
- **2190–2430** `KursDetail`, `Kurse`
- **2434–3350** günlük & ritüeller: `Journal`, `JournalHeute`, `Rituale`,
  `DankbarkeitsChallenge`, `BriefUmschlag`, `Brief`, `MoneyMind`, `Musik`
- **3420–4140** coach araçları: `WissensSuche`, `CoachWerkstatt`, `Recherche`,
  `SessionIntelligenz`, `SessionArchiv`, `StimmProfil`, `CoachTwinInterview`
- **4200–4590** `CoachDashboard`, `WochenCheckin`, `Wochenbild`, `Fortschritt`
- **4600–5330** `Profil`, `CoachVerbinden`, `Buchen`, `CoachChat`
- **5520–6160** `Office` (marka baukasten), `Mediathek`
- **6160–6940** `Ziele`, `Aufgaben`, `Meditation`, `Community`, `AppGuide`,
  `Fragebogen`, `Podcast`
- **6960–7450** `CoachingHub`, `Wochenbericht`
- **7570–8140** `Gemeinschaft` (503 satır — en büyük tek bileşen)
- **8140–8660** `THEMEN`, `ThemaScreen`, `MEHR_GRUPPEN`, `Mehr`
- **8720–9100** `PunkteModal`, `Schattenspiegel`, `ZukunftsIch`
- **9100–10820** `SOSOverlay`, `ArchetypTest` ve tüm ritüel modülleri
  (`Flamme`, `FreundinnenKreis`, `Mondrituale`, `Intuition`, `Reisen`,
  `Jahreskreis`, `RitualDerLeere`, `Qigong`, `Achtsamkeit`, `Dankbarkeit`,
  `Loslassen`, `MeTime`, `Jahresrueckblick`)
- **10873–sonu** yönlendirme: `ROOTS`, `TITLES`, `IlhoApp` (kök bileşen, tüm
  state ve `go` / `goRoot` / `back` burada)

> `App.jsx`'i modüllere bölme işi planlandı ve bekliyor —
> `AUFGABEN-claude.md`. Bu dosyada büyük bir yapısal değişikliğe girmeden
> önce o notu oku.

## Mimari kurallar

- **API anahtarı tarayıcıya girmez.** KI çağrıları `VITE_AI_FUNCTION_URL` →
  Supabase Edge Function `ai` üzerinden gider; `ANTHROPIC_API_KEY` yalnız
  sunucuda. Bu kuralı bozan öneri yapma. Üç çağrı yeri var:
  `App.jsx` içindeki `askLuma`, `supabase.js` (2 yer), `Admin.jsx` (fairness).
- **ilho'nun sistem promptu tek yerde:** `app/src/ilho.js`. Hem uygulama hem
  Admin'deki fairness testleri oradan okur — kopyalama.
- **Supabase opsiyonel.** ENV yoksa `supabase` = `null` ve uygulama
  localStorage ile çalışmaya devam eder. Yeni veri yolları bu düşüşü korumalı.
- **Veri erişimi `supabase.js` üzerinden.** Şu an 48 `supabase.from(...)`
  çağrısının hepsi orada; `App.jsx` ve `Coach.jsx`'te sıfır. Bu temizliği
  bozma: bileşenin içine sorgu yazma, `supabase.js`'e fonksiyon ekle.
- **Üye durumu tek JSONB blob:** `app_state` tablosu, `ladeAppState` /
  `speichereAppState`. localStorage anahtarı `s2g_state` ile birebir aynı.
- **RLS her tabloda açık** — her kadın yalnız kendi satırını görür.
  Yeni tablo eklerken migration'da RLS politikası da yaz.
- Yeni migration: `backend/supabase/migrations/YYYYMMDD_konu.sql`.
- **Psikolojik yük uyarısı pazarlık konusu değil:** `ilho.js`'teki kriz
  yönlendirmesi (KI olduğunu açıkça söylemek, TelefonSeelsorge / 112) hukuki
  bir gerekliliktir — zayıflatma, kısaltma, "daha akıcı olsun" diye yeniden
  yazma.

## Çalışma tarzı

- **Oturum başında `AUFGABEN-claude.md`'ye bak.** Bekleyen iş varsa
  kullanıcıya tek satırla hatırlat ("App.jsx bölme işi bekliyor, girelim mi?")
  ve onay bekle — büyük bir refactor'ü kendi başına başlatma.
- `app/src/App.jsx` gibi büyük dosyalarda arama için alt ajan kullan
  (`Explore`, `Codebase Onboarding Engineer`) — dosya içeriği ana bağlama
  girmez, token yanmaz.
- `.claude/agents/` altında 230 uzman ajan var, listesi
  `.claude/AGENTS-KURULUM.md` içinde.
- Geliştirme `claude/*` dallarında, `main`'e PR ile.
- `app/public/media/` altındaki dosyaları açma; sadece yol referansı ver.
