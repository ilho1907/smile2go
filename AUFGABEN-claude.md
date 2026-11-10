# AUFGABEN — Claude için bekleyen iş

Bu dosya, Claude Code oturumunda devralınacak işleri tutar. Kullanıcıyla
iletişim Türkçe, kod/arayüz Almanca (bkz. `CLAUDE.md`).

---

## 1. App.jsx'i modüllere böl  ·  BEKLİYOR  ·  öncelik: yüksek

### Neden

`app/src/App.jsx` ~11.400 satır, 692 KB, 232 üst düzey tanım. Tamamını
okumak ~200.000 token. Bu dosyaya her dokunuşta (okuma, arama, düzenleme
doğrulaması) o maliyet ödeniyor; projede token'ın gittiği birinci yer burası.
Ayrıca tek dosyada 232 tanım, hangi bileşenin nereye bağlı olduğunu
görünmez kılıyor.

### Durum

Bu iş Eylül 2026'da bir kez yapıldı ve doğrulandı (dal:
`claude/agency-agents-setup-ezcxn3`, commit `7ac48c7`): 9.572 satır → 525
satır + 23 modül, davranış birebir aynı. Ama `main`'e birleştirilmedi, o
sırada `main` 7 hafta boyunca aynı dosyaya 30 commit daha attı ve iş bayatladı.
**O dalı birleştirmeye çalışma** — git "başarılı" bir birleşim üretir ama
sonuç bozuk olur: main'in yeni bileşenleri `App.jsx`'te kalırken aynı kodun
kopyaları `screens/` altında durur. İş, güncel `main` üzerinde sıfırdan
yapılacak. Eski dal yalnızca referans.

### Yöntem — elle kesme YOK

Elle kesmek bu ölçekte güvenilmez. Kod, AST'den span olarak alınıp aynen
taşınır; import'lar scope analiziyle hesaplanır. `@babel/parser` ve
`@babel/traverse` zaten `app/node_modules/` içinde (vite'ın react eklentisi
getiriyor), ek kurulum gerekmez.

**Adım 1 — bağımlılık grafiğini çıkar.** Regex kullanma: `Heute`,
`Dankbarkeit`, `Gemeinschaft` gibi bileşen adları aynı zamanda Almanca
arayüz metni olarak geçiyor, regex ikisini ayırt edemez ve grafik yanlış
çıkar. Babel ile `Program` scope'unun `bindings`'ini al, her binding'in
`referencePaths`'ini hangi tanımın span'ına düştüğüne göre eşle.

