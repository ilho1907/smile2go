# 🗂️ smile2go — ADMIN KURULUM REHBERİ (senin için)

> 3 Bölüm: A) Mac'te dene · B) Websitesine koy (canlıya al) · C) Admin paneli & güvenlik

---

## A · Mac'te indirip deneme (5 dk)

1. **smile2go-projekt.zip**'i indir → çift tıkla (Downloads'a açılır)
2. **Node.js** kur (bir kez): nodejs.org → "LTS" indir → kur
3. **Terminal** aç (⌘+Boşluk → "Terminal" yaz) ve yapıştır:
   ```bash
   cd ~/Downloads/smile2go-projekt/app
   npm install
   npm run dev
   ```
4. Tarayıcıda aç:
   - Üye uygulaması: **http://localhost:5173**
   - Admin paneli: **http://localhost:5173/#admin**
5. Durdurmak için Terminal'de: **Ctrl + C**

> Not: ilho'nun AI cevapları lokalde "versuch es gleich noch einmal" der — normal.
> API key tarayıcıya konmaz (güvenlik). Canlıda Edge-Function ile çalışır (Bölüm B-5).

---

## B · Websitesine koyma (canlıya alma)

Webflow React uygulaması barındıramaz → app **Vercel**'de yaşar,
Webflow sitesi ona **link verir** (buton: "Zur App →").

### B-1 · GitHub'a yükle (bir kez)
1. github.com → hesap aç → "New repository" → ad: `smile2go` → Private ✓
2. Terminal:
   ```bash
   cd ~/Downloads/smile2go-projekt/app
   git init && git add . && git commit -m "smile2go v2"
   git branch -M main
   git remote add origin https://github.com/KULLANICIADIN/smile2go.git
   git push -u origin main
   ```

### B-2 · Vercel'e bağla (3 dk)
1. vercel.com → "Sign up with GitHub"
2. "Add New → Project" → `smile2go` repo'sunu seç → **Region: Frankfurt (fra1)**
3. "Deploy" → 1 dk sonra canlı: `smile2go.vercel.app` 🎉

### B-3 · Kendi domain'in
1. Domain al (örn. smile2go.de) → Cloudflare'e ekle (ücretsiz)
2. Vercel → Settings → Domains → `app.smile2go.de` ekle
3. Cloudflare'de gösterilen CNAME kaydını gir → 10 dk içinde aktif

### B-4 · Webflow'a buton koy
Webflow sitesinde (Site-ID: 69f10441…) bir buton/navbar linki:
**"Zur App →" → https://app.smile2go.de**
(İstersen bunu Webflow bağlantın üzerinden ben eklerim — "Webflow'a butonu ekle" de.)

### B-5 · Gerçek veriler & ilho'yu canlandırma
Sırasıyla `doku/smile2go-production-guide.md` → **Bölüm 8** (11 adım):
Supabase (SQL hazır) → Stripe → Edge Function /ai (Anthropic key buraya) →
OneSignal Push → n8n import → Resend. Her adımda hangi key nereye:
`konfiguration/ilho.env.example` içinde yorumlu.

---

## C · Admin paneli & güvenlik

- Adres: canlıda **https://app.smile2go.de/#admin**
  (ileride ayrı: admin.smile2go.de önerilir)
- **Mutlaka 2 katman koruma** (canlıya almadan önce!):
  1. Supabase login + `profiles.is_admin = true` kontrolü
  2. **Cloudflare Access** (ücretsiz): admin URL'sine sadece senin mail'inle
     tek-kullanımlık kod ile girilir → 5 dk kurulum: Cloudflare → Zero Trust →
     Access → Application ekle → admin yolu → Policy: "Email = senin@mailin"
- Prototipte admin paneli demo verilerle açık — **canlıya korumasız alma.**

---

## Müşterilere ne veriyorsun?
`doku/kundinnen-anleitung.html` → markalı, Almanca kayıt & kurulum sayfası.
Webflow'a yükle veya app.smile2go.de/willkommen olarak yayınla; kayıt mailine
link koy. (İçeriği bir sonraki dosyada.)
