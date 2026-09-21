## Why

目前同一個登入後 shell 同時渲染學員入口、總管理員入口、課程管理員入口；`/course` 仍看得到管理功能，`/admin/course` 又額外渲染第二套水平管理選單。主題切換雖會改變 theme class，語系切換後卻出現主內容與側欄語言不一致，導致每次新增功能都可能回到舊的 UI 規則。現在需要把角色、工作區、選單層級、主題、語系與響應式行為固定成可測試的產品契約，讓 AI 和工程師都依同一份規則開發。

## What Changes

- 新增角色工作區導覽契約，將學員、課程管理員、總管理員分成獨立工作區。
- 修改 `NavBar` 與管理區 layout，讓每個路由只渲染一套符合目前工作區的選單。
- 修改平台選單註冊資料，讓一級選單、子級選單、權限範圍與翻譯 key 由同一份設定產生。
- 修改主題與語系元件的驗收規則，確保文字、背景、互動狀態與可見選單同步切換。
- 新增可由瀏覽器執行的角色、語系、主題、桌面與手機驗收，防止後續功能把 UI 帶回舊樣式。
- 將 UX 對焦 demo 的規則收斂到正式 spec 與共用元件，避免 demo 維護成第二套真相。
- 延伸既有 `.agents/skills/startkiter-dev/SKILL.md`，讓學生或 AI 新增 module 前先讀取同一份 UI module contract；不建立第二個重複 Skill。
- 將 Skill 定位成開發引導層，並以 TypeScript contract、測試與 CI check 作為不能被跳過的執行層，避免只靠提示文字維持一致性。

## Non-Goals

- 不重做課程編輯器、課程內容資料模型或權限 API。
- 不新增新的角色管理制度；本次只整理現有學員、課程管理員與總管理員的呈現邊界。
- 不在本 change 內處理 PAYUNi、Email、GitHub kit 履約或客服通道。
- 不把獨立靜態 HTML 當成最終產品 UI；正式驗收以實際 app 元件與部署後瀏覽器結果為準。
- 不把 Skill 視為唯一的防漂移機制；AI 沒有載入 Skill 時，runtime contract、型別與測試仍必須阻止錯誤 module 進入產品。

## Capabilities

### New Capabilities

- `role-based-workspace-navigation`: 定義角色工作區、WordPress 式一級／子級選單、主題／語系／響應式一致性，以及防止 demo 與 app 漂移的測試契約。

### Modified Capabilities

- None.

## Impact

- Affected specs: 新增 `openspec/specs/role-based-workspace-navigation/spec.md`；現有 `platform-mount-points`、`saas-shell`、`sell-flow-ux` 作為相容性依據，不直接改寫其既有需求。
- Affected developer guidance: 更新既有 `.agents/skills/startkiter-dev/SKILL.md`，加入 UI module manifest、workspace、選單層級、翻譯 key、semantic token 與驗證前置檢查；正式規則仍以 `openspec/specs/role-based-workspace-navigation/spec.md` 為準。
- Affected code: `apps/saas/modules/shared/components/NavBar.tsx`、`apps/saas/modules/shared/lib/nav-menu-items.ts`、`apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`、`packages/platform/src/mount-points.ts`、`apps/saas/modules/shared/components/LocaleSwitch.tsx`、`packages/ui/components/locale-switch.tsx`、`packages/ui/components/color-mode-toggle.tsx` 與相關測試。
- Dependencies: 不新增套件；沿用現有 Next.js、next-intl、next-themes、UI primitives、既有 startkiter-dev Skill 與 ego-browser 驗收流程。
- Environment variables: 不新增環境變數。
