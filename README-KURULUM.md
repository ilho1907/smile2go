# smile2go — Kurulum (Mac)

## Hızlı başlangıç (5 dakika)
1. **Node.js kur** (yoksa): https://nodejs.org → LTS sürümü indir, kur.
2. Terminal aç (⌘+Boşluk → "Terminal") ve sırayla:
   ```bash
   cd ~/Downloads/smile2go-projekt/app
   npm install
   npm run dev
   ```
3. Tarayıcıda aç: **http://localhost:5173** → Mitglieder-App
   Admin-Dashboard: **http://localhost:5173/#admin**

## Önemli notlar
- **ilho (KI) lokal çalışmaz**: Anthropic API key tarayıcıya konmaz (güvenlik).
  Claude.ai artifact içinde canlı çalışır; lokalde nazik bir hata mesajı görürsün.
  Production'da: Supabase Edge Function `/ai` proxy'si kurulur → doku/smile2go-production-guide.md, Bölüm 1.
- Veriler prototipte hafızada — sayfa yenilenince sıfırlanır (production: Supabase).

## Klasörler
| Klasör | İçerik |
|---|---|
| app/ | React PWA (Mitglieder + Admin) — npm run dev ile çalışır |
| automation/ | n8n workflow (07:00 Tagescontent) — n8n'e Import |
| datenbank/ | Supabase SQL şeması (13 tablo + RLS) |
| konfiguration/ | .env şablonu — key'lerini buraya gir, ASLA paylaşma |
| doku/ | Production-Guide: mimari, güvenlik, maliyet, 11 adımlı canlıya alma |

## Canlıya alma sırası
doku/smile2go-production-guide.md → Bölüm 8 (1 günlük plan).
