# 02 · Punkte-Regeln

Uygulamada `addPunkte(n, label)` **52 yerde** (51 farklı etiket) çağrılıyor (24.11.2026, `App.jsx` +
`MantraRaum.jsx`). Sunucu, gelen `label`'ı `punkte_regeln.aktion` ile eşleştirir.
Kuralı olan eylemde puanı **sunucu** belirler; kuralı olmayan eylem en fazla
20 puan alır.

**Dikkat — Adım 1 ile gelen davranış değişikliği:** 3 eylem şu an 20'den fazla
puan veriyor (Ziel erreicht 50, Me-Time gehalten 30, Stille-Meilenstein 30);
Dankbarkeits-Challenge da 11. günden sonra 20'yi geçiyor. Aşağıdaki SQL
çalıştırılmazsa bunlar 20'ye düşer. Bu yüzden SQL, migration ile **aynı gün**
çalıştırılmalı.

**4 etiket değişken** (içinde gün sayısı, isim vb. var). Bunlar sunucuda her
seferinde farklı eylem gibi görünür ve günlük tekrar sınırı işlemez. Adım 2'de
kodda sabit bir anahtara çevrilmeli (aşağıdaki ikinci tablo).

Sütunlar: **jetzt** = koddaki değer · **neu** = öneri · **max/Tag** = günde en
fazla kaç kez sayılır. Kalın = değişiklik önerisi.

| Gruppe | Aktion (label) | jetzt | neu | max/Tag | Not |
| --- | --- | --- | --- | --- | --- |
| Täglich | Energie-Check | 3 | **5** | 1 |  |
| Täglich | Horoskop gelesen | 3 | 3 | 1 |  |
| Täglich | Tageskarte gezogen | 5 | 5 | 1 |  |
| Täglich | Wochen-Orakel | 5 | 5 | 1 | haftada 1 de olabilir |
| Täglich | Mantra-Moment | 3 | 3 | 3 | MantraRaum.jsx |
| Schreiben | Tagebuch-Eintrag | 10 | 10 | 3 |  |
| Schreiben | Orakel-Reflexion | 10 | 10 | 2 |  |
| Schreiben | Zukunftsbrief geschrieben | 10 | 10 | 1 |  |
| Schreiben | Zukunftsbrief per Post | 20 | 20 | 1 |  |
| Schreiben | Wöchentlicher Check-in | 10 | 10 | 1 |  |
| Ankommen | Dankbarkeit notiert | 10 | 10 | 1 |  |
| Ankommen | Losgelassen | 10 | 10 | 2 | 2 yerde: 10 ve 2 puan — tek değer 10 olmalı |
| Ankommen | Ritual genährt | 2 | 2 | 7 |  |
| Ankommen | Meditation abgeschlossen | 5 | **10** | 3 | konsept: 10 |
| Ankommen | Achtsamkeit geübt | 5 | 5 | 3 |  |
| Ankommen | Qigong geübt | 10 | 10 | 2 |  |
| Ankommen | Neumond-Intention | 10 | 10 | 1 |  |
| Ankommen | Vollmond-Loslassen | 10 | 10 | 1 |  |
| Ankommen | Intuitions-Treffer | 3 | 3 | 5 |  |
| Ankommen | Dein Licht brennt mit | 3 | 3 | 1 |  |
| Ankommen | Du hast dich gehalten | 8 | 8 | 1 |  |
| Ankommen | Stille-Meilenstein | 30 | 30 | 1 | 20'den büyük: kural şart |
| Ankommen | Fülle | 5 | 5 | 1 | MoneyMind |
| Wege | Aufgaben-Karte | 5 | 5 | 1 | 369 |
| Wege | Archetyp entdeckt | 15 | 15 | 1 |  |
| Wege | Fragebogen ausgefüllt | 15 | 15 | 1 |  |
| Ziele | Neues Ziel gesetzt | 15 | 15 | 2 |  |
| Ziele | Ziel-Rückblick | 10 | 10 | 1 |  |
| Ziele | Aufgabe erledigt | 10 | 10 | 5 |  |
| Ziele | Meilenstein erreicht | 20 | 20 | 3 |  |
| Ziele | Ziel erreicht 🎉 | 50 | 50 | 2 | 20'den büyük: kural şart |
| Me-Time | Me-Time eingetragen | 15 | 15 | 1 |  |
| Me-Time | Me-Time gehalten | 30 | 30 | 1 | 20'den büyük: kural şart |
| Kurse | Modul abgeschlossen | 5 | **10** | 3 |  |
| Kurse | Paket angefragt | 5 | 5 | 1 |  |
| Medien | Podcast gehört | 4 | 4 | 3 |  |
| Medien | Wochenbild angesehen | 15 | **5** | 1 | bakmak için 15 fazla — öneri 5 |
| Gemeinschaft | Community-Beitrag | 5 | **10** | 2 | konsept: 10, günde 2 |
| Gemeinschaft | Freundin eingeladen | 5 | 5 | 3 | ileride: davet edilen kaydolunca 100 |
| Gemeinschaft | Gemeinsames Thema gesetzt | 5 | 5 | 1 |  |
| Gemeinschaft | Kreis-Tag geschafft | 8 | 8 | 1 |  |
| Coach-Werkzeuge | Inhalt archiviert | 10 | 10 | 3 | koç araçları |
| Coach-Werkzeuge | Coach-Werkstatt | 5 | 5 | 3 |  |
| Coach-Werkzeuge | Recherche | 5 | 5 | 3 |  |
| Coach-Werkzeuge | Session-Notiz erstellt | 15 | 15 | 3 |  |
| Coach-Werkzeuge | Methoden-Dossier erstellt | 20 | 20 | 1 |  |
| Coach-Werkzeuge | Marke erstellt | 10 | 10 | 1 | Office |

