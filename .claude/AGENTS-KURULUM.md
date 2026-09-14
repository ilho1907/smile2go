# Agency Agents — kurulum notu

Kaynak: https://github.com/msitarzewski/agency-agents
Sürüm (commit): `ad9264e309bd5e5422c04784372d7841b1e5d604` (2026-09-12), MIT lisansı.

`.claude/agents/` altına **279 uzman ajan** (18 bölüm) kuruldu. Proje seviyesinde
kurulu oldukları için bu depoda çalışan herkes (Claude Code CLI, web, IDE) aynı
ajanlara erişir; `~/.claude` gerekmez.

## Mac'te açma (tek seferlik)

Terminal (⌘+Boşluk → "Terminal"):

```bash
cd ~/Downloads/smile2go-projekt
git fetch origin claude/agency-agents-setup-ezcxn3
git merge origin/claude/agency-agents-setup-ezcxn3
ls .claude/agents | wc -l     # 279 yazmalı
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
| marketing | 36 | game-development | 21 |
| gis | 13 | security | 12 |
| design | 10 | sales | 9 |
| testing | 9 | paid-media | 7 |
| project-management | 7 | academic | 6 |
| spatial-computing | 6 | support | 6 |
| finance | 5 | product | 5 |
| healthcare | 3 | research | 1 |

## Azaltma (isteğe bağlı)

Her ajanın tanımı her oturumun bağlamına yüklenir; 279 ajan yaklaşık 15-20 bin
token yer kaplar. Projeyle ilgisiz olanları silmek bağlamı rahatlatır, örnek:

```bash
rm .claude/agents/{game-development,gis,spatial-computing,academic,healthcare}-*.md
```

## Güncelleme

```bash
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git /tmp/agency-agents
CLAUDE_CONFIG_DIR="$(pwd)/.claude" /tmp/agency-agents/scripts/install.sh --tool claude-code
```

Sadece belirli bölümler için: `--division engineering,security`
