# ilhova agent – Pilot (Claude Managed Agents)

smile2go'nun dışarıdan bir servis gibi kullanacağı bağımsız KI motoru. Her klient (kadın danışan) için
kişisel bir asistan: randevu hatırlatır ve **yalnızca klient izin verdiyse** belirli verileri koçuna aktarır.
Agent klientle **Almanca** konuşur (sıcak, kısa, spiritüel koçluk tonu).

> ⚠️ **Beta:** Managed Agents beta API'sidir (`managed-agents-2026-04-01`, SDK header'ı otomatik ekler).
> Kod içinde beta'ya özgü yerler `// BETA:` ile işaretli: `grep -rn "BETA" src scripts`.

## Mimari

```
smile2go (Vercel) ──POST /chat──▶ src/server.ts ──▶ src/session.ts ──▶ Anthropic Managed Agents
 {client_id, message}  x-api-key      │                │   (agent + session, event stream)
                                      │                └─ agent.custom_tool_use ─▶ src/tools/handlers.ts
                                      │                                               │
                                      └─ src/sessionStore.ts (client_id → session_id)  └─▶ DataLayer (src/data/types.ts)
                                                                                           └─ şimdilik: mock.ts
```

- Agent **yalnızca 3 custom tool** kullanır, yerleşik `bash`/`web` yok → minimum saldırı yüzeyi.
- Tool'lar **bizim sürecimizde** çalışır (Anthropic sandbox'ında değil). Environment'ta ağ erişimi kapalıdır (`limited`, host yok).
- Onay (consent) kontrolü **sunucu tarafında** `share_with_coach` handler'ındadır; prompt'a güvenilmez.
- Handler her çağrıda `client_id`'nin session'ın klientine ait olduğunu doğrular (model başka bir `client_id` uyduramaz).

## Dosya yapısı

```
prompts/ilho.md              system prompt (kolayca düzenlenir)
config/agent.json            setup tarafından yazılır: environment_id, agent_id, versiyon
scripts/setup.ts             environment + agent'ı BİR KEZ oluşturur
scripts/update-agent.ts      yeni agent versiyonu (prompt/tool/model değişince)
scripts/agent-versions.ts    versiyon listesi
scripts/agent-pin.ts         yeni session'ların kullanacağı versiyonu seç (geri alma)
scripts/test-handlers.ts     offline birim testi (API anahtarı gerekmez)
scripts/test-loop-offline.ts SİMÜLE event-loop testi (sahte sunucu, anahtar gerekmez)
scripts/test-session.ts      CANLI uçtan uca test (gerçek API, para harcar)
scripts/delete-session.ts    bir klientin session'ını (transkript) Anthropic'te siler
src/data/types.ts            DataLayer arayüzü  ← Supabase/smile2go API buraya bağlanacak
src/data/mock.ts             sahte veri katmanı (yalnızca uydurma veri)
src/tools/                   tool tanımları (JSON Schema) + handler'lar
src/session.ts               session aç/devam et, event stream, tool sonuçları, maliyet logu
src/server.ts                HTTP API
```

## Kurulum

Gereksinim: Node ≥ 20.

```bash
cd ilhova-agent
npm install
cp .env.example .env      # .env git'e girmez (.gitignore)
```

`.env` içine yaz:

| Değişken | Açıklama |
|---|---|
| `ANTHROPIC_API_KEY` | Yalnızca `.env`'den okunur (Shell'de tanımlı bir değişken bilerek **yok sayılır**). |
| `ILHOVA_SERVICE_KEY` | smile2go'nun `x-api-key` header'ında göndereceği ortak anahtar. Üret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT`, `HOST` | Varsayılan `8787` / `127.0.0.1` |
| `TURN_TIMEOUT_SECONDS` | Bir sohbet turu için üst süre (varsayılan 120) |
| `CLIENT_TIMEZONE` | Hatırlatma saatleri için saat dilimi (varsayılan `Europe/Berlin`) |

## Setup (bir kez)

```bash
npm run setup
```

Environment ve agent oluşturulur; ID'ler ve versiyon `config/agent.json`'a yazılır (içinde sır yok, commit edilebilir).
Dosya zaten varsa setup **çalışmayı reddeder** (ikinci agent oluşmasın diye). Model: `claude-opus-5-5`;
daha ucuz seçenekler (`claude-sonnet-5-5`, `claude-haiku-5-5`) `src/agent/definition.ts` içinde yorum olarak durur.

## Çalıştırma

```bash
npm run serve
```

```bash
curl -s localhost:8787/chat \
  -H "x-api-key: $ILHOVA_SERVICE_KEY" -H "content-type: application/json" \
  -d '{"client_id":"mock-client-001","message":"Wann ist mein nächster Termin?"}'
