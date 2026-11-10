# AUFGABEN — Claude için devir notu

Bu dosya, Claude Code oturumunda devralınacak işleri tutar. Sohbet geçmişi
yok sayılarak yazıldı: buradaki her iş, hiçbir önceki konuşmayı bilmeyen bir
oturumun tek başına yapabileceği kadar ayrıntılı olmalı. Yeni iş eklerken
aynı disiplini koru.

Kullanıcıyla iletişim Türkçe, kod ve arayüz Almanca (bkz. `CLAUDE.md`).

---

## 0. Bu dalı `main`'e al  ·  BEKLİYOR  ·  öncelik: ilk

Dal: `claude/ajanlar-ve-proje-haritasi` (GitHub'a push edilmiş).
İçeriği: 230 ajan + `CLAUDE.md` + `AUFGABEN-claude.md` + `App.jsx.bak`
temizliği + `go` düzeltmesi. `App.jsx`'e dokunan kısmı sadece 2 satır.

Mac'te:

```bash
cd ~/Downloads/smile2go-projekt
git fetch origin claude/ajanlar-ve-proje-haritasi
git merge origin/claude/ajanlar-ve-proje-haritasi
ls .claude/agents | wc -l     # 230 yazmalı
```

Sonra `main`'e push. **Bu iş bitene kadar ajanlar ve `CLAUDE.md` hiçbir
oturumda yüklenmiyor** — birinci öncelik bu.

> Neden önemli: ajanlar Eylül 2026'da kuruldu ama birleştirilmedi. Araya
> giren 7 haftada `main`'e 37 commit atıldı, **37'si de Claude ile** — yani
> onlarca oturum ajansız ve proje haritasız koştu. Kurulum yapılıp rafta
> kalmasın.

---

## 1. App.jsx'i modüllere böl  ·  BEKLİYOR  ·  öncelik: yüksek

### Neden

`app/src/App.jsx` ~11.400 satır, 692 KB, 232 üst düzey tanım. Tamamını
okumak ~200.000 token. Bu dosyaya her dokunuşta (okuma, arama, düzenleme
doğrulaması) o maliyet ödeniyor; projede token'ın gittiği birinci yer burası.
Ayrıca tek dosyada 232 tanım, hangi bileşenin neye bağlı olduğunu görünmez
kılıyor.

### Durum — eski dalı BİRLEŞTİRME

Bu iş Eylül 2026'da bir kez yapıldı ve doğrulandı: dal
`claude/agency-agents-setup-ezcxn3`, commit `7ac48c7` — 9.572 satır → 525
satır + 23 modül, davranış birebir aynı. Ama `main`'e alınmadı; `main` o
sırada aynı dosyaya 30 commit daha attı ve iş bayatladı.

**O dalı birleştirmeye çalışma.** Git "başarılı" bir birleşim üretir ama
sonuç bozuk olur: `main`'in yeni bileşenleri (`Gemeinschaft`,
`CoachWerkstatt`, `Recherche`, `SessionArchiv`, karanlık ton…) `App.jsx`'te
kalırken aynı kodun kopyaları `screens/` altında durur. İş güncel `main`
üzerinde sıfırdan yapılacak; eski dal yalnızca referans olarak değerli.

### Yöntem — elle kesme YOK

Bu ölçekte elle kesmek güvenilmez. Kod AST'den span olarak alınıp aynen
taşınır, import'lar scope analiziyle hesaplanır. `@babel/parser` ve
`@babel/traverse` zaten `app/node_modules/` içinde (vite'ın react eklentisi
getiriyor), ek kurulum gerekmez.

