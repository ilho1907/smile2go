# Challenge & Lichtpunkte System — smile2go

Bu klasör, smile2go'nun puan (Lichtpunkte), challenge ve ödül sisteminin tek
kaynağıdır. Kod değil; konsept, kurallar, metinler ve uygulama planı.
Kullanıcıyla iletişim Türkçe; uygulamada görünen metinler Almanca (Du-Form).

Durum: **25.11.2026** · Adım 1 (veri katmanı) PR #34'te, onay bekliyor.

| Dosya | İçerik |
| --- | --- |
| [01-konzept.md](01-konzept.md) | Amaç, ilkeler, puanlar, seviyeler, rozetler, challenge'lar, ekonomi |
| [02-punkte-regeln.md](02-punkte-regeln.md) | Uygulamadaki 52 puan noktasının (51 etiket) tablosu + `punkte_regeln` için SQL |
| [03-challenge-katalog.md](03-challenge-katalog.md) | Başlangıç challenge'ları: genel + 10 konu sayfası |
| [04-coach-regeln.md](04-coach-regeln.md) | Gold koçlar için challenge kuralları ve onay listesi |
| [05-texte.md](05-texte.md) | Üyeye görünen Almanca metinler, AGB ve çekiliş koşulları taslağı |
| [06-recht.md](06-recht.md) | Hukuk notları (puanların süresi, çekiliş, Dark Patterns, DSGVO, vergi) |
| [07-messung.md](07-messung.md) | Başarı ölçütleri — sistemin işe yarayıp yaramadığını nasıl anlarız |
| [08-umsetzung.md](08-umsetzung.md) | 5 adımlık plan + her adım için Claude Code promptu |
| [09-quellen.md](09-quellen.md) | Bilimsel ve hukuki kaynaklar, hangisinin tam okunduğu |
| [10-entscheidungen.md](10-entscheidungen.md) | Alınan kararlar ve ilho'nun vermesi gereken açık kararlar |

Bağlantılar:
- Konsept (Claude Docs, ilk sürüm): https://claude.ai/artifact/G1eMpH4nrjvEbWbxiWd6MV
- Migration: `backend/supabase/migrations/20261124_lichtpunkte.sql`
- Devir notu: `AUFGABEN-claude.md` → "Lichtpunkte & Challenges"

Kural: Bu klasördeki bir karar değişirse önce `10-entscheidungen.md`
güncellenir, sonra ilgili dosya.
