## 1. 文件 SSOT（範圍 A：只寫環境真相）

- [x] 1.1 新增 `docs/support-runtime-topology.md` runbook，落實 Decision: 環境真相落在三層，禁止只活在對話、Requirement「Support runtime topology SSOT lives in versioned project files」、Requirement「Network rules for SSH and Chatwoot HTTP(S)」（文件標註 22 已開、80／443 尚未開）、Requirement「DNS truth for support.startkiter.dev is explicit」（誠實標註仍指 Vultr）：寫入 tenancy／region／instance／shape／OS 架構／SSH user／NSG／當前公網 IP（標臨時）／私有 IP／DNS 當前真相／驗證指令，且不含私鑰或 token。驗證：`rg -n "chatwoot-oracle-01|opc@|ap-singapore-2|臨時|support.startkiter.dev|80／443|TCP 22" docs/support-runtime-topology.md` 有命中。

- [x] [P] 1.2 更新 `AGENTS.md` 部署段，落實 Requirement「Split-host support runtime is the canonical topology」與 Decision: 雙主機拓樸，Chatwoot 獨佔 Oracle Always Free：明示 App 在 Vultr Coolify、Chatwoot 目標 runtime 在 Oracle，並連到 runbook；註明搬機／DNS 切換不在本 change。驗證：`rg -n "chatwoot-oracle-01|support-runtime-topology|Vultr" AGENTS.md` 可見雙主機摘要與文件連結。

- [x] [P] 1.3 更新 `openspec/config.yaml` context，重申雙主機拓樸與 Decision: 產品預設客服通道維持 email。驗證：`rg -n "Oracle|Chatwoot|SUPPORT_CHANNEL|email|support-runtime-topology" openspec/config.yaml` 同時看得到 runtime 拆分與 email 預設。

- [x] [P] 1.4 更新 `docs/vps-deployment-sop.md` 與／或 `docs/deploy-and-public-url.md`，避免暗示 Chatwoot 與 App 同機，並指向 runbook。驗證：`rg -n "support-runtime-topology" docs/vps-deployment-sop.md docs/deploy-and-public-url.md` 至少一處命中。

## 2. SSH 現況核對與 IP 風險標註

- [x] 2.1 確認 Requirement「SSH-first operator access to the Oracle support host」與 Decision: 操作面以 SSH 為準，不以 Console MFA 為日常入口：`ssh -o BatchMode=yes opc@<runbook-public-ip> 'hostname && uname -m'` 成功。驗證：hostname=`chatwoot-oracle-01`、架構=`aarch64`，結果寫回 runbook「最後驗證時間」。

- [x] [P] 2.2 落實 Decision: 公用 IP 先用臨時，文件必須標風險；保留 IP 為可選 hardening：runbook 標示臨時 IP 與「IP 變更時更新 runbook」SOP；本 change 不強制改保留 IP。驗證：runbook 含「臨時」與變更 SOP。

## 3. 產品通道邊界與儀表板

- [x] 3.1 落實 Requirement「Product support channel remains independent of host topology」與 Decision: 產品預設客服通道維持 email：政策文件維持 email 預設，runbook 寫明「runtime 文件就緒 ≠ 產品啟用 Chatwoot」，且本 change 不做搬機／DNS 切換。驗證：`rg -n "NEXT_PUBLIC_SUPPORT_CHANNEL|客服走 email|runtime 就緒" AGENTS.md openspec/config.yaml docs/support-runtime-topology.md` 顯示 email 為預設與邊界說明。

- [x] [P] 3.2 更新 `docs/dashboard`／dev-dashboard `state.json` 基礎設施狀態，反映雙主機拓樸與 Oracle support host（搬機未完成）。驗證：狀態可見 Oracle Chatwoot host 與 Vultr App host 分列，並指向 `docs/support-runtime-topology.md`。

## 4. Review

- [x] 4.1 對照 design Implementation Contract（含 Behavior、Interface / data shape、Failure modes、Acceptance criteria、Scope boundaries）與 ADDED Requirements（文件／SSH／DNS 真相誠實標註／產品通道獨立）：確認範圍 A 完成後，下一個 agent 無對話上下文也能讀懂拓樸。驗證：`spectra analyze oracle-chatwoot-runtime-topology --json` 無 Critical／Warning；tasks 全數 `[x]`；`spectra validate oracle-chatwoot-runtime-topology` 通過。