**Adım 1 — bağımlılık grafiğini çıkar.** Regex kullanma: `Heute`,
`Dankbarkeit`, `Gemeinschaft` gibi bileşen adları aynı zamanda Almanca
arayüz metni olarak geçiyor; regex ikisini ayırt edemez, grafik yanlış çıkar
(bu hata bir kez yapıldı, in-degree sayıları şişti). Doğrusu: Babel ile
`Program` scope'unun `bindings`'ini al, her binding'in `referencePaths`'ini
hangi tanımın span'ına düştüğüne göre eşle. Bu yöntem gölgelemeyi (shadowing)
de doğru çözer, string ve JSXText içindeki kelimeleri saymaz.

**Adım 2 — modül planı kur.** Eylül'deki tablo şöyleydi, güncel kodda
doğrula: paylaşılan çekirdek çok küçük — `C`, `Card`, `Eyebrow`, `H`, `Btn`
50-80 yerde; geri kalan ekranlar birbirinden bağımsız. Katmanlama:

```
ui/tema.js        C (renk paleti)
ui/basis.jsx      Card Btn H Eyebrow Mikro TeilenBtn Hoerknopf Hoerspur
                  QRCode Absatz RechtSeite LogoMark NavIcon Dunkel
lib/zeit.js       dayIndex kalenderwoche mondphase wochenNummer
                  useSekundenTakt montagVon ...
lib/ki.js         askLuma + sistem promptları
                  (ILHO_SYSTEM ilho.js'te KALIR — oraya taşıma)
lib/wetter.js     open-meteo, wmoIcon
lib/farben.js     marka renk matematiği (yalnız Office kullanıyor)
daten/inhalte.js  MOTIVATION SPRUECHE AFFIRMATIONEN KURSE TRACKS BADGES
screens/*.jsx     ekran başına bir dosya
App.jsx           ROOTS TITLES IlhoApp (state ve yönlendirme)
```

Plan doğrulaması: her tanım **tam olarak bir** modüle atanmalı. Script
atanmayan veya çift atanan varsa durdurmalı.

**Adım 3 — üret.** Her tanım için `[leadingComments[0].start, node.end]`
aralığını kaynaktan aynen kes (yorumlar tanımla birlikte taşınsın), hedef
dosyaya sırayı koruyarak yaz, `export ` öneki ekle. Import'lar iki kaynaktan:
(a) orijinal `import` ifadelerinin binding'leri — hangi modülde
kullanılıyorsa oraya, yol derinliğe göre düzeltilerek (`./media` →
`../media`); (b) modüller arası tanım referansları.
**Kapsama kontrolü zorunlu:** her karakter tam bir span'a düşüyor mu,
boşluk dışında kapsanmayan kod var mı — varsa üretimi durdur.

**Adım 4 — döngü yok.** Bağımlılık tek yönlü olmalı: `screens → lib/ui/daten`.
Eylül'deki grafikte döngü yoktu; `main`'in yeni bileşenlerinde çıkabilir,
kontrol et.

### Doğrulama zinciri — dördü de geçmeden commit etme

1. **Build.** `cd app && npm run build` yeşil. Bundle boyutu bölme
   öncesiyle neredeyse aynı olmalı (Eylül'de 1.356,15 → 1.356,16 kB, 10
   bayt). Büyük sapma kod kaybettiğini veya çoğalttığını gösterir.
2. **Tanımsız referans taraması.** Bu adımı atlama — en kritik olan bu:
   eksik bir import'u esbuild global sanar, **derleme geçer**, uygulama
   çalışırken patlar. Her dosyayı Babel ile ayrıştır,
   `ReferencedIdentifier`'larda `scope.hasBinding(n, true)` false olanları
   listele; gerçek JS global'lerini (`window`, `Math`, `isFinite`, `fetch`,
   `localStorage`, …) ve küçük harfli JSX etiketlerini ayıkla. Bölme
   **sıfır** yeni tanımsız referans üretmeli. (Bölmeden önce bir kez koş,
   referans listesini al; sonra karşılaştır.)
