# 01 · Konsept

## Amaç

Lichtpunkte, kadınların smile2go'yu düzenli kullanmasını, kendi gelişimini
görmesini ve topluluğa bağlanmasını destekler. Puan bir araçtır, amaç değil:
araştırmalar puanın tek başına ek bir etki göstermediğini, asıl etkinin
içerikten geldiğini söylüyor (bkz. 09-quellen.md, Six 2021).

## İlkeler (Self-Determination Theory)

| İhtiyaç | smile2go'da karşılığı |
| --- | --- |
| Özerklik | Zorunlu görev yok. Kullanıcı challenge'ı kendisi seçer, istediği an çıkar. |
| Yetkinlik | İlerleme görünür: seviye, seri, rozet, "Dein Weg" (kendi geçmişin). |
| Ait olma | Topluluk challenge'ları, ortak hedefler, koçla bağ. |

## Kesin "hayır"lar

Bu kurallar pazarlık konusu değildir. Hem araştırma hem AB hukuku (DSA Art. 25,
UGP-Richtlinie) bunu destekliyor.

1. **Herkese açık sıralama tablosu yok.** Rekabetçi fitness uygulamasında stres
   puanı kontrol grubunun yaklaşık iki katı çıktı (Bai ve ark. 2025).
2. **Rastgele bonus yok.** Kumar makinesi mantığı (değişken ödül) kullanılmaz.
3. **Kayıp korkusu yok.** "Serini kaybedeceksin!" gibi bildirimler yok.
   Seri bozulursa nazik bir yeniden başlangıç: "Schön, dass du wieder da bist."
4. **Suni aciliyet yok.** "Sadece 2 saat kaldı!" gibi geri sayımlar yok.
5. **Puanla para kazanma yok.** Puan nakde çevrilmez, satılmaz, devredilmez.
6. **İçerik okunmaz.** Puan hesabı sadece "tamamlandı" bilgisini kullanır.
   Journal, duygu ve Orakel içerikleri asla puan sistemine girmez.

## 1. Lichtpunkte (smile2go'nun puanı)

Uygulama içi eylemler puan getirir. Değerler `02-punkte-regeln.md`'de.

- **Günlük sınır:** 100 verdient Lichtpunkte / gün (Europe/Berlin).
  Sınıra gelince: "Für heute hast du alle Lichtpunkte gesammelt — morgen geht's weiter."
- **Eylem başına üst sınır:** kuralı olmayan eylem en fazla 20 puan.
- **Tekrar sınırı:** bazı eylemler günde 1 kez sayılır (örn. Energie-Check).
- Maliyeti smile2go taşır.

### Seri (Serie)

- Gün içinde en az 1 puanlı eylem = o gün "da".
- **Pause-Tag:** her takvim haftasında 1 gün eylemsiz geçse de seri bozulmaz.
- Bonus: 7 gün +50, 21 gün +100, 40 gün +200, 100 gün +500. (Bonuslar günlük
  sınıra sayılmaz.) 21 ve 40, uygulamadaki mevcut rozetlerle aynı.
- Seri bozulursa ceza yok, rozetler kalır, "längste Serie" görünmeye devam eder.

### Seviyeler (Stufen)

| Stufe | Toplam kazanılan puan | Açılanlar |
| --- | --- | --- |
| Samen | 0 | Temel içerik |
| Keimling | 500 | Ek meditasyonlar |
| Blüte | 2.000 | Topluluk challenge'ı önerme |
| Baum | 6.000 | Özel canlı yayınlar |
| Wald | 15.000 | "Wegbegleiterin" rozeti, yeni üyelere rehberlik |

Seviye **toplam kazanılan** puana göre hesaplanır. Harcamak seviyeyi düşürmez.
Mevcut kilometre taşları (120, 300, 500, 1.000, 5.000) bildirim olarak kalır.

### Rozetler (Abzeichen)

