## Why

Chatwoot 客服目標 runtime 已拆到 Oracle Always Free Compute，且 SSH 已驗證可直連，但 StartKiter repo 的 AGENTS／部署文件仍寫成單一 Vultr Coolify 機群。老闆 2026-09-10 裁決本 change 採範圍 A：只把系統環境真相寫回專案 SSOT，讓之後開發讀得到；不在本單完成搬機與 DNS 切換。

## What Changes

- 新增 `support-runtime-topology` capability：明文規定 SaaS／Marketing 仍在 Vultr Coolify，自架 Chatwoot 的目標 runtime 是 Oracle Compute `chatwoot-oracle-01`（Singapore West），操作面以 SSH 為準
- 新增 `docs/support-runtime-topology.md` runbook：tenancy／region／instance／SSH／NSG／臨時公網 IP／私有 IP／`support.startkiter.dev` 當前 DNS 真相／驗證指令
- 修改 `AGENTS.md`、`openspec/config.yaml`、相關部署文件：補雙主機拓樸，並指向 runbook
- 更新 dashboard `state.json` 基礎設施狀態，對齊上述真相
- 核對 SSH 仍可用，並在 runbook 記錄最後驗證時間

## Non-Goals

- 不把 `apps/saas`／`apps/marketing` 從 Vultr Coolify 搬到 Oracle
- 不在本 change 安裝 Docker／部署或搬移 Chatwoot
- 不在本 change 開 NSG 80／443、不切換 `support.startkiter.dev` DNS 到 Oracle
- 不把預設客服通道從 email 改回 Chatwoot
- 不重開 `unified-support-desk` webhook 不穩定修復
- 不強制設定 OCI CLI／API key、不強制改保留公用 IP
- 不把買家 managed VPS／Coolify fleet 計費模型改成 Oracle

## Capabilities

### New Capabilities

- `support-runtime-topology`: Split-host runtime documentation for StartKiter support — SaaS app stays on Vultr Coolify; Chatwoot target host is Oracle Always Free Compute with SSH-first operator access and explicit DNS/current-truth documentation

### Modified Capabilities

(none)

## Impact

- Affected specs: 新增 `specs/support-runtime-topology/spec.md`
- Affected code:
  - New: `docs/support-runtime-topology.md`
  - Modified: `AGENTS.md`、`openspec/config.yaml`、`docs/vps-deployment-sop.md`、`docs/deploy-and-public-url.md`、dev-dashboard `state.json`（本機路徑見 dashboard SOP）
  - Removed: (none)
- Dependencies 新增: 無新增產品依賴；僅文件化既有 Oracle Compute 主機
- 環境變數新增: 無
