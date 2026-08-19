# Coolify + VPS 集中管理模式：實測 Runbook

**日期：** 2026-08-18
**狀態：** 已實測跑通一次，`coolify-test.startkiter.dev` 可正常存取，SSL 為 Let's Encrypt 正式簽發
**對應 SR：** `openspec/changes/coolify-managed-deployment/`（tasks.md 1.1–1.5）

## 目標

驗證「買家自租 VPS，StartKiter 唯一 Coolify Cloud 帳號集中管理」這個模式技術上真的可行，並留下可重複操作的步驟，供之後寫成學生教學內容或自動化腳本。

## 前置決策（為什麼這樣選）

- **VPS 供應商**：比較過 Vultr（$12-24/月起，有新加坡/東京機房）、DigitalOcean（$24/月，貴一倍）、Hetzner（$6.5/月最便宜，但只有歐美機房，且對非歐盟帳號有已知的註冊拒絕問題）。選 **Vultr**，兼顧價格與台灣延遲。
- **Coolify 用法**：一度考慮改用已有的 Zeabur 帳號取代 Coolify+VPS，實測與踩坑紀錄查證後否決（Zeabur 黑盒容器無 SSH/root、按服務計費不利多客戶攤成本）。維持 **Coolify Cloud（app.coolify.io，已付費訂閱）+ 買家自己的 VPS** 這個組合。
- **不要用 VPS 供應商的「Coolify Marketplace App」**：Vultr 有現成的「一鍵裝 Coolify」映像檔，但那是**自架版 Coolify**，跟 `app.coolify.io`（Coolify Cloud）是兩個完全獨立的東西。已經在付 Coolify Cloud 訂閱費的情況下，VPS 應該保持乾淨（只裝作業系統），由 Coolify Cloud 透過 SSH 自己完成安裝，不要疊床架屋。

## 完整步驟（已實測）

### 1. 買 VPS

在 Vultr 選 **Shared CPU → Regular Cloud Compute → 2 vCPU / 4 GB**（$24/月起，實際定價以下單當下畫面為準），地區選離台灣近的機房（新加坡/東京，但常缺貨，缺貨時可以先選美系機房頂著用）。**作業系統選一般 Linux 發行版（如 Ubuntu），不要選 Marketplace App 分類裡的 Coolify。**

### 2. 在 Coolify Cloud 生一把專用 SSH 金鑰

`app.coolify.io` → Servers → New server → Add a server（IP address or domain）→ Private key 欄位選「New key」→「Generate ED25519」。

### 3. 把公鑰裝進 VPS

- 私鑰內容在 Coolify Cloud 的「Keys & Tokens → Private Keys → 點進去的 Edit 畫面」可以看到完整內容
- 本機用 `ssh-keygen -y -f <私鑰檔案>` 算出對應公鑰
- 到 VPS 供應商（Vultr：Account → SSH Keys → Add SSH Key）貼上這把公鑰
- 回到 VPS 的 Settings，用「Reinstall SSH Keys」（或建立新機時直接勾選這把金鑰）讓機器套用這把鑰匙

### 4. Coolify Cloud 連線驗證

`app.coolify.io/servers/new/manual` 填 VPS 的 IP + 選剛剛那把私鑰 → Continue → 進到伺服器詳情頁按「Validate connection」→ Coolify Cloud 會自己透過 SSH 連進去，偵測/安裝 Docker、Docker Compose，跑一輪驗證清單。跑完顯示「Ready」代表成功。

### 5. 部署一個最小測試應用

新建 Project → New resource → 選「Docker Image」（不用寫 Dockerfile、不用等 build，最快驗證）→ Image name 填 `nginxdemos/hello`，Tag 填 `latest` → Create → Actions → Deploy。Coolify 會自動配一個 `*.sslip.io` 的臨時網址可以先測。

### 6. 接真的網域

- Cloudflare（該網域所在帳號）→ DNS → 新增 A 記錄，指到 VPS 的 IP
- **Proxy 狀態務必先設「僅 DNS」（灰色雲朵），不要打開 Proxy（橘色雲朵）**——Coolify 自己會用 Let's Encrypt 簽 SSL，如果流量先繞經 Cloudflare Proxy，簽發會卡住/失敗，這是最容易踩的坑
- Coolify 應用頁 → Domains → Add → 填正式網域（`https://xxx.yourdomain.com`）→ Save
- Actions → Redeploy，讓新網域設定生效並觸發 SSL 簽發

### 7. 驗證

```bash
dig +short <你的網域>              # 確認 DNS 解析到 VPS IP
curl -sv https://<你的網域>/ -o /dev/null 2>&1 | grep -i "issuer\|verify"
# 應該看到 issuer: Let's Encrypt、SSL certificate verify ok
```

## 實測踩過的坑

1. **選錯 Vultr 的 Marketplace App「Coolify」**——這是自架版，跟 Coolify Cloud 無關，裝了等於白裝，還要重裝機器才能改回乾淨系統。**教訓：已經在用 Coolify Cloud 的情況下，VPS 系統一律選純 OS，不要選任何預裝面板類的 Marketplace App。**
2. **Vultr 亞太機房小方案常缺貨**——2 vCPU/4 GB 這個等級在新加坡、東京、大阪、首爾都遇過「Click to be notified when this plan is available」，最後用美系機房（Silicon Valley）先頂上。**教訓：亞太機房缺貨是常態，備案永遠要有一個美系機房選項。**
3. **VPS 主控台的 noVNC 螢幕畫面自動化工具讀不到**（視窗尺寸偵測回傳 0x0，重新整理也無法修正）——如果需要看開機/安裝過程，用 SSH 連線或看 Vultr 帳單頁的「Server Information」文字資訊，不要依賴 VNC 畫面截圖。
4. **DNS 記錄的 Proxy 狀態預設是開啟（橘色雲朵）**，會讓 Coolify 的 SSL 自動簽發卡住。新增 A 記錄時務必手動關掉，改成「僅 DNS」。

## 教學化建議（給之後寫課程用）

- 步驟 1-4（買機器、接上 Coolify）對純小白學生來說仍然偏技術，建議做成**帶截圖的逐步教學**，而不是文字描述
- 步驟 5-7（部署、接網域）如果走 `coolify-managed-deployment` SR 規劃的 AI 對話介面自動化，學生理論上完全不用手動做這幾步——本次 runbook 記錄的是**驗證用的手動流程**，不是最終要教給學生的流程
- 「選錯 Marketplace App」這個坑本身可以直接寫成教材裡的警示框，因為這是最直覺、最容易誤踩的地方
