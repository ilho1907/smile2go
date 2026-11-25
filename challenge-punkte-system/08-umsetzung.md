# 08 · Umsetzung

Her adım ayrı `claude/*` dalı ve ayrı PR. Canlıya alma sadece ilho
"canlıya al" deyince. Supabase'de SQL/migration sadece ilho onayıyla.

| Adım | İçerik | Durum |
| --- | --- | --- |
| 1 | Veri katmanı: `punkte_log` güvenli, `punkte_regeln`, RPC'ler, `addPunkte` sunucuya | **PR #34**, onay bekliyor |
| 1b | `02-punkte-regeln.md` SQL'i (migration ile aynı gün) | Bekliyor |
| 2 | Gerçek seri + Pause-Tag, seviyeler, sabit eylem anahtarları, süre (3 yıl) | Kararlar bekleniyor |
| 3 | `challenges` + `challenge_teilnahmen`, üye ekranı, smile2go challenge'ları (Admin) | — |
| 4 | Koç paneli: Gold koç challenge'ı, onay akışı, katılımcı onayı | Coach-Codes işine bağlı |
| 5 | Mağaza: kupon kodu, `einloesungen`, `angebote.punkte_akzeptiert` / `max_rabatt_prozent`, Coach-Lichtpunkte | — |

## Ortak prompt başlığı (her adımda kullan)

```markdown
GÖREV: smile2go Lichtpunkte & Challenge sistemi — ADIM <n>

Önce oku: CLAUDE.md, AUFGABEN-claude.md, challenge-punkte-system/README.md
ve bu adımla ilgili dosyalar (aşağıda). Kararlar: challenge-punkte-system/10-entscheidungen.md.
Açık bir karar bu adımı etkiliyorsa tahmin etme, ilho'ya sor.

Kurallar:
- Arayüz ve kod Almanca (Du-Form), ilho ile iletişim Türkçe.
- Veri erişimi sadece supabase.js üzerinden; Supabase yoksa localStorage ile çalışmaya devam.
- Her yeni tabloda RLS. Puan yazma sadece SECURITY DEFINER fonksiyonlarıyla.
- Migration: backend/supabase/migrations/YYYYMMDD_konu.sql, idempotent, lokal Postgres'te test.
- Journal/duygu içeriği puan sistemine asla girmez.
- 01-konzept.md'deki "kesin hayır"lar: sıralama tablosu, rastgele bonus, kayıp korkusu, suni aciliyet yok.
- App.jsx'i komple okuma; grep ile yerini bul.

Bitirince: npm run build + tarayıcıda test, PR aç (main'e birleştirme),
AUFGABEN-claude.md ve challenge-punkte-system/08-umsetzung.md tablosunu güncelle.
```

## Adım 2 — Serie, Stufen, sabit anahtarlar

Oku: 01-konzept.md (Seri, Seviyeler), 02-punkte-regeln.md (değişken etiketler).
- `IlhoApp` içindeki sabit `const streak = 7` kaldırılır. Seri sunucuda
  hesaplanır: `punkte_serie()` RPC → `{ aktuell, laengste, pause_genutzt }`
  (Europe/Berlin günleri, hafta başına 1 Pause-Tag). Supabase yoksa
  `app_state` içinden yerel hesap.
- Seri bonusları (7/21/40/100) `art = 'verdient'` ama günlük sınıra sayılmaz
  → `punkte_log`'a `art = 'bonus'` ekle (check constraint güncelle).
- Seviyeler: toplam **kazanılan** (verdient + bonus + uebernahme) puan; harcama
  düşürmez. `PunkteModal`'a seviye satırı.
- `addPunkte(n, label, aktion?)`: 4 değişken etiket için sabit `aktion`.
- Başlangıç puanı: `useState(120)` → karar 10-entscheidungen.md.
- Süre: `punkte_verfall()` işi (yılda bir, 31.12) — sadece hazırlık, çalıştırma ilho onayıyla.

## Adım 3 — Challenges

Oku: 01-konzept.md (Challenge'lar), 03-challenge-katalog.md.
- Tablolar: `challenges` (id, titel, beschreibung, typ, thema, quelle, coach_id,
  start, ende, ziel jsonb, punkte, belohnung jsonb, status) ve
  `challenge_teilnahmen` (challenge_id, user_id, beigetreten_am, fortschritt,
  abgeschlossen_am, belohnung_vergeben, coach_einwilligung).
- İlerleme: `punkte_log` eylemlerinden hesaplanır (`ziel` = hangi eylem, kaç kez,
  hangi tarihler arası). Topluluk challenge'ı = tüm katılımcıların toplamı.
- `challenge_abschliessen()` RPC: koşul sağlandıysa puan + ödül, bir kez.
- Üye ekranı: liste (aktif / yakında / bitti), katıl, ilerleme çubuğu, çık.
  En fazla 3 aktif.
- Admin: smile2go challenge'ı oluştur, katalogdaki 17 challenge'ı tek tıkla yükle.

## Adım 4 — Koç challenge'ları

Oku: 04-coach-regeln.md, 05-texte.md (katılım onayı).
- Koç panelinde (`app/src/coach/`): oluştur → Prüfung. Sadece Gold paket (kontrol
  sunucuda). Admin'de onay kuyruğu + ret gerekçesi.
- Koç sadece onay verenlerin ilerlemesini görür (RPC, içerik yok).

## Adım 5 — Shop & Coach-Rabatt

Oku: 01-konzept.md (Ekonomi), 06-recht.md (çekiliş, süre).
- `einloesungen` tablosu + tek kullanımlık kupon kodu.
- `angebote`: `punkte_akzeptiert boolean`, `max_rabatt_prozent int`.
- Coach-Lichtpunkte: `quelle = 'coach'` bakiyesi, sadece o koçta.
- Mevcut `BELOHNUNGEN` sunucudaki ödül listesine taşınır (Admin'den düzenlenir).
- Çekilişe katılım asla puan düşürmez.
