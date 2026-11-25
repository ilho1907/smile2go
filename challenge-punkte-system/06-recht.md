# 06 · Recht

Bu dosya hukuki danışmanlık değildir. Kaynaklarla desteklenen bir kontrol
listesidir. Yayından önce bir avukat (AGB, Gewinnspiel) ve bir Steuerberater
(KDV, koç hesapları) kontrol etmeli.

## 1. Puanların süresi (Verfall) — konsept değişti

İlk taslakta "12 ay hareketsizlikte sona erer" yazıyordu. **Bu riskli.**

- Almanya'da AGB'deki kısa süre sonu maddeleri mahkemelerde düştü:
  - BGH, 28.01.2010, Xa ZR 37/09: fesihten 6 ay sonra bonus puanların
    geçersiz olması müşteriyi uygunsuz şekilde dezavantajlı bırakıyor → geçersiz.
  - OLG München, 17.01.2008, 29 U 3193/07: hediye çekini 1 yılla sınırlayan
    AGB maddeleri geçersiz.
- Madde geçersizse yerine genel zamanaşımı gelir: 3 yıl (§ 195 BGB), yılın
  sonundan itibaren (§ 199 BGB). BGH, 04.05.2017, I ZR 113/16 (Reisewerte):
  zamanaşımı, hakkın doğduğu yılın sonunda başlar.
- Fark: o davalarda puan veya çek **satın alma karşılığı** idi. Lichtpunkte
  ücretsiz, aktiviteyle kazanılıyor. Bu daha fazla serbestlik verebilir —
  ama emin değiliz.

**Karar (öneri):** 3 yıl, kazanıldığı yılın sonundan itibaren (Payback gibi
programlarla aynı mantık). Coach-Lichtpunkte için de aynı. Hesap silinince
ne olacağı (AGB madde 7) avukata sorulacak.

## 2. Çekilişler (Verlosung / Gewinnspiel)

- Ücretsiz katılım = izinli Gewinnspiel. Katılım için para veya **parasal
  değeri olan bir şey** istenirse ve kazanan rastgele seçilirse → Glücksspiel
  (GlüStV 2021), izin gerekir, § 284 StGB ceza riski.
- Lichtpunkte'nin € karşılığı olacak (100 = 1 € taslağı). Bu yüzden
  **çekilişe katılım için puan harcatılmaz.** Challenge'ı tamamlamak katılım
  hakkı verebilir (bedava katılım yolu), puan düşmez.
- Teilnahmebedingungen şart (05-texte.md), veri koruma bilgisi şart,
  katılım reklam onayına bağlanmaz (§ 7 UWG).

## 3. Dark Patterns

- **DSA Art. 25:** online platformlar, kullanıcıyı aldatan veya manipüle eden
  arayüz tasarlayamaz. Topluluk ve koç içerikleri olan smile2go büyük ihtimalle
  "online platform" sayılır.
- Art. 25(2): UGP-Richtlinie (Almanya'da UWG) veya DSGVO'nun kapsadığı
  uygulamalarda o kurallar geçerli. Yani tüketiciye yönelik baskı tasarımı
  zaten UWG ile yasak.
- Sonuç: 01-konzept.md'deki "kesin hayır"lar (kayıp korkusu, suni aciliyet,
  rastgele bonus, sıralama tablosu) hem etik hem hukuki gereklilik.
- Takip: AB "Digital Fairness Act" taslağı bağımlılık yapan tasarımı
  (addictive design) hedefliyor; yürürlüğe girerse tekrar kontrol.

## 4. DSGVO

- Meditasyon, journal ve duygu verileri sağlık verisi sayılabilir (Art. 9).
  Puan sistemi bu içerikleri **okumaz**; `punkte_log` sadece eylem adı + puan
  tutar. (Adım 1'de böyle kuruldu.)
- Koç ilerleme görür → ayrı, açık, geri alınabilir onay (05-texte.md).
- `punkte_log` "Meine Daten exportieren" (`meine_daten_export`) içine girmeli
  ve hesap silinince silinmeli (`ON DELETE CASCADE` var).

## 5. Vergi ve sözleşme

- Koç puanla indirim verirse geliri indirimli fiyat üzerinden olur. KDV'nin
  indirimli fiyattan mı hesaplanacağı ve Kleinunternehmer koçlar için durum
  → Steuerberater.
- 10 € Shop-Gutschein gibi smile2go ödülleri: muhasebede nasıl gösterileceği
  → Steuerberater.
- Koç sözleşmesine: ödül ve indirim maliyetini koç taşır, ödül 14 gün içinde
  verilir, koç ayrılırsa ne olur.

## Kaynaklar

| Konu | Kaynak |
| --- | --- |
| Bonus puan süresi | [BGH Xa ZR 37/09 (28.01.2010)](https://rewis.io/urteile/urteil/c3k-27-01-2010-xa-zr-3709/) |
| Hediye çeki 1 yıl | [OLG München 29 U 3193/07 (dejure)](https://dejure.org/2008,590) |
| Zamanaşımı başlangıcı | [BGH I ZR 113/16 (04.05.2017)](https://www.anwalt24.de/urteile/bgh/2017-05-04/i-zr-113_16) |
| Çekiliş ücretsiz olmalı | [IHK Osnabrück – Preisausschreiben und Gewinnspiele](https://www.ihk.de/osnabrueck/recht-und-fair-play/wettbewerb/preisausschreiben-und-gewinnspiele-1074366) |
| Gewinnspiel vs. Glücksspiel | [IHK Nord Westfalen](https://www.ihk.de/nordwestfalen/recht/rechtsthemen/wettbewerbsrecht/gewinnspiele-verlosung-und-preisausschreiben-3655140) |
| DSA Art. 25 metni | [springlex – DSA Art. 25 (DE)](https://www.springlex.eu/de/packages/dsa/dsa-regulation/article-25/) |
| DSA Art. 25 ve UGP ilişkisi | [Pinsent Masons](https://www.pinsentmasons.com/out-law/analysis/dark-patterns-digital-regulation-consumer-law) |
| Digital Fairness Act | [Osborne Clarke](https://www.osborneclarke.com/de/insights/digital-fairness-act-unpacked-dark-patterns) |

Not: Kararların özetleri arama sonuçlarından ve özetlerden alındı; tam metinler
okunmadı. Avukat kontrolü bu yüzden şart.
