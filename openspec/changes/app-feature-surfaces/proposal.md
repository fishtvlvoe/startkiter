## Why

`role-based-workspace-navigation`、`app-extension-contract`、`account-settings-theme-language` 固定了骨架、新增規則與帳號設定，但骨架本身不會自動把課程既有功能（`packages/course/`、`admin/course` 頁面）套進新的 App registration 契約；目前課程的部分管理功能仍可能透過總管理員路由或共用元件直接暴露，違反「App 管理員只能看到該 App 的管理功能」「總管理員可以管理所有 App，但不是把所有 App 塞進同一個介面」的骨架原則。本 change 把課程這個既有 App 遷移到新契約下，並定義未來新增 App（設計、社群等）必須遵守「使用者介面與管理員介面分開、不塞進總管理員介面」的邊界，不在本次預先實作任何未來 App 的功能內容。

## What Changes

- 把課程 App 現有的使用者介面（`/course` 下的學習相關頁面）與管理員介面（`/admin/course` 下的課程管理後台）依 `app-extension-contract` 的 `AppRegistrationManifest` 註冊為 `appId: "course"`。
- 盤點並移除任何目前直接掛在總管理員路由或共用總管理員元件下、但實際屬於課程管理範疇的功能，改回課程 App 自己的 app-admin 介面。
- 固定「一個 App 的使用者介面與管理員介面必須是兩個獨立的頁面樹，不共用同一個路由渲染兩種內容」的邊界規則，並以測試守住。
- 固定「總管理員介面只呈現全站層級功能（帳號、交易、營收、金流、組織、系統、App 清單），不得內嵌任何單一 App 的管理功能明細」的邊界規則。
- 新增邊界測試：往總管理員介面加入單一 App 專屬功能時，CI 擋下。

## Non-Goals

- 不新增設計、社群或任何其他新 App 的實際功能——本次只固定「未來 App 加入時使用者／管理員介面要分開」的邊界規則，不預先搭建空殼頁面。
- 不重做課程內容資料模型、課程編輯器本體邏輯（`course-studio-upgrade` 已完成，本次只處理它掛載到哪個路由樹、屬於哪個 App）。
- 不重新定義 `WorkspaceContext`、App registration 契約或帳號選單內容——沿用前三張 change 已固定的規則。
- 不處理跨 App 全量上線驗收與回滾證據——這是 `platform-launch-verification-evidence` 的範圍。
- 不處理付款、Email、GitHub kit 履約或客服通道。

## Capabilities

### New Capabilities

- `app-feature-surfaces`: 定義單一 App 的使用者介面與管理員介面必須分離、總管理員介面不得內嵌單一 App 管理功能明細的邊界契約，並把課程 App 遷移到符合此契約的狀態。

### Modified Capabilities

- None.

## Impact

- Affected specs: 新增 `openspec/changes/app-feature-surfaces/specs/app-feature-surfaces/spec.md`；依賴 `role-based-workspace-navigation`（`WorkspaceContext`）、`app-extension-contract`（`AppRegistrationManifest`）、`account-settings-theme-language`（帳號選單入口）已固定的契約，不重寫其需求；`course-module`、`course-studio-upgrade` 等既有課程 spec 作為內容邊界依據，不改寫其業務需求。
- Affected code: `apps/saas/app/(authenticated)/(main)/course/`、`apps/saas/app/(authenticated)/(main)/(account)/admin/course/`、`apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`（盤點是否有課程專屬功能誤植）、`packages/course/`（僅涉及路由掛載，不改業務邏輯）。
- Dependencies: 依賴 `role-based-workspace-navigation`、`app-extension-contract`、`account-settings-theme-language` 皆已完成；不新增套件。
- Downstream changes：`platform-launch-verification-evidence` 的全量驗收將涵蓋本 change 遷移後的課程 App 介面。
- Environment variables: 不新增環境變數。
