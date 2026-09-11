# StartKiter 客服 runtime 拓樸（SSOT）

**版本日期：** 2026-09-11  
**產品客服通道：** 預設仍是 email（`NEXT_PUBLIC_SUPPORT_CHANNEL=email`）。Chatwoot 公網可開 ≠ 產品 widget 已啟用。

## 一句話

App 在 Vultr Coolify；Chatwoot 已跑在 Oracle `chatwoot-oracle-01`，DNS `support.startkiter.dev` 已指到這台，HTTPS 由本機 Caddy 自動簽 Let's Encrypt。Always Free 防回收靠常駐記憶體服務 + Chatwoot 堆疊。日常用 SSH，不要只靠 Console。

## 雙主機邊界

| 角色 | 主機 | 現況（2026-09-11） |
| --- | --- | --- |
| StartKiter App（Coolify：`apps/saas`、`apps/marketing`） | Vultr `startkiter-managed-fleet-01` · `45.76.187.247` | 生產流量在這 |
| Chatwoot runtime | Oracle `chatwoot-oracle-01` · 公網 `140.245.55.106`（臨時） | Docker Chatwoot + Caddy；`https://support.startkiter.dev/` 回 302 |

禁止：為了「修客服」去改 Vultr App 機上的 Chatwoot 假設。

## Oracle support host

| 欄位 | 值 |
| --- | --- |
| Tenancy | `fishtv149` |
| Region | `ap-singapore-2`（Singapore West） |
| Instance 名稱 | `chatwoot-oracle-01` |
| Instance OCID | `ocid1.instance.oc1.ap-singapore-2.anqwcljrtt5dkeyc42bpamfimevfbtrv2tajqxvisvygdc7652msaivyk4pa` |
| Shape | `VM.Standard.A1.Flex`（Always Free）· 2 OCPU / 12GB |
| OS／架構 | Oracle Linux 9 · `aarch64` |
| SSH user | `opc` |
| SSH 金鑰 | 本機 `~/.ssh/id_ed25519`（私鑰禁止進 git） |
| 私有 IPv4 | `10.0.0.163` |
| 公網 IPv4 | `140.245.55.106`（**臨時** ephemeral） |
| VCN / Subnet | `vcn-20260910-2259` / `subnet-20260910-2259` |
| NSG | `ig-quick-action-NSG`（入站：SSH TCP 22；另有 **TEMP** 入站「所有協定」維持 80／443 通——待收斂成只開 80／443） |
| Chatwoot 目錄 | `/opt/chatwoot`（compose + `.env`，密鑰只在主機） |
| 反向代理 | Caddy（`/etc/caddy/Caddyfile`）→ `127.0.0.1:3000`；自動 HTTPS |
| 對外 URL | `https://support.startkiter.dev/` |
| `FRONTEND_URL` | `https://support.startkiter.dev`（主機 `/opt/chatwoot/.env`） |

### Always Free 防回收

官方：7 天內 CPU p95、網路、記憶體（A1）皆 &lt;20% 可能回收。

已做：

- systemd `oci-memhold.service`：常駐約 3GiB（`/usr/local/bin/oci-memhold.py`）
- Chatwoot 堆疊（rails／sidekiq／postgres／redis）常駐
- Caddy 常駐

驗證：

```bash
ssh -o BatchMode=yes opc@140.245.55.106 'systemctl is-active oci-memhold caddy; free -h | head -2'
```

期望：`active`，且 Mem used 明顯高於約 2GiB（20% of ~10–12GiB）。

### SSH 驗證

```bash
ssh -o BatchMode=yes opc@140.245.55.106 'hostname && uname -m'
```

### Chatwoot 操作

```bash
ssh opc@140.245.55.106
cd /opt/chatwoot
sudo docker compose ps
sudo docker compose logs -f rails
sudo systemctl status caddy
```

建立第一個管理員（signup 預設關閉）需在主機用 rails 工作，密鑰不進 git。乾淨安裝後首次會導向 `/installation/onboarding`。

### 臨時公網 IP 變更 SOP

1. OCI Console → IP 管理確認公用 IPv4  
2. 更新本文件與 `FRONTEND_URL`（`/opt/chatwoot/.env`）後 `docker compose up -d rails`  
3. Cloudflare `support.startkiter.dev` A 記錄改新 IP（僅 DNS／灰雲；token 在 `~/.cloudflared/api-tokens.json` → `cloudflare.tokens.startkiter_dns`）  
4. Caddy 會依域名續簽；確認 `https://support.startkiter.dev/` 仍 302  
5. 可選：改保留公用 IP

## DNS 當前真相（必須誠實）

| 主機名 | 目前解析 | 說明 |
| --- | --- | --- |
| `support.startkiter.dev` | `140.245.55.106`（Oracle） | 2026-09-11 已切；Cloudflare A、僅 DNS（灰雲）、TTL 自動 |

```bash
dig +short support.startkiter.dev A
curl -sS -o /dev/null -w "%{http_code}\n" https://support.startkiter.dev/
```

期望：`140.245.55.106` 與 HTTP `302`（或 follow 後到 onboarding／登入頁）。

Cloudflare zone id：`631be2a55e0c1b0a15038ad244b7665d`（帳戶與 opcos.me 同 tenancy 帳號；DNS token **不是** `Development/.env` 的 `CLOUDFLARE_API_TOKEN`）。

## 與產品通道的關係

- 預設客服：email  
- 設 `NEXT_PUBLIC_SUPPORT_CHANNEL=chatwoot` 才切回產品 widget，需另開產品決策

## Facebook Messenger（Chatwoot · Meta App opcos）

| 欄位 | 值（2026-09-11） |
| --- | --- |
| Meta App | `opcos` · id `2578433362383415` |
| App 模式 | 開發（Development）；Live 待 `pages_messaging` 審核 |
| Webhook | `https://support.startkiter.dev/bot`（Graph page subscription `active`，含 `messages`） |
| 粉專／inbox | Fishtv余啟彰（fishotcom）· Page `660594740619142` · 獨立 Facebook inbox |
| 法律頁（App Review） | Privacy `https://startkiter.dev/zh-tw/legal/privacy-policy` · Terms `https://startkiter.dev/zh-tw/legal/terms` |

產品通道仍預設 email；本段是客服台 Facebook 頻道，不是產品站 widget。

操作細節、開發模式門禁、多客戶每頁一 inbox、token／送審狀態 → `docs/chatwoot-facebook-messaging.md`。

## 相關文件

- `docs/vps-deployment-sop.md`  
- `docs/deploy-and-public-url.md`  
- `docs/chatwoot-facebook-messaging.md`  
- `openspec/specs/support-runtime-topology/spec.md`  
- `docs/discuss/2026-09-10-oracle-chatwoot-workflow-alignment.html`  
- parked SR：`oracle-chatwoot-anti-reclaim-cutover`（DNS 已切；NSG 收斂仍待；本 SR 不碰）