**Adım 2 — modül planı kur.** Beklenen tablo (Eylül'de böyleydi, doğrula):
paylaşılan çekirdek çok küçük — `C`, `Card`, `Eyebrow`, `H`, `Btn` ~50-80
yerde; geri kalan ekranlar birbirinden bağımsız. Katmanlama:

```
ui/tema.js        C (renk paleti)
ui/basis.jsx      Card Btn H Eyebrow Mikro TeilenBtn Hoerknopf Hoerspur
                  QRCode Absatz RechtSeite LogoMark NavIcon Dunkel
lib/zeit.js       dayIndex kalenderwoche mondphase wochenNummer
                  useSekundenTakt montagVon ...
lib/ki.js         askLuma + sistem promptları  (ILHO_SYSTEM ilho.js'te KALIR)
lib/wetter.js     open-meteo, wmoIcon
lib/farben.js     marka renk matematiği (yalnız Office kullanıyor)
daten/inhalte.js  MOTIVATION SPRUECHE AFFIRMATIONEN KURSE TRACKS BADGES
screens/*.jsx     ekran başına bir dosya
App.jsx           ROOTS TITLES IlhoApp (state ve yönlendirme)
```

Plan doğrulaması: her tanım **tam olarak bir** modüle atanmalı. Script
atanmayan/çift atanan varsa bağırsın.

**Adım 3 — üret.** Her tanım için `[leadingComments[0].start, node.end]`
aralığını kaynaktan aynen kes (yorumlar tanımla birlikte taşınsın), hedef
dosyaya sırayı koruyarak yaz, `export ` öneki ekle. Import'lar iki
kaynaktan: (a) orijinal `import` ifadelerinin binding'leri — hangi modülde
kullanılıyorsa oraya, yol derinliğe göre düzeltilerek (`./media` →
`../media`); (b) modüller arası tanım referansları. **Kapsama kontrolü
zorunlu:** her karakter tam bir span'a düşüyor mu, boşluk dışında kapsanmayan
kod var mı — varsa üretimi durdur.

**Adım 4 — döngü yok.** Bağımlılık tek yönlü olmalı: `screens → lib/ui/daten`.
Eylül'deki grafikte döngü yoktu; `main`'in yeni bileşenlerinde çıkabilir,
kontrol et.

### Doğrulama zinciri — dördü de geçmeden commit etme

1. `cd app && npm run build` yeşil. Bundle boyutu bölme öncesiyle
   **neredeyse aynı** olmalı (Eylül'de 1.356,15 → 1.356,16 kB, 10 bayt).
   Büyük sapma kod kaybettiğini/çoğalttığını gösterir.
2. **Tanımsız referans taraması.** Bu adımı atlama: eksik bir import'u
   esbuild global sanar, derleme geçer, uygulama çalışırken patlar. Her
   dosyayı Babel ile ayrıştır, `ReferencedIdentifier`'larda
   `scope.hasBinding(n, true)` false olanları listele, gerçek JS global'leri
   (`window`, `Math`, `isFinite`, …) ve küçük harfli JSX etiketlerini ayıkla.
   Bölme **sıfır** yeni tanımsız referans üretmeli.
3. **Önce/sonra A/B.** Orijinali ayrı bir worktree'ye al
   (`git worktree add <dizin> origin/main`), `node_modules`'ü symlink'le, iki
   ayrı portta `vite preview` ile servis et, Playwright ile üç yüzeyi
   (üye / `#coach` / `#admin`) karşılaştır: DOM düğüm sayısı ve sayfa metni
   **birebir aynı**, JS hata sayısı aynı olmalı. Chromium kurulu:
   `/opt/pw-browsers/` altında ara (`find /opt/pw-browsers -name chrome -type f`),
   `playwright` paketini proje dışına, geçici bir dizine kur.
4. **Sayım.** Tanım sayısı korunmuş mu, çift tanım var mı.

### Kurallar

- **Davranış nötr.** Bu iş kodu *taşır*, değiştirmez. Yolda bulduğun hatayı
  aynı commit'te düzeltme — ayrı commit, ayrı doğrulama.
- Bulduğun hataları bu dosyanın altına yaz, kullanıcıya söyle.
- Uygulama canlıda olabilir (`yedek-canli-2026-10-09` dalı var). Böyle bir
  refactor'ü kullanıcıya zamanlamasını sormadan `main`'e göndermeyin.
- İş büyük: tek oturumda bitmezse modülleri parça parça commit et, her
  parçada doğrulama zincirini koştur.

---

## Biten işler

- **`CoachDashboard`'daki `go` hatası** — 2026-11, bu dalda düzeltildi.
  `go` prop olarak hiç geçilmiyordu; `disabled={!go}` yüzünden Frühwarnung
  düğmeleri kalıcı pasifti, `{go && …}` yüzünden ipucu metni ve `›` oku da
  görünmüyordu. `IlhoApp` zaten `go`'ya sahipti. Bileşen izole edilip
  Playwright ile iki durum yan yana doğrulandı. **Not:** `Fortschritt` aynı
  deseni doğru kullanıyor (`go`'yu alıyor) — oraya dokunmaya gerek yok.
- **Agency Agents kurulumu** — 230 ajan `.claude/agents/` altında, proje
  seviyesinde. Ayrıntı: `.claude/AGENTS-KURULUM.md`.
- **`App.jsx.bak` temizliği** — 364 KB ölü kod depodan çıkarıldı, `*.bak`
  yoksayılıyor.