### Değişken etiketler → sabit anahtar (Adım 2'de kodda)

| Koddaki etiket | jetzt | Yeni sabit anahtar | neu | max/Tag | Not |
| --- | --- | --- | --- | --- | --- |
| `Tag ${tag}: ${tag} Dankbarkeiten` | 10 + tag | Dankbarkeits-Challenge | 15 | 1 | etiket her gün değişiyor |
| `Reise „${r.t}“ gestartet` | 10 | Reise gestartet | 10 | 1 |  |
| `${n} gefeiert` | 15 | Jahreskreis gefeiert | 15 | 1 |  |
| `${typ} erstellt` | 8 | Office-Element erstellt | 8 | 5 |  |

Toast'ta yine kişisel metin görünebilir (örn. "Tag 5: 5 Dankbarkeiten"); sadece
sunucuya giden anahtar sabit olur. Bunun için `addPunkte(n, label, aktion?)`
şeklinde üçüncü parametre eklenir.

## SQL — kuralları yükle

Migration `20261124_lichtpunkte.sql` çalıştıktan sonra, Supabase SQL Editor'da:

```sql
INSERT INTO punkte_regeln (aktion, punkte, max_pro_tag) VALUES
  ('Energie-Check', 5, 1),
  ('Horoskop gelesen', 3, 1),
  ('Tageskarte gezogen', 5, 1),
  ('Wochen-Orakel', 5, 1),
  ('Mantra-Moment', 3, 3),
  ('Tagebuch-Eintrag', 10, 3),
  ('Orakel-Reflexion', 10, 2),
  ('Zukunftsbrief geschrieben', 10, 1),
  ('Zukunftsbrief per Post', 20, 1),
  ('Wöchentlicher Check-in', 10, 1),
  ('Dankbarkeit notiert', 10, 1),
  ('Losgelassen', 10, 2),
  ('Ritual genährt', 2, 7),
  ('Meditation abgeschlossen', 10, 3),
  ('Achtsamkeit geübt', 5, 3),
  ('Qigong geübt', 10, 2),
  ('Neumond-Intention', 10, 1),
  ('Vollmond-Loslassen', 10, 1),
  ('Intuitions-Treffer', 3, 5),
  ('Dein Licht brennt mit', 3, 1),
  ('Du hast dich gehalten', 8, 1),
  ('Stille-Meilenstein', 30, 1),
  ('Fülle', 5, 1),
  ('Aufgaben-Karte', 5, 1),
  ('Archetyp entdeckt', 15, 1),
  ('Fragebogen ausgefüllt', 15, 1),
  ('Neues Ziel gesetzt', 15, 2),
  ('Ziel-Rückblick', 10, 1),
  ('Aufgabe erledigt', 10, 5),
  ('Meilenstein erreicht', 20, 3),
  ('Ziel erreicht 🎉', 50, 2),
  ('Me-Time eingetragen', 15, 1),
  ('Me-Time gehalten', 30, 1),
  ('Modul abgeschlossen', 10, 3),
  ('Paket angefragt', 5, 1),
  ('Podcast gehört', 4, 3),
  ('Wochenbild angesehen', 5, 1),
  ('Community-Beitrag', 10, 2),
  ('Freundin eingeladen', 5, 3),
  ('Gemeinsames Thema gesetzt', 5, 1),
  ('Kreis-Tag geschafft', 8, 1),
  ('Inhalt archiviert', 10, 3),
  ('Coach-Werkstatt', 5, 3),
  ('Recherche', 5, 3),
  ('Session-Notiz erstellt', 15, 3),
  ('Methoden-Dossier erstellt', 20, 1),
  ('Marke erstellt', 10, 1),
  ('Dankbarkeits-Challenge', 15, 1),
  ('Reise gestartet', 10, 1),
  ('Jahreskreis gefeiert', 15, 1),
  ('Office-Element erstellt', 8, 5)
ON CONFLICT (aktion) DO UPDATE
  SET punkte = EXCLUDED.punkte, max_pro_tag = EXCLUDED.max_pro_tag, geaendert_am = now();
```

Değerler sonradan Admin'den (veya SQL ile) değiştirilebilir; kod değişmez.
