## Context

`unified-support-desk` 已把自架 Chatwoot 做成產品能力，但 2026-09-02 改走 email fallback，Chatwoot 程式碼保留、產品預設不啟用。當時部署假設是 Coolify 內部工具 VPS（與買家 managed fleet 分開），文件與對話仍把「客服 runtime」跟 Vultr `startkiter-managed-fleet-01` 綁在一起。

2026-09-10 已在 Oracle Cloud（tenancy `fishtv149`、region `ap-singapore-2`）建立 Always Free Compute `chatwoot-oracle-01`（`VM.Standard.A1.Flex`、Oracle Linux 9 aarch64），掛上本機 SSH 公鑰，指定臨時公用 IPv4，NSG `ig-quick-action-NSG` 已開入站 TCP 22，並以 `ssh opc@<public-ip>` 驗證成功。SaaS／Marketing 仍留在 Vultr Coolify。repo 尚未有可被下一個 agent 直接讀到的雙主機 SSOT。

## Goals / Non-Goals

**Goals:**

- 把「App = Vultr Coolify、Chatwoot 目標 = Oracle Compute、操作面 = SSH 直連」寫進 StartKiter 可版控的 SSOT（spec + docs + AGENTS）
- 誠實標註 DNS／搬機尚未完成，避免下一個 agent 誤以為已上線
- 更新 dashboard 基礎設施狀態

**Non-Goals:**

- 不搬 SaaS／Marketing 到 Oracle
- 不在本 change 裝 Docker／搬 Chatwoot／切 DNS／開 80／443
- 不把預設客服通道改回 Chatwoot
- 不修 Chatwoot webhook AI 派送不穩定
- 不把 OCI Console／API 當本 SR 的必要操作面（SSH 優先）
- 不改買家 managed hosting 計費或 Coolify fleet 模型
- 不強制保留公用 IP（文件標臨時風險即可）

## Decisions

### Decision: 雙主機拓樸，Chatwoot 獨佔 Oracle Always Free

Chatwoot 常駐容器放 Oracle Always Free Compute；StartKiter App 繼續留在既有 Vultr Coolify。

Alternatives Considered:

- 全部搬上 Oracle：否決。App 已在 Coolify 跑通金流 webhook／standalone runtime，搬遷成本高且與「只搬客服」裁決衝突。
- Chatwoot 繼續跟 App 同機：否決。Vultr 機資源緊，且本次目標就是把客服 runtime 拆到可 SSH 直連的免費常駐機。

### Decision: 操作面以 SSH 為準，不以 Console MFA 為日常入口

日常維運與 agent 操作以 `ssh opc@<public-ip>` 為準。Console 只用於初次網路／NSG／IP 指派。

Alternatives Considered:

- 每次靠 ego-browser 登 Console：否決。MFA 與 UI 漂移成本高，無法當開發日常入口。
- 本 SR 強制完成 OCI CLI + API key：延後。有價值，但不阻塞「環境真相寫回 repo」與 SSH 就緒；另開 change 再做。

### Decision: 環境真相落在三層，禁止只活在對話

1. Normative：`openspec/specs/support-runtime-topology/spec.md`
2. Operator runbook：`docs/support-runtime-topology.md`
3. Session 入口：`AGENTS.md` + `openspec/config.yaml` 各一段摘要，並更新 `docs/dashboard` 基礎設施狀態

Alternatives Considered:

- 只改 AGENTS.md：否決。缺 scenario／驗收，archive 後不易當 SSOT。
- 只寫 discuss 筆記：否決。`docs/discuss/` 是歷史討論，衝突時以 specs 為準。

### Decision: 公用 IP 先用臨時，文件必須標風險；保留 IP 為可選 hardening

目前已指派臨時公用 IPv4。文件必須寫明「停機／重指派可能變 IP」。若要長期穩定 DNS，tasks 允許升級為保留公用 IP，但不把「立刻付費保留」當硬前置。

Alternatives Considered:

- 本 SR 強制保留 IP 才算完成：否決。會把文件 SSOT 卡在計費決策上。
- 完全不記錄目前 IP：否決。下一個 session 連不上；改為記錄「當前值 + 驗證指令 + 會變的警告」。

### Decision: 產品預設客服通道維持 email

本 SR 完成主機與文件後，產品仍維持 `NEXT_PUBLIC_SUPPORT_CHANNEL=email`。DNS／Chatwoot 主機就緒不等於產品重新啟用 Chatwoot。

Alternatives Considered:

- 主機就緒後立刻切回 chatwoot：否決。與 2026-09-02 email fallback 裁決衝突，且 webhook 不穩定未修。
- 刪除 Chatwoot 程式碼：否決。能力保留，只是 runtime 搬家與文件更新。

## Implementation Contract

Behavior：

