## Why

老闆裁決：StartKiter 自己的網站與賣給買家的代碼包本來就是同一套模組（StartKiter 自己的站是產品本身的示範），因此網站架構必須支援多租戶（Organization），正式推翻先前 `v1-scope-boundary` 排除 Organization 的規則。這次先定義角色/租戶的功能規格，UI/UX 與後端串接留給後續 change，避免每個新功能都要重新討論一次 UI。

## What Changes

- 新增：Organization/Member/Invitation 多租戶資料模型的角色矩陣定義（owner、admin、instructor、user 四種角色，各自的權限邊界）
- 新增：管理員（admin）指派／撤銷組織成員為講師（instructor）的權限規則
- 修改：`v1-scope-boundary` — 移除「不做 Organization / Member / Invitation」的排除規則，改為明確允許並要求
- **BREAKING**：`v1-scope-boundary` 先前「帳單掛 user，不做 Organization」的規則作廢

## Non-Goals

- 不畫任何 UI 稿、不寫任何前端元件（留給後續的 UI/UX change，待這份功能規格定案後才開工）
- 不接資料庫 migration、不改 `apps/saas` 或 `packages/auth` 任何一行程式碼（留給後續的後端 change）
- 不重新設計 Invitation 的 email／LINE 通知機制（是否沿用 supastarter 現有機制或改用 StartKiter 既有客服模式，列入 Open Questions，不在本 change 決定）
- 不決定買家付費權益（courseAccess／kitClaimEligible）掛在 Organization 層級還是 Member 層級（列入 Open Questions，不在本 change 決定，`mvp-offer` spec 現有的「掛在單一 User/Order」規則本次不修改）
- 不決定 StartKiter 自己的網站實際要不要開放建立多個 Organization，還是永遠只用一個官方組織（列入 Open Questions）

## Capabilities

### New Capabilities

- `organization-tenancy`: Organization/Member/Invitation 多租戶角色矩陣，定義 owner/admin/instructor/user 四種角色的權限邊界，以及 admin 指派/撤銷 instructor 身份的規則

### Modified Capabilities

- `v1-scope-boundary`: 移除「不做 Organization / Member / Invitation」的排除規則，改為要求支援多租戶

## Impact

- Affected specs: `organization-tenancy`（新增）、`v1-scope-boundary`（修改）
- Affected code：本 change 不異動任何程式碼（純規格定義），Impact 僅供後續 change 參考：未來會涉及 `packages/auth`（角色與組織邏輯）、`packages/database`（Organization/Member/Invitation schema）、`apps/saas/app/admin`（組織管理 UI，後續 UI change）
- Dependencies 新增：無（本 change 不涉及程式碼或套件變更）
- 環境變數新增：無
