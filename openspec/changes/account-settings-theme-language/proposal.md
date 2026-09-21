## Why

`role-based-workspace-navigation` 固定了「哪個角色看得到哪個一級／子級選單」，但沒有定義帳號選單（左下角帳號區）本身的內容：使用者設定、App 管理員設定、總管理員設定三種入口實際放什麼；深色／淺色切換、語言切換目前仍留在一級選單或各自實作，導致主題切換後仍有殘留深色文字 class、語系切換後主內容與側欄不同步。這些是使用者每天都會用到的偏好設定，需要固定成一個入口、一組語意色彩 token、一套可驗證的切換行為，不能繼續讓每個功能各自處理主題與語言。

## What Changes

- 新增帳號選單契約：使用者設定（任何角色皆可見）、{App 名稱}管理員設定（僅該 App 的 app-admin 可見）、總管理員設定（僅總管理員可見）三種入口，依 `role-based-workspace-navigation` 已定義的 `WorkspaceContext` 決定可見性。
- 把深色／淺色切換與語言切換從一級選單移到帳號設定內，一級選單不再出現這兩個控制項。
- 新增 SVG icon 淺色／深色版本管理規則：每個 icon 必須同時提供 light／dark 兩版，由主題狀態決定使用哪一版，不透過 CSS filter 硬轉色。
- 修正既有 `NavBar.tsx` 內寫死的深色專用文字 class，全面改用語意色彩 token（`background`、`foreground`、`muted-foreground`、`border`、`accent`）。
- 新增可由瀏覽器執行的主題／語言驗收：確認 dark／light／system 三種模式與 `zh-tw`／`zh-cn`／`en` 三種語言切換後，文字顏色、視窗大小、選單與帳號區皆同步且無溢出。

## Non-Goals

- 不重新定義 `WorkspaceContext`、`resolveNavigation` 或一級／子級選單的可見性邏輯——沿用 `role-based-workspace-navigation` 已固定的結果，本次只定義「帳號選單裡有什麼」。
- 不定義新 App 如何加入平台或 `displayName` 如何設定——這是 `app-extension-contract` 的範圍。
- 不實作任何一個實際 App 的功能畫面內容（課程管理員設定頁裡真正的課程相關設定選項除外，僅涵蓋外殼與入口本身）。
- 不新增第三方 UI framework、icon library 訂閱或 Storybook。
- 不處理跨 App 全量上線驗收與回滾證據——這是 `platform-launch-verification-evidence` 的範圍。

## Capabilities

### New Capabilities

- `account-settings-theme-language`: 定義帳號選單三層設定入口、主題與語言切換位置、SVG icon 淺深色規則，以及語意色彩與 responsive 驗收契約。

### Modified Capabilities

- None.

## Impact

- Affected specs: 新增 `openspec/changes/account-settings-theme-language/specs/account-settings-theme-language/spec.md`；依賴 `role-based-workspace-navigation` 已定義的 `WorkspaceContext`，不重寫其需求。
- Affected code: `apps/saas/modules/shared/components/NavBar.tsx`（移除深色 hardcoded class、移除一級選單的主題／語言控制項）、`apps/saas/modules/shared/components/LocaleSwitch.tsx`、`packages/ui/components/locale-switch.tsx`、`packages/ui/components/color-mode-toggle.tsx`、新增 `apps/saas/modules/shared/components/AccountMenu.tsx`（帳號選單三層入口）、`packages/ui/icons/`（SVG light／dark 版本管理）。
- Dependencies: 依賴 `role-based-workspace-navigation` 已完成的 `WorkspaceContext`；不新增套件，沿用 next-themes、next-intl。
- Environment variables: 不新增環境變數。
