## Context

**本文件的 DB 與 VPS Decision 以目前已採用的營運狀態為準：DB 使用外部 Neon，VPS 維持現有 2 vCPU / 3.3GB；本次不執行硬體升級或資料庫搬遷。**

`app.startkiter.dev`（`apps/saas`）已於 `startkiter-official-site-cleanup`（2026-08-25 已封存）實測部署在 Coolify VPS，`curl -I https://app.startkiter.dev` 回應 `HTTP/2 307`、`location: /login`，是正常運作的 Next.js 應用。同一張 change 的 task 2.2 也記錄 `apps/marketing` 已部署到 `startkiter.dev` 並驗收通過，但截至本次 propose 當下（2026-08-26）重新實測，`curl -I https://startkiter.dev` 回應 `HTTP/2 503`（`content-type: text/plain`, `content-length: 20`，符合 Coolify/反向代理找不到健康 upstream 時的典型錯誤頁特徵），代表該站在驗收後的一天內回歸故障，且沒有任何監控或 change 記錄追蹤這件事。

`docs/coolify-vps-setup-runbook.md` 只驗證過「Coolify Cloud 連 VPS + 部署一個 nginx demo」這個最小案例，作者在文件內自行標註「這次記錄的是驗證用的手動流程，不是最終要教給學生的流程」。

現有唯一伺服器 `startkiter-managed-fleet-01`（Vultr，2 vCPU / 3.3GB RAM，Ubuntu 26.04，Docker 29.7.2，IP `45.76.187.247`）目前同時要扛 `apps/saas`、`apps/marketing`。Chatwoot 客服系統的部署已由 `unified-support-desk` change（design.md，2026-08-22 裁決）決定跟 `apps/saas`／`apps/marketing` 共用同一台機器，**不是本次新決策**，Chatwoot 的部署執行本身屬於 `unified-support-desk` 的範圍，本次只需要把它算進 VPS 資源需求評估。

`docs/discuss/2026-08-22-platform-positioning-infra-alignment.md` 原文對 DB 策略的用語是「DB 繼續用 Neon 還是搬進 VPS 自架 Postgres——待決定，傾向繼續用外部 Neon（省 VPS 資源）」，尚未正式定案。

## Goals / Non-Goals

**Goals:**

- `startkiter.dev`（`apps/marketing`）恢復正常回應（成功狀態或合理重導向，非 5xx），且找出並記錄根本原因避免再次回歸
- 產出一份可重複執行、可教給買家的正式部署 SOP，取代現有 runbook「非最終流程」的狀態
- VPS 層級密鑰（`SETTINGS_ENCRYPTION_KEY`、`DATABASE_URL` 等）在 Coolify 上有明確、可稽核的注入與保管方式，不寫進部署腳本明文或 log
- DB 策略與 VPS 規格兩個懸而未決的討論轉成正式規格條文，讓後續 SR 或買家有明確依據可查，不再停留在「傾向」用語

**Non-Goals:**

- 不重新部署或修改 `apps/saas` 既有 Coolify 設定本身（已驗證運作正常，不動它）
- 不做 Chatwoot／`support.startkiter.dev` 的部署執行——這屬於 `unified-support-desk` change 已定案的範圍（2026-08-22 裁決：Chatwoot 留在共用機器，不是本次新決策），本次只把 Chatwoot 的資源佔用算進 VPS 規格評估，不重新設計 Chatwoot 部署方式
- 不做行銷網站文案內容修改（`marketing-site-real-content` change 的範圍）
- 不做買家技術文件站（`buyer-docs-site` change 的範圍）
- 不做多台 VPS 高可用/負載平衡（Fish 已定案只用一台）
- 不刪除或變更 `official-site-deployment` spec 既有的「SaaS 部署在 Coolify」與「Vercel 已停用」兩條 Requirement，只修復並強化「行銷站部署」那一條

## Decisions

### Decision: 先診斷 503 根本原因，不假設是資源不足或 DNS 問題

