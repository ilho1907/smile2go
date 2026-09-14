# Agency Agents — kurulum notu

Kaynak: https://github.com/msitarzewski/agency-agents
Sürüm (commit): `ad9264e309bd5e5422c04784372d7841b1e5d604` (2026-09-12), MIT lisansı.

`.claude/agents/` altına **230 uzman ajan** (13 bölüm) kuruldu. Proje seviyesinde
kurulu oldukları için bu depoda çalışan herkes (Claude Code CLI, web, IDE) aynı
ajanlara erişir; `~/.claude` gerekmez.

## Mac'te açma (tek seferlik)

Terminal (⌘+Boşluk → "Terminal"):

```bash
cd ~/Downloads/smile2go-projekt
git fetch origin claude/agency-agents-setup-ezcxn3
git merge origin/claude/agency-agents-setup-ezcxn3
ls .claude/agents | wc -l     # 230 yazmalı
```

Sonra aynı klasörde Claude Code'u aç:

```bash
cd ~/Downloads/smile2go-projekt
claude
```

Ajanlar proje klasöründen otomatik yüklenir — ayrıca bir kurulum gerekmez.
Claude Code'un web veya IDE sürümünde de aynı depoda çalıştığın sürece geçerli.

## Kullanım

Claude Code oturumunda ajanı adıyla çağır:

```
Frontend Developer ajanını kullan ve app/ içindeki Mitglieder görünümünü hızlandır.
Backend Architect ajanıyla Supabase şemasını gözden geçir.
```

Ajan listesi: `ls .claude/agents/` — dosya adı `<bölüm>-<ajan>.md` biçiminde.

## Bölümler ve ajan sayıları

| Bölüm | Adet | Bölüm | Adet |
|---|---|---|---|
| engineering | 64 | specialized | 59 |
| marketing | 36 | security | 12 |
| design | 10 | sales | 9 |
| testing | 9 | paid-media | 7 |
| project-management | 7 | support | 6 |
| finance | 5 | product | 5 |
| research | 1 | | |

Kurulumda **çıkarılanlar** (projeyle ilgisiz, 49 ajan): `game-development`,
`gis`, `spatial-computing`, `academic`, `healthcare`. Geri istersen aşağıdaki
güncelleme komutunu `--division` olmadan çalıştır.

## Daha da azaltma (isteğe bağlı)

Ajan isim+açıklamaları her oturumun sistem promptuna yükleniyor: şu an
**~14.700 token**. Bir bölümü daha çıkarmak istersen ölçülü karar ver —
49 ajanın çıkması ~2.600 token kazandırdı, yani ajan başına ~55 token.
Asıl kazanç bölüm silmekte değil, gereksiz *büyük* bölümleri
(`specialized`, `marketing`) atmakta.

Bir bölümü çıkarmak için kaynak depodaki dosya adlarına bakmak gerekir
(dosya adları her zaman bölüm adıyla başlamıyor); en temizi aşağıdaki
güncelleme komutunu istediğin `--division` listesiyle yeniden çalıştırmak.

## Güncelleme

```bash
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git /tmp/agency-agents
rm -rf .claude/agents            # eskiyi temizle, yoksa çıkarılanlar geri gelmez
CLAUDE_CONFIG_DIR="$(pwd)/.claude" /tmp/agency-agents/scripts/install.sh \
  --tool claude-code \
  --division engineering,specialized,marketing,security,design,sales,testing,paid-media,project-management,support,finance,product,research
```

`--division` listesi mevcut kurulumu birebir tekrarlar. Bir bölüm eklemek
veya çıkarmak için listeyi düzenle. `--list teams` tüm bölümleri gösterir.