3. **Önce/sonra A/B.** Orijinali ayrı worktree'ye al
   (`git worktree add <dizin> origin/main`), `node_modules`'ü symlink'le,
   iki ayrı portta `vite preview` ile servis et, Playwright ile üç yüzeyi
   (üye / `#coach` / `#admin`) karşılaştır: DOM düğüm sayısı ve sayfa metni
   **birebir aynı**, JS hata sayısı aynı olmalı. Chromium kurulu;
   `find /opt/pw-browsers -name chrome -type f` ile bul (sürüm klasörü
   değişiyor, yolu sabit yazma). `playwright` paketini projeye değil, geçici
   bir dizine kur — `package.json`'u kirletme.
4. **Sayım.** Tanım sayısı korunmuş mu, çift tanım var mı.

### Kurallar

- **Davranış nötr.** Bu iş kodu *taşır*, değiştirmez. Yolda bulduğun hatayı
  aynı commit'te düzeltme — ayrı commit, ayrı doğrulama.
- Bulduğun hataları bu dosyanın "Bulunan ama düzeltilmeyen" bölümüne yaz ve
  kullanıcıya söyle.
- **Uygulama canlıda** (`yedek-canli-2026-10-09` dalı var). Böyle bir
  refactor'ü kullanıcıya zamanlamasını sormadan `main`'e gönderme.
- İş büyük: tek oturumda bitmezse modülleri parça parça commit et, her
  parçada doğrulama zincirini koştur.

---

## 2. Token hijyeni — sürekli  ·  öncelik: düşük

Projede token'ın gittiği yerler, ölçülmüş hâliyle:

| Kaynak | Maliyet | Not |
|---|---|---|
| `App.jsx` tam okuma | ~200.000 token | İş 1 bunu çözüyor |
| 230 ajan açıklaması | ~14.700 token / oturum | Her oturumun sistem promptunda |
| `App.jsx.bak` | ~90.000 token | Çözüldü, silindi |

Ajan açıklamaları ajan başına ~55 token. Bölüm silmek beklendiği kadar
kazandırmıyor (49 ajan çıkarmak ~2.600 token kazandırdı). Azaltmak
gerekirse büyük bölümleri (`specialized` 59, `marketing` 36) hedefle;
yöntem `.claude/AGENTS-KURULUM.md` içinde.

`.gitignore`'da `*.bak` var — yeni yedek dosyası depoya girmesin.

---

## Bulunan ama düzeltilmeyen

(Şu an boş. Refactor sırasında rastlanan hatalar buraya yazılır,
düzeltilmeden — ayrı commit konusu.)

---

## Biten işler

- **`CoachDashboard`'daki `go` hatası** — 2026-11 düzeltildi. `go` prop
  olarak hiç geçilmiyordu; `disabled={!go}` yüzünden Frühwarnung düğmeleri
  kalıcı pasifti, `{go && …}` yüzünden ipucu metni ve `›` oku da
  görünmüyordu — yani "uyarıya tıklayınca eksiğin olduğu yere git"
  özelliği hiç çalışmamıştı. `IlhoApp` zaten `go`'ya sahipti, sadece
  bileşene geçirildi. Bileşen izole edilip Playwright ile iki durum yan yana
  doğrulandı. **Not:** `Fortschritt` aynı deseni doğru kullanıyor (`go`'yu
  alıyor) — oraya dokunmaya gerek yok.
- **Agency Agents kurulumu** — 230 ajan `.claude/agents/` altında, proje
  seviyesinde (kaynak: github.com/msitarzewski/agency-agents, MIT).
  Ayrıntı ve güncelleme komutu: `.claude/AGENTS-KURULUM.md`.
- **`App.jsx.bak` temizliği** — 364 KB ölü kod depodan çıkarıldı, her
  aramada iki sürüm karışıyordu. `*.bak` artık yoksayılıyor.
- **`CLAUDE.md`** — proje haritası. Kodu okuyarak çıkarıldı, tahminle değil.
  `App.jsx` büyüdükçe bölge listesi kayar; büyük değişiklikten sonra
  tazelenmeli.
