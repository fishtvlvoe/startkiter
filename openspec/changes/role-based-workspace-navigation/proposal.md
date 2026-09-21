## Why

目前同一個登入後 shell 同時渲染學員入口、總管理員入口、課程管理員入口；`/course` 仍看得到管理功能，`/admin/course` 又額外渲染第二套水平管理選單。既有 `WorkspaceId = "learner" | "course-admin" | "super-admin"` 把工作區寫死成課程專屬三選一，無法表達 StartKiter「平台＋多個獨立 App」的產品定位——課程只是第一個 App，之後會加入設計、社群等其他 App，每個 App 的管理者要用 App 自己的名字稱呼（例如「課程管理員」「設計管理員」），且同一人可以在一個 App 是管理員、在另一個 App 是一般使用者。現在需要先把「平台／App／角色」這層骨架固定成可測試的產品契約，course 只是第一個接入的 App，才不會每加一個新 App 就要重新設計一次工作區判斷。

## What Changes

- **BREAKING**：把 `WorkspaceId = "learner" | "course-admin" | "super-admin"` 固定三值 enum，改成 `WorkspaceContext = { scope: "platform" } | { scope: "app"; appId: string; role: "app-admin" | "app-user" }` 的 App-中立結構；course 改成 App registry 裡的一筆資料，不再是型別層級的特例。
- 新增角色工作區導覽契約：總管理員（平台層）、App 管理員（依 App 名稱命名）、使用者（App 一般使用者，不分 App 一律顯示「使用者」）。
- 修改 `NavBar` 與管理區 layout，讓每個路由只依「目前 App context ＋目前角色」渲染一套選單，不再同時出現 sidebar 與平行 admin menu。
- 修改平台選單註冊資料，讓一級選單、子級選單、權限範圍與翻譯 key 由同一份 App manifest 產生，course 的選單改用同一套機制，不再單獨硬編碼。
- 修正課程一般使用者看得到管理介面的既有 bug（`/course` 下不得出現管理選單）。
- 禁止在使用者可見文字使用「平台管理員」「模組管理員」「學員」；固定總管理員／{App 名稱}管理員／使用者三種可見稱呼，App 名稱來源為 App registry 的 `displayName`（由誰、如何設定 `displayName` 由 SR-02 定義，本次只定義引用規則）。
- 新增可由瀏覽器執行的角色、App 切換與桌面／手機骨架驗收，防止後續功能把 UI 帶回舊樣式或把某個 App 的管理功能誤植入總管理員介面。
- 將 UX 對焦 demo（`docs/ux/startkiter-sr-architecture-focus.html`）的規則收斂到正式 spec 與共用元件，避免 demo 維護成第二份真相。

## Non-Goals

- 不重做課程編輯器、課程內容資料模型或權限 API。
- 不新增新的角色管理制度；本次只整理總管理員、App 管理員、使用者三種可見角色的呈現邊界，不新增第四種角色。
- 不定義「App 如何加入平台」「App 名稱如何被設定／改名」的完整規則與開發 Skill——這是 `app-extension-contract` change 的範圍，本次只定義 App manifest 被引用時的顯示與導覽契約。
- 不處理帳號選單（使用者設定／App 管理員設定／總管理員設定的實際內容、主題切換、語言切換、SVG icon）——這是 `account-settings-theme-language` change 的範圍；本次只保留這些入口在角色邊界下「該不該出現」的判斷位置，不建立其內容。
- 不處理各 App 實際功能畫面（課程以外的 App 介面）——這是 `app-feature-surfaces` change 的範圍。
- 不處理上線前跨 App 全量驗收與回滾證據——這是 `platform-launch-verification-evidence` change 的範圍。
- 不在本 change 內處理 PAYUNi、Email、GitHub kit 履約或客服通道。
- 不把獨立靜態 HTML 當成最終產品 UI；正式驗收以實際 app 元件與部署後瀏覽器結果為準。

## Capabilities

### New Capabilities

- `role-based-workspace-navigation`: 定義平台／App／角色三層工作區模型、WordPress 式一級／子級選單、App-中立的可見稱呼規則，以及防止 demo 與 app 漂移的測試契約。

### Modified Capabilities

- None.

## Impact

- Affected specs: 重寫 `openspec/changes/role-based-workspace-navigation/specs/role-based-workspace-navigation/spec.md`（同一 change，非新增）；現有 `platform-mount-points`、`saas-shell`、`sell-flow-ux` 作為相容性依據，不直接改寫其既有需求。
- Affected code: `apps/saas/modules/shared/components/NavBar.tsx`、`apps/saas/modules/shared/lib/nav-menu-items.ts`、`apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`、`packages/platform/src/mount-points.ts`、及新增的 `packages/platform/src/workspace/`（`WorkspaceContext` 型別與 `resolveNavigation`）。
- Dependencies: 不新增套件；沿用現有 Next.js、next-intl、next-themes、UI primitives。
- Downstream changes：`app-extension-contract`、`account-settings-theme-language`、`app-feature-surfaces`、`platform-launch-verification-evidence` 皆依賴本 change 先固定的 `WorkspaceContext`／`AppManifest`／`resolveNavigation` 介面；型別一旦變動需回頭同步。
- Environment variables: 不新增環境變數。
