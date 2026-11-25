# 07 · Messung — işe yarıyor mu?

Puan sistemi bir araç. İşe yarayıp yaramadığını şu ölçütlerle anlarız.
Hepsi `punkte_log`, `challenge_teilnahmen` ve mevcut `app_events`
tablolarından hesaplanır; içerik okunmaz.

## Ana ölçütler

| Ölçüt | Tanım | Neden |
| --- | --- | --- |
| D7 / D30 tutma | Kayıttan 7 / 30 gün sonra en az 1 eylem yapan oran | Uygulamalarda en büyük sorun hızlı bırakma (Wu 2021) |
| Aktif gün / hafta | Bir üyenin haftada eylem yaptığı gün sayısı (ortanca) | Düzenli kullanım |
| Challenge tamamlama | Başlayanlardan bitirenlerin oranı, türe göre | Hangi challenge türü işe yarıyor |
| Erken çıkış | İlk 3 günde çıkanların oranı | Çok zor / uygun olmayan challenge'ı bulur |
| Günlük sınıra ulaşma | Günde 100'e ulaşan üye oranı | %5'i geçerse sınır veya değerler gözden geçirilir |
| Einlösung | Kazanılan puanın harcanan oranı, ödül türüne göre | Ödüller çekici mi |
| Koç indirimi | Puanla yapılan kurs satışı, koç başına | Koç için değer |

## Sağlık ve güven işaretleri

| İşaret | Ne yapılır |
| --- | --- |
| Gece 0–5 arası sık eylem | Ürün kararı değil, sadece toplam istatistik. Bildirim saatleri gözden geçirilir. |
| Bir üye günlerce sınırda | Kötüye kullanım mı, bağımlılık mı? Tek kişiyi izleme yok; kuralları gözden geçir. |
| Puan için "boş" eylem (örn. 1 sn meditasyon) | Eylemin "tamamlandı" ölçütünü sıkılaştır (örn. %80 dinleme). |
| Destek / şikâyet | "Baskı hissettim" türü geri bildirim → ilgili mekanizma kaldırılır. |

## Ne zaman bakılır

- Adım 2 canlıya çıktıktan 4 hafta sonra ilk değerlendirme.
- Sonra aylık, Admin → "Übersicht" sekmesinde bir kart (Adım 5'ten sonra).

## Basit A/B fikri (isteğe bağlı)

Yeni üyelerin yarısına seviye + challenge, yarısına sadece rozet göster;
8 hafta sonra D30 tutma karşılaştırılır. Bunun için üyelere gizlilik
metninde bilgi verilmeli.