`startkiter.dev` 回傳的 `HTTP/2 503`（`text/plain`, 20 bytes）是 Coolify Traefik 反向代理找不到健康 upstream container 時的典型特徵，比較符合「container 沒有在跑」或「container 跑了但沒有監聽健康檢查的 port」，不是 DNS 解析失敗（DNS 解析失敗會是連線逾時或 `ERR_NAME_NOT_RESOLVED`，不會收到帶內容的 503 HTTP 回應，代表反向代理層本身有正常運作、找不到後端）。實作階段第一步必須先用 Coolify 後台/API 查該 resource 的實際容器狀態與最近的 build/deploy log，不能未診斷就重新部署一次蒙混過關。

Alternatives Considered:
- 直接重新跑一次部署，不查根本原因 → 否決：跟 `startkiter-official-site-cleanup` task 2.2 犯的錯誤一樣，「表面看起來通過」不代表真的修好，且不查根因下次還會用同樣方式再壞一次

### Decision: DB 策略維持外部 Neon，不搬進 VPS 自架 Postgres

繼續使用 Neon 的理由：(1) 現有 VPS 只有 3.3GB 記憶體，`apps/saas`＋`apps/marketing`＋（若後續納入）Chatwoot 三個常駐服務已經有記憶體壓力，自架 Postgres 至少再佔用 200-500MB 起跳的常駐記憶體，直接排擠應用層可用資源；(2) Neon 的備份、時間點還原（PITR）、自動擴展是現成的，自架 Postgres 要自己顧備份策略與硬碟容量監控，這是額外維運負擔，不是省成本而是轉嫁成本到「未來出事故時」；(3) 現有 `.env` 與各 app 的 `DATABASE_URL` 已經是 Neon 連線字串格式，維持現狀不需要任何遷移風險。

Alternatives Considered:
- 搬進 VPS 自架 Postgres → 否決：唯一的優點是省下 Neon 的月費，但以現有 VPS 規格，自架反而更可能造成資源競爭引發的不穩定；目前沒有資料主權或法規需求足以抵銷這個維運風險

### Decision: VPS 規格維持現有 2 vCPU / 3.3GB，先以實際資源指標觀察

目前維持現有的 `startkiter-managed-fleet-01`（Vultr，2 vCPU / 3.3GB）。本次 503 的實際根因是 marketing standalone image 缺少 `@swc/helpers` ESM 檔案，不是 VPS 資源不足；在目前主站流量與已部署服務規模下先維持現狀。每次部署後與每週維運檢查記錄 Docker memory/CPU、OOM killer 與 Coolify restart count；若出現 OOM、持續重啟或資源長時間達警戒值，再另開升級 change。

Alternatives Considered:
- 立即升級到 4 vCPU / 8GB → 暫不採用：目前已查明 503 並非資源問題，先保留現金與可觀測性資料，出現容量門檻再升級
- 直接升到 8 vCPU / 16GB → 否決：目前流量規模是「一人公司自己賣課＋內部客服」，提前為不存在的流量付費

### Decision: VPS 層級密鑰透過 Coolify 環境變數介面管理，不寫入部署腳本或 repo

`SETTINGS_ENCRYPTION_KEY`、`DATABASE_URL`（若未來改自架）等機密一律透過 Coolify 後台的 Environment Variables 介面設定（Coolify 對敏感變數提供標記為 secret 的儲存方式，不會顯示在 build log），部署 SOP 文件與任何腳本都只能引用變數名稱，不得記錄實際值；SOP 文件本身要明確標注哪些變數屬於機密（不可截圖/不可貼進文件範例）、哪些屬於非機密設定值（可以在 SOP 裡舉例）。

Alternatives Considered:
- 用 `.env` 檔案透過 git 私有分支管理 → 否決：機密進版控即使是私有 repo 也是風險，且 Coolify 原生就有專門的機密變數管理介面，沒有理由繞過去自己重造一個較弱的方案

## Implementation Contract

**Behavior:**
- 操作員或買家依照 `docs/vps-deployment-sop.md` 的步驟，可以從零開始把 `apps/saas` 與 `apps/marketing` 重新部署到一台全新的 Coolify-managed VPS 上，不需要额外詢問任何未寫進文件的隱藏步驟
- `startkiter.dev` 與 `app.startkiter.dev` 兩個網域在本次修復後都能穩定回應（非 5xx）
- 任何人依照 SOP 文件裡「機密變數清單」章節，都能正確分辨哪些環境變數需要標記為 Coolify secret、哪些是一般設定值