# → {"reply":"…","session_id":"sesn_…","usage":{"input_tokens":…,"output_tokens":…,"estimated_cost_usd":0.01}}
```

- `POST /chat` `{client_id, message}` → `{reply, session_id, usage}`. `client_id`: `A–Z a–z 0–9 _ -`, en çok 64 karakter; `message` en çok 4000 karakter.
- Hatalar: `401` yanlış anahtar, `400` geçersiz girdi, `429` rate limit, `504` zaman aşımı, `500` diğer.
- `GET /health`.
- Aynı klient için istekler sıraya alınır (aynı anda tek tur).
- **smile2go entegrasyonu:** `ILHOVA_SERVICE_KEY`'i yalnızca smile2go'nun **sunucu tarafında** (Vercel env / API route) sakla, tarayıcıya asla verme.
  Servisi TLS arkasında (reverse proxy) ayrı bir Node host'ta çalıştır; uzun süren event stream için klasik serverless fonksiyon uygun değildir.

> Mock veri katmanı **bellekte** çalışır: sunucu yeniden başlayınca hatırlatmalar/paylaşımlar kaybolur. Pilot içindir.
> Bilinen klient: `mock-client-001` (goals + appointments için izin var; journal + mood için yok).

## Testler

```bash
npm run typecheck        # TypeScript
npm run test:unit        # handler/mock/maliyet – offline, anahtar gerekmez
npm run test:loop        # SİMÜLE event-loop testi (sahte sunucu). Sadece bizim kodu doğrular, modeli/gerçek API'yi DEĞİL.
npm run test:session     # CANLI uçtan uca test: gerçek API, birkaç cent maliyet
npm run test:session -- --cleanup   # …ve test session'ını sonunda sil
```

`test:session` senaryosu (uydurma klient, tek session içinde 4 tur):
1. Randevu hatırlatma → `get_client_context` + `schedule_reminder`
2. **İzinsiz** paylaşım → `share_with_coach` `consent_required` döner, hiçbir şey kaydedilmez, agent izin ister
3. **İzinli** paylaşım (goals) → başarılı
4. İzin "uygulamada verilir" (mock `grantConsent`) → aynı paylaşım tekrar denenir, başarılı

Sert kontroller başarısız olursa çıkış kodu 1'dir; "weiche" (yumuşak) kontroller (dil, ton, saat 09:00) sadece uyarı verir.
Agent'ın kendi başına izin vermesi **mümkün değil**: izni uygulama arayüzü kaydeder, agent'ın böyle bir tool'u yoktur.

## Prompt'u düzenleme

1. `prompts/ilho.md`'yi düzenle (ilk `## ` başlığının üstündeki kısım agent'a **gönderilmez**).
2. `npm run agent:update` → yeni agent versiyonu.
3. `npm run test:session` ile ton ve tool davranışını kontrol et.

> `prompts/ilho.md` içindeki **psikolojik yük / kriz bölümü** (KI olduğunu söylemek, TelefonSeelsorge 0800 111 0 111, 112)
> projenin `app/src/ilho.js` dosyasındaki hukuki gereklilikle uyumludur. Kısaltma, zayıflatma veya "daha akıcı olsun" diye yeniden yazma.

## Agent versiyonunu güncelleme ve geri alma

Agent'lar **versiyonludur**; `agents.update` her gerçek değişiklikte yeni versiyon üretir, eskiler silinmez.
Session'lar oluşturuldukları versiyona **sabitlenir**.

```bash
npm run agent:update              # prompt/tool/model değişikliğini yeni versiyon olarak yükle ve sabitle
npm run agent:update -- --no-pin  # yeni versiyonu oluştur ama yeni session'lar eskisini kullanmaya devam etsin (canary)
npm run agent:versions            # tüm versiyonlar; sabitlenen "◀" ile işaretli
npm run agent:pin -- 2            # GERİ ALMA: yeni session'lar v2 ile başlasın
```

- `config/agent.json` içinde `agent_version` = en yeni, `pinned_version` = yeni session'ların kullandığı sürüm.
- Mevcut klient session'ı eski versiyondaysa, klientin **sonraki mesajında otomatik yeni session** açılır
  (kontekst `get_client_context` ile yeniden yüklenir; eski sohbet geçmişi yeni session'a taşınmaz).
- Geri aldıktan sonra `agent:update` çalıştırmadan önce `prompts/ilho.md`'yi Git ile eski haline getir, yoksa dosyadaki güncel metin yeni bir versiyon olur.
- Güncelleme sırasında `409` gelirse agent başka yerden değiştirilmiştir: `agent:versions` ile kontrol et.

## Maliyet logu

Her tur sonrası konsola ve `logs/usage.jsonl`'a (mesaj metni **yok**, sadece sayılar) yazılır:
input/output/cache token'ları, model istek sayısı, aktif süre, **tahmini maliyet** (`src/cost.ts`) ve
API'nin bildirdiği **kümülatif `list_cost`** (session bazında, tam cent'e yuvarlanmış).

- Maliyet = token'lar + session çalışma süresi (0,08 $/saat, yalnızca agent aktifken).
- `src/cost.ts` içindeki fiyatlar **varsayım/tablo** değeridir (Opus 5.5: 4 $ / 20 $ per MTok). Cache-write katsayısı varsayımdır, Haiku cache fiyatları doğrulanmamıştır. Gerçek tutar için fatura/Console esas alınır.
- Console'da session izleme: `https://platform.claude.com/workspaces/default/sessions/<session_id>` (workspace'e göre değişir).