- 任一新 session 讀 `AGENTS.md` 或 `docs/support-runtime-topology.md` 後，能正確說出：App 在 Vultr Coolify；Chatwoot 目標 runtime 在 Oracle `chatwoot-oracle-01`；SSH 使用者為 `opc`；區域為 Singapore West。
- 操作者（或 agent）能用本機既有 SSH 金鑰連上 Oracle 主機，不需再開 Console MFA。
- `support.startkiter.dev` 在本 SR 完成主機就緒後，DNS 指向 Oracle 公網 IP（或文件明確標示「尚未切 DNS、仍指向舊主機」的當前真相，禁止含糊）。
- 產品預設客服通道維持 email，不因本 SR 自動變成 Chatwoot。

Interface / data shape：

- 新增 capability `support-runtime-topology`。
- Runbook 至少包含欄位：tenancy 名稱、region、instance 名稱、shape、OS／架構、SSH user、NSG 名稱、當前公網 IP（含臨時／保留標示）、私有 IP、驗證指令、DNS 主機名、與 Vultr Coolify 主機的邊界。
- 禁止把 OCI 私鑰、API token、Chatwoot 密鑰寫進 git。

Failure modes：

- 若臨時公網 IP 變更：runbook 必須指引如何從 OCI Console／IP 管理確認新 IP，並更新文件與 DNS；不得假設 IP 永恆不變。
- 若 SSH 連不上：先查 NSG 入站 22、子網路 security list、主機 firewalld、實例是否執行中；不得直接改 App 機設定來「修好客服」。
- 若 Chatwoot 尚未從舊主機搬完：文件必須標「runtime 目標已定、搬移未完成」，禁止寫成「已在 Oracle 對客服務中」除非 DNS 與健康檢查都過。

Acceptance criteria：

- `openspec/specs/support-runtime-topology/spec.md` 存在且通過 `spectra validate`／archive 前分析。
- `docs/support-runtime-topology.md` 存在，且 `AGENTS.md`、`openspec/config.yaml` 有指向它的摘要。
- `ssh -o BatchMode=yes opc@<documented-public-ip> 'hostname'` 回傳 `chatwoot-oracle-01`（或文件記載的正式 hostname）。
- NSG（或等效安全規則）允許外網 TCP 22；若 Chatwoot HTTP(S) 已部署，另有 80／443。
- `docs/dashboard` 基礎設施狀態反映雙主機拓樸。

Scope boundaries：

In scope: 文件 SSOT、Oracle 主機網路／SSH／Chatwoot runtime 就緒、DNS 切到 Oracle（當搬移完成時）、儀表板更新。

Out of scope: App 搬遷、email→chatwoot 產品開關、webhook AI 修復、OCI CLI 強制落地、買家 VPS 計費變更。

## Risks / Trade-offs

- [臨時公網 IP 變動導致 DNS／SSH 失效] → 文件標風險；可選升級保留 IP；每次變動同步更新 runbook 與 Cloudflare DNS。
- [Always Free 閒置回收] → Chatwoot 常駐有負載；文件提醒不要長期空機；監控連線失敗時先查實例狀態。
- [文件寫成「已上線」但產品仍走 email，造成 agent 誤開 Chatwoot] → AGENTS／spec 明確分離「runtime 拓樸」與「產品通道開關」。
- [誤在 Vultr App 機上動 Chatwoot] → SSOT 寫死邊界：客服容器只在 Oracle 主機操作。
- [aarch64 映像不相容] → 選 arm64 相容的 Chatwoot／Docker 映像；部署前在 Oracle 主機驗證 `uname -m` 為 aarch64。

## Migration Plan

1. 寫入 spec／runbook／AGENTS／config／dashboard（先讓環境真相可讀）。
2. 補齊 Oracle NSG 80／443（若尚未開）與主機防火牆。
3. 在 Oracle 安裝 Docker（或等效）並部署／搬移 Chatwoot；驗證本機與公網健康檢查。
4. Cloudflare 將 `support.startkiter.dev` 指到 Oracle 公網 IP；保留舊主機直到驗證通過。
5. 更新 runbook「當前真相」為已切換；產品通道仍維持 email，除非另開 SR。

Rollback:

- DNS 指回舊 Chatwoot 主機 IP／來源。
- Oracle 主機可保留但不接流量。
- 文件將「當前真相」改回舊指向，並註記回滾時間。
- 產品通道本來就走 email，回滾 DNS 不影響站內客服開關。

## Open Questions

- Chatwoot 舊資料（PostgreSQL／uploads）是否從 Vultr／Coolify 完整搬遷，或 Oracle 視為乾淨重建後再匯入？apply 時需依舊主機實際狀態二選一，並寫進 runbook「資料搬遷結果」。
- 是否在本 SR 內升級為保留公用 IP，或接受臨時 IP + DNS 更新 SOP？預設採後者，除非老闆在 apply 前明確要求保留 IP。