**Interface / data shape:**
- `docs/vps-deployment-sop.md`：新文件，章節結構至少包含「前置需求」「Coolify resource 建立步驟」「環境變數清單（機密／非機密分類表）」「DNS 與 SSL 驗證步驟」「故障排除（含本次 503 事故的根因與處置記錄）」
- `openspec/specs/vps-production-deployment/spec.md`：新規格，包含 SOP 文件存在性、機密變數分類、VPS 規格與 DB 策略三條 Requirement
- `openspec/specs/official-site-deployment/spec.md`：既有「The marketing site is deployed under the official domain」Requirement 的 Scenario 補強為更明確的驗證方式（例如同時檢查 HTTP 狀態碼與回應內容特徵，不只是狀態碼）

**Failure modes:**
- SOP 步驟執行到一半失敗 → 文件的「故障排除」章節必須涵蓋常見失敗情境（build 失敗、DNS 未生效、SSL 簽發失敗）與對應排查步驟，不能只寫「聯繫 Fish」
- 診斷 503 事故若找不到單一根因 → 允許記錄「已排除的可能原因清單」與「已採取的緩解措施」，不強制要求 100% 確定的單一根因才能結案，但緩解措施本身必須有效（`startkiter.dev` 恢復正常回應）

**Acceptance criteria:**
- `curl -I https://startkiter.dev` 回應成功狀態碼或合理重導向（非 5xx），且與 `curl -I https://app.startkiter.dev` 同時驗證都正常
- `docs/vps-deployment-sop.md` 存在且涵蓋 Implementation Contract 列出的五個章節
- `openspec/specs/vps-production-deployment/spec.md` 通過 `spectra analyze` 與 `spectra validate`，Coverage／Consistency／Gaps 四維度皆為 Clean 或僅有 Suggestion

**Scope boundaries:**
- In scope：`startkiter.dev` 503 診斷與修復、正式部署 SOP 撰寫、密鑰管理規範、DB 策略與 VPS 規格決策記錄成規格
- Out of scope：Chatwoot／`support.startkiter.dev` 部署執行（`unified-support-desk` 範圍）、行銷網站文案（`marketing-site-real-content` 範圍）、買家技術文件站（`buyer-docs-site` 範圍）、多台 VPS 高可用

## Risks / Trade-offs

- [Risk] 診斷 503 根因時若需要 SSH 進入 VPS 或存取 Coolify 後台，而執行者（Codex）沒有對應存取權限 → Mitigation: 若卡在這一步，任務標記為阻塞並明確列出需要 Fish 提供的存取方式（Coolify API token 或 SSH 金鑰），不要自行猜測憑證或跳過診斷直接盲目重部署
- [Risk] 2 vCPU / 3.3GB 在加入 Chatwoot 或流量成長後可能不足 → Mitigation: 本次不把 503 誤判成資源事故；以 Coolify restart count、Docker memory、CPU 與 OOM killer 作為升級門檻，達門檻時另開升級 change
- [Risk] 503 事故若根因是 Chatwoot（`unified-support-desk`）已經搶先部署佔用資源，本次修復可能需要跟那張 change 的執行狀態協調 → Mitigation: 診斷任務要先確認 Chatwoot 目前是否已部署在同一台機器上，若是則資源評估要納入其實際佔用量，不是只用文件裡的理論估算

## Migration Plan

1. 診斷 `startkiter.dev` 503 根因（查 Coolify resource 狀態、container log、資源使用率）
2. 依診斷結果修復（重啟/重新部署/擴充資源，視根因而定）
3. 將目前採用的 DB 策略與 VPS 規格記錄成明確決策
4. 依確認結果撰寫 `docs/vps-deployment-sop.md` 正式版
5. 補齊 `openspec/specs/vps-production-deployment/spec.md` 與 `official-site-deployment` spec 修正

**Rollback**：若升級 VPS 規格後發現問題，Vultr 支援降級（但需要重啟，會有短暫停機）；若 SOP 文件內容有誤，直接修訂文件本身，不涉及程式碼或資料庫層級的回滾。