## Veri katmanını bağlama (Supabase / smile2go API)

`src/data/types.ts` içindeki `DataLayer` arayüzünü uygulayan yeni bir sınıf yaz
(`getClientContext`, `createReminder`, `hasConsent`, `createCoachShare`) ve `src/data/index.ts`'te döndür. Başka dosya değişmez.
Dikkat: `hasConsent` **otoritedir** (RLS/DB'deki gerçek onay); `data_type` listesi (`goals`, `journal_summaries`, `mood_trend`, `appointments`) uygulamadaki onay anahtarlarıyla eşleşmeli.

## DSGVO / Veri koruma notu

Bu bölüm hukuki danışmanlık değildir; Veri Koruma Görevlisi (DSB) / hukuk ile doğrulanmalıdır.

**Anthropic'e giden veriler (Managed Agents = session transkripti Anthropic'te tutulur):**
- Klientin yazdığı tüm mesajlar (ruhsal durum, spiritüel/dünya görüşü içerik → **DSGVO Art. 9** "özel kategori" olabilir).
- Agent'ın yanıtları ve **tool sonuçları**: `get_client_context` çıktısı (ad [mock'ta "Mia"], hedefler, günlük özetleri, randevular, koç adı, saat dilimi/zaman).
- Agent'ın yazdığı `share_with_coach` özetleri ve hatırlatma metinleri (tool girdileri).
- Session metadata: `client_id` (başlık + `metadata.client_ref`) – takma ad, ama kimliği çözülebilir olabilir.
- System prompt (`prompts/ilho.md`).

**Gitmeyenler (tasarım gereği):** API anahtarları, `ILHOVA_SERVICE_KEY`, tool'ların döndürmediği her şey (veritabanının geri kalanı), e-posta/soyad. Veri minimizasyonu: `get_client_context`'te yalnızca gerekli alanları döndür (ad gerekmiyorsa çıkar).

**Kontrol edilmesi gerekenler:**
- [ ] **Veri işleme sözleşmesi (AVV / DPA, Art. 28):** Anthropic ile geçerli bir DPA var mı, Managed Agents'ı kapsıyor mu? İmzalı kopyayı sakla.
- [ ] **Veri konumu:** Agent modelinde `inference_geo` yalnızca `"us"` veya `"global"` kabul ediyor (dokümana göre) – **AB/Almanya'da işleme seçilebilir görünmüyor**. Üçüncü ülke aktarımı: SCC/Data Privacy Framework durumu ve Transfer Impact Assessment.
- [ ] **Saklama:** Session transkriptleri **sen silene kadar** kalır; Managed Agents **ZDR (Zero Data Retention) ve HIPAA için uygun değildir**. Saklama süresi + silme prosedürü tanımla (`npm run session:delete -- <client_id>` Art. 17 talebi için). Anthropic tarafındaki ek loglama/saklama sürelerini sözleşme/Trust Center'dan doğrula.
- [ ] **Model eğitimi:** Ticari API verisinin eğitimde kullanılmadığını güncel şartlardan doğrula.
- [ ] **Hukuki dayanak Art. 9 (açık rıza):** Klientten KI asistanı ve Anthropic'e aktarım için açık, geri alınabilir rıza; paylaşım izinleri (koça aktarım) ayrı ve veri türü bazında.
- [ ] **DSFA / DPIA (Art. 35):** Hassas veri + yeni teknoloji → büyük olasılıkla gerekli.
- [ ] **Bilgilendirme (Art. 13/14) + Gizlilik Politikası:** alıcı olarak Anthropic, üçüncü ülke aktarımı, saklama.
- [ ] **KI şeffaflığı:** Kullanıcıya bir KI ile konuştuğu açıkça söylenmeli (prompt bunu yapar; arayüzde de belirt). EU AI Act şeffaflık yükümlülüklerini değerlendir.
- [ ] **Alt işleyenler / hosting:** `ilhova-agent`'ı barındıran sunucu (AB'de mi?), loglar (`logs/usage.jsonl` mesaj içermez ama `client_id` içerir), yedekler.
- [ ] **Gerçek veriye geçmeden önce:** erişim kontrolü, `ILHOVA_SERVICE_KEY` rotasyonu, rate limit, izleme.

## Bilinen sınırlar (pilot)

- Tek süreç; session eşlemesi `data/sessions.json` dosyasında (çok instance için veritabanına taşı).
- Mock veri bellekte; hatırlatma gönderimi yok (yalnızca kaydedilir – gönderim smile2go/push tarafında yapılacak).
- Rate limit/kullanıcı başı kota yok (maliyet kontrolü için ekle). Session başına dolar bütçesi (`budget`) opsiyoneldir, eklenmedi.
- Akış koparsa tur hata verir; bir sonraki mesajda açık kalan tool çağrıları otomatik hata ile kapatılır (best effort).
- Canlı test sonucu için çalıştırdığın ortamda gerçek `ANTHROPIC_API_KEY` gerekir.
