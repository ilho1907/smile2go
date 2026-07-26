#!/bin/bash
KAYNAK="$HOME/Desktop/smile2go-projekt"
HEDEF="$HOME/Desktop/smile2go"

echo ""
echo "╔══════════════════════════════════╗"
echo "║  smile2go — Kurulum başlıyor 🌹  ║"
echo "╚══════════════════════════════════╝"

if [ ! -d "$KAYNAK" ]; then
  echo "❌ Masaüstünde 'smile2go-projekt' bulunamadı."; exit 1
fi
echo "✅ Kaynak: $KAYNAK"

mkdir -p "$HEDEF/01_App" "$HEDEF/02_Admin" "$HEDEF/03_Datenbank"
mkdir -p "$HEDEF/04_Automation" "$HEDEF/05_Konfiguration"
mkdir -p "$HEDEF/06_Medien" "$HEDEF/07_Dokumentation" "$HEDEF/08_Marketing"

cp -r "$KAYNAK/app/."            "$HEDEF/01_App/"
cp -r "$KAYNAK/datenbank/."      "$HEDEF/03_Datenbank/"
cp -r "$KAYNAK/automation/."     "$HEDEF/04_Automation/"
cp -r "$KAYNAK/konfiguration/."  "$HEDEF/05_Konfiguration/"
cp -r "$KAYNAK/doku/."           "$HEDEF/07_Dokumentation/"

[ -f "$KAYNAK/app/public/begruessung.mp4" ] && \
  cp "$KAYNAK/app/public/begruessung.mp4" "$HEDEF/06_Medien/"
[ -f "$KAYNAK/app/src/Admin.jsx" ] && \
  cp "$KAYNAK/app/src/Admin.jsx" "$HEDEF/02_Admin/admin-dashboard.jsx"

cat > "$HEDEF/README.md" << 'EOF'
# smile2go — Klasör Rehberi

| Klasör | İçerik |
|---|---|
| 01_App | React PWA — npm install && npm run dev |
| 02_Admin | Admin-Dashboard + notlar |
| 03_Datenbank | Supabase SQL (13 tablo + RLS) |
| 04_Automation | n8n workflow (07:00 push) |
| 05_Konfiguration | .env şablonu |
| 06_Medien | Begrüßungsvideo |
| 07_Dokumentation | Production-Guide + rehberler |
| 08_Marketing | Kampanya materyalleri |

## Çalıştır
cd ~/Desktop/smile2go/01_App
npm install && npm run dev
→ localhost:5173 (App) · localhost:5173/#admin (Admin)
EOF

cat > "$HEDEF/02_Admin/NOTLAR.md" << 'EOF'
# Admin Notları

Lokal:  http://localhost:5173/#admin
Canlı:  https://app.smile2go.de/#admin  (+ Cloudflare Access)

## App içinde düzenle
- Mein Office → Briefkopf → Bearbeiten
- Mein Office → Dokument → ✏️ Bearbeiten
- Admin Panel → Content → Spruch-Pool

## Supabase'den yönet (canlıda)
Üye paketleri · Kurs içerikleri · Günlük içerik · Coach mesajları
EOF

cat > "$HEDEF/05_Konfiguration/KEY-SIRASI.md" << 'EOF'
# API Key Kurulum Sırası

1. supabase.com   → EU Frankfurt → URL + anon key
2. anthropic.com  → API key  ⛔ SADECE Edge Function'a
3. stripe.com     → 3 ürün → Price ID + Webhook secret
4. onesignal.com  → Web Push → App ID + key
5. resend.com     → Domain doğrula → API key

ilho.env.example → .env olarak kopyala → doldur
⛔ .env'i asla GitHub'a yükleme!
EOF

cat > "$HEDEF/01_App/.gitignore" << 'EOF'
node_modules/
dist/
.env
.env.local
.DS_Store
*.mp4
EOF

open "$HEDEF"
echo ""
echo "╔══════════════════════════════════════╗"
echo "║  ✅ Bitti! Finder'da açıldı 🌹       ║"
echo "║                                      ║"
echo "║  Şimdi:                              ║"
echo "║  cd ~/Desktop/smile2go/01_App        ║"
echo "║  npm install && npm run dev          ║"
echo "╚══════════════════════════════════════╝"
