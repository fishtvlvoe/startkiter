## Why

本機file Demo與既有Next.js網站是兩個不同入口，Fish需要用真實測試帳號看到認可的兩層後台導航。本SR僅負責把已核准UI殼接到既有workspace／manifest／route guard，不重建登入、商品或交易模型。

## What Changes

- 新增正式後台top-level分類／context sidebar renderer，以既有resolveNavigation唯一結果為輸入，保留translation／圖示／角色與route guard。
- 修改apps/saas/modules/shared/components/NavBar.tsx及既有AppWrapper/layout最小接線，與role-based-workspace-navigation／app-feature-surfaces唯一owner分工；先開本機feature flag保留舊殼。
- 新增role／路由／手機／hidden modules regression及localhost測試登入驗收；不在新殼塞不存在API或偽造CRM功能。

## Non-Goals

- 不在此實作課程商品CRUD、DB migration、Entitlement、付款／退款／provider／真正CRM／直播。
- 不把本機role switch當認證，不改Better Auth或Organization模型，不導入第二套導航真相。
- 不直接部署正式站；本機驗證後另由release SR處理。

## Capabilities

### New Capabilities

- `authenticated-creator-shell`: 真本機App的兩層rendering／existing navigation輸入／登入角色邊界與相容舊routes。

### Modified Capabilities

無。本SR不裁決既有canonical role語義矛盾；preflight必先在原導航SR補正，再引用其唯一已核准結果。

## Impact

- Affected specs: 新增authenticated-creator-shell；role-based-workspace-navigation、app-extension-contract為相容性依據，語義補正由原owner負責。
- Affected code: apps/saas/modules/shared/components/NavBar.tsx、AppWrapper.tsx、相應layout、新renderer／tests與既有nav-menu-items回歸；packages/platform的role算法不在本SR重寫。
- Dependencies新增: 無；existing UI components、Next.js/Better Auth、ego-browser。
- 環境變數新增: 無provider憑證；本機renderer切換使用前端明確default-off config，不改production config，實際config位置由preflight選定既有入口。