Uygulamadaki 22 rozet (`ABZEICHEN`, 5 grup) olduğu gibi kalır. Eklenecekler:
- **Challenge:** "Erste Challenge", "Drei Challenges", "Gemeinsam geschafft"
  (topluluk challenge'ı).
- **Konu rozetleri:** her konu sayfası için bir rozet (konudaki 3 egzersiz +
  meditasyon tamamlanınca). Örn. "Trauer · Ein Licht für dich".
- Rozetlerin hepsi haftalar içinde ulaşılabilir olmalı (mevcut kodun kuralı).

## 2. Challenge'lar

Her challenge puan + kendine özel bir ödül verir.

| | smile2go challenge'ı | Gold koç challenge'ı |
| --- | --- | --- |
| Kim açar | smile2go (Admin) | Gold paketteki koç, uzman, mentor |
| Puan | smile2go belirler | Koç seçer, en fazla 300 (öneri) |
| Ödül | Rozet, içerik kilidi, çekiliş hakkı, mağaza kuponu | Kurs indirimi, ücretsiz tanışma seansı, PDF, özel canlı yayın |
| Ödülü kim öder | smile2go | Koç |
| Onay | Gerekmez | smile2go yayından önce kontrol eder (04-coach-regeln.md) |

Türler: Serie (her gün), Ziel (süre içinde sayı), Gemeinschaft (birlikte hedef),
Thema (konu sayfasına bağlı), Programm (koçun kursuyla bağlantılı).
Örnekler: `03-challenge-katalog.md`.

Kurallar:
- Başlangıç/bitiş tarihi, koşul ve ödül açıkça yazılır.
- Aynı anda en fazla 3 aktif challenge.
- Tamamlanma uygulama verisinden otomatik ölçülür.
- Çıkış her an mümkün, ceza yok.
- Challenge puanları günlük 100 sınırına sayılmaz (challenge bitince tek seferlik).

## 3. Ekonomi — puan nerede harcanır, kim öder

Karar: bir kursun indirim maliyetini o kursu satan koç taşır.

**Öneri: iki bakiye**

| Bakiye | Nasıl kazanılır | Nerede harcanır | Maliyet |
| --- | --- | --- | --- |
| Lichtpunkte | Uygulama eylemleri, smile2go challenge'ları | smile2go mağazası, içerik kilitleri | smile2go |
| Coach-Lichtpunkte | Koçun kendi challenge'ları | Sadece o koçun kurs ve hizmetleri | Koç |

Teknik olarak tek tablo: `punkte_log.quelle` = `smile2go` veya `coach`,
`coach_id` dolu. (Adım 1'de alanlar zaten eklendi.)

**Koç indirimi:**
1. Koç her kurs için "Lichtpunkte akzeptiert" seçer.
2. Koç üst sınır koyar (örn. en fazla %20).
3. Puan değeri platformca sabit (taslak: 100 puan = 1 €).
4. Örnek: kurs 100 €, 1.000 Coach-Lichtpunkte → danışan 90 € öder, koçun geliri 90 € üzerinden.

**Mevcut mağaza ödülleri** (`BELOHNUNGEN`):
- "30 % Rabatt auf einen Kurs" (300 puan) → hangi koçun kursu? Koç kabul etmediyse
  uygulanamaz. Öneri: bu ödül, "Lichtpunkte akzeptiert" diyen kurslarla sınırlanır
  veya smile2go kendi kurslarında verir. (Karar: 10-entscheidungen.md)
- "10 € Shop-Gutschein" (500) ve "Exklusive Vollmond-Meditation" (1.000) kalır.

**Süre:** Puanlar 3 yıl geçerli, kazanıldığı yılın sonundan itibaren
(örn. 2026'da kazanılan → 31.12.2029'a kadar). Gerekçe: 06-recht.md.

## 4. Koç tarafı

- Koç sadece kendi challenge'ına katılanların ilerlemesini görür:
  tamamladı mı, yüzde kaç. İçerik görmez.
- Bunun için katılımcı challenge'a katılırken açık bir onay verir.
- Koç panelinde: challenge oluştur, katılımcı sayısı, tamamlama oranı, verilen ödüller.
