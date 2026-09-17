## Why

排查發現：後台導覽選單走 `packages/platform/src/mount-points.ts` 的靜態 `MOUNT_POINTS` 註冊機制（`platform-mount-points` capability 既有規格：「Menu mount points render from a static registry」），大部分後台頁面（使用者管理、Bundle、新生問卷、媒體庫、CoursePack 任務、課程郵件設定）都已經正確註冊、會出現在側邊導覽。但 `admin/organizations`（組織管理）、`admin/orders`（訂單管理）、`admin/revenue`（營收報表）、`admin/settings/checkout-gateway`（金流切換設定）、`admin/settings/einvoice`（發票設定）、`admin/settings/gemini`（Gemini API 設定）這 6 個頁面完全沒有註冊進 `MOUNT_POINTS`，程式碼存在、功能可以跑，但沒有任何導覽入口能找到，只能背網址直接打進去。這造成管理員（包含 Fish 本人）不知道這些功能存在，誤以為系統沒做這些功能。

## What Changes

- 修改 `packages/platform/src/mount-points.ts`：新增 6 個 `PluginManifest` 條目，對應 `admin/organizations`、`admin/orders`、`admin/revenue`、`admin/settings/checkout-gateway`、`admin/settings/einvoice`、`admin/settings/gemini`，全部標記 `requiresOperator: true`（比照既有的 `admin`／`bundles`／`onboarding-surveys` 等條目寫法），依現有 `course-admin` 分組邏輯判斷是否併入該群組（訂單、營收、組織管理不屬於課程內容管理，維持獨立頂層項目；金流/發票/Gemini 設定則考慮併入既有的 `settings` 或另建一個 `admin-settings` 群組，待 apply 階段依 `MENU_GROUP_CONFIG` 現有模式決定）
- 每個新增條目的 `order` 值需要與現有條目協調，避免順序衝突或視覺上混亂

## Non-Goals (optional)

- 不新增這 6 個頁面本身的功能，只處理「讓已存在的頁面能被導覽選單找到」這件事
- 不處理 `/admin` 首頁（目前沒有 `page.tsx`，直接訪問 `/admin` 會 404）：這次只確保每個子頁面能從側邊導覽點進去，不新增一個 admin 總覽首頁，若之後需要可另開 change
- 不改變 `requiresOperator` 判斷邏輯本身（`canAccessAdmin = check("admin.access")`，依賴 SR `admin-role-full-access-bypass` 把 Fish 帳號角色設成 admin 才能實際看到這次新增的選單項目，兩張 SR 互相獨立但有這層前置關係）

## Capabilities

### Modified Capabilities

- `platform-mount-points`: 現有「Menu mount points render from a static registry in v1」需求不變（機制本身沒改），但新增一個驗證性 scenario 確保這 6 個既有頁面現在也透過同一套機制正確出現在導覽選單

## Impact

- Affected specs: platform-mount-points（新增 scenario 驗證這 6 個頁面出現在導覽選單，不修改既有 Requirement 文字本身，用 ADDED 補充驗證情境）
- Affected code:
  - Modified: `packages/platform/src/mount-points.ts`
  - New: (none)
  - Removed: (none)
