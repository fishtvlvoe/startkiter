# rebuild-design-system-from-source CR 報告

本報告涵蓋第 1–8 節的 correctness、security、performance 審查。結論：Critical 發現 0 件；有 2 件非阻斷性邊界留在報告中，並分開列出第 9.2 的既知測試阻塞。

## F-001：3.1／3.2 原驗收文字與官方元件 source 不一致

- **嚴重度**：Medium（驗收契約落差）
- **位置**：`openspec/changes/rebuild-design-system-from-source/tasks.md` 的 3.1、3.2、4.1、5.1
- **觸發條件**：原文字把「使用 Base UI」寫成所有元件都必須直接 import `@base-ui/react`，並指定執行本地不存在的 `shadcn` script。
- **官方證據**：`vendor/supastarter-nextjs/packages/ui/components/button.tsx`、`card.tsx`、`badge.tsx`、`input.tsx`、`form.tsx`、`label.tsx`、`spinner.tsx` 都不 import Radix 或 Base UI；只有 `tooltip.tsx` import `@base-ui/react/tooltip`；`color-mode-toggle.tsx` 不使用 headless UI library。
- **影響**：若照原文字寫測試，會迫使實作加入官方沒有的 import，或把不存在的 CLI 當成可用，違反「官方原始碼唯一依據」與逐元件 source 搬遷決策。
- **處置**：不回改 `tasks.md`。本批次改用逐檔 source parity 測試：移除 Radix、比對官方實際 import／實作；只在官方使用 Base UI 的 Tooltip 斷言 Base UI；Button 改採官方 `render` prop，並保留既有 `data-slot` 與呼叫端契約。
- **狀態**：Accepted／已在批次二 3.1–5.2 實作與測試中處理。

## F-002：Organization/Member 後端資料源尚未存在，切換器目前是 typed UI boundary

- **嚴重度**：Medium（功能整合邊界，不是已知資料洩漏）
- **位置**：`apps/saas/app/components/app-shell.tsx`、`apps/saas/app/components/organization-select.tsx`、`apps/saas/lib/organization.ts`
- **觸發條件**：目前 `packages/database/prisma/schema.prisma` 沒有 Organization、Member、Invitation model，既有 SaaS route 也沒有 organization list API；`AppShell` 因此接受 `organizations`、`activeOrganizationId`、`onOrganizationChange` typed props，預設空清單並 fail closed。
- **安全判斷**：切換器只從呼叫端提供的 `OrganizationRecord[]` 找可切換項目，不接受任意外部 organization id；回呼只在候選清單命中時執行。本次沒有新增跨組織資料查詢或把 organization id 傳進後端查詢，所以沒有新增已確認的跨租戶資料洩漏路徑。
- **影響**：目前正式頁面沒有實際組織資料時不會顯示切換器；8.1 的測試驗證 UI 狀態、callback 與 active data-scope 標記，不宣稱已完成後端租戶切換。
- **處置**：本批次只落地 UI 與型別化資料契約，沒有擅自新增 Prisma migration 或 API。後續接 Organization/Member backend 時，必須在 server/API 重新驗證 membership，再依 active organization scope 查詢資料，不能只信任 client callback。
- **狀態**：Accepted／作為後續後端 change 的明確前置條件。

## F-003：官方 Permix 套件未納入本地依賴，改以同矩陣的 fail-closed provider

- **嚴重度**：Low（架構 parity 差異）
- **位置**：`apps/saas/lib/permissions.tsx`、`apps/saas/lib/organization.ts`
- **觸發條件**：官方 `vendor/supastarter-nextjs/apps/saas/modules/shared/components/PermixProvider.tsx` 使用 `permix`／`permix/react`；本地 `package.json` 沒有 `permix`，而 StartKiter 的封存規格又明確採 owner/admin/instructor/user 四角色，不是官方目前的 owner/admin/member 三角色。
- **安全判斷**：本地 provider 只接受四個 union role，未知值正規化成 `null`，所有權限回傳 false；owner/admin/instructor/user 矩陣測試與 AppShell 導覽測試均通過，沒有 default allow 或例外繞過。
- **影響**：這批次提供的是 StartKiter 規格相容的 UI permission boundary，不是假稱已完成官方 Permix 的 server hydration/API middleware。
- **處置**：不為了表面 import parity 強行加入 vendor 專用的 server hydration 契約；後續若要接官方 Permix，需先把四角色 definition、server dehydrate 與 route/API enforcement 一起定義，再替換此 provider。
- **狀態**：Accepted／非 Critical；本批次的四角色 UI 驗收已完成。

## 第 9.1 CR checklist

### Correctness

- `packages/ui` source parity focused suite：4 files、15 tests passed；Button/Card/Badge/Input/Form/Label 依官方實際 source 不引入 headless primitive，Tooltip 使用 `@base-ui/react/tooltip`，Spinner 使用 `Loader2Icon`，ColorModeToggle 維持官方的非 headless 實作。
- `packages/ui/src` production components 沒有 `radix-ui` import；`radix-ui` 只剩 `version-gap.test.ts` 的舊比較資料項，該檔案屬第 9.2 已知阻塞，沒有把測試殘留誤報成 runtime dependency。
- `createPermissionRules()` 對四角色與未知角色有矩陣測試；AppShell 與 MobileTabbar 的 settings/course-admin 權限限定導覽都經 permission rules 判斷。
- `OrganizationSelect` 對單／多組織、候選清單切換與 callback 單次觸發有測試；Base UI RadioGroup 不再疊加重複 click callback。

### Security

- 未解析角色採 deny-by-default；沒有以 `showOperatorSettings` 單一布林值繞過 permission gate。
- organization switch 只允許從已提供的 typed membership list 選取，未知 id 直接忽略；本次沒有變更資料查詢 API，F-002 的 server-side scope 風險留給後續 backend change。
- `vendor/supastarter-nextjs/` 沒有修改；Radix 移除後的依賴與 lockfile 只保留 `@base-ui/react`。

### Performance

- permission rules 以 `useMemo` 建立，MobileTabbar 只在 render 時建立小型同步 permission object；沒有新增網路請求、輪詢或全域 listener。
- OrganizationSelect 只在清單長度至少 2 時建立 Base UI menu，active id 只在 props 變更時同步。
- `pnpm build` 通過，Next production build 完成 21/21 static generation。

**CR verdict：Critical 0 件。F-002、F-003 已列為非阻斷性邊界，不在本批次擴大到後端或官方 Permix server wiring。**

## 第 9.2／9.3 驗收紀錄

- `pnpm build`：exit 0。
- focused type-check：`@startkiter/ui`、`@startkiter/saas` 均 exit 0。
- focused SaaS regression：8 files、25 tests passed。
- `pnpm test`：42 files、162 tests passed；唯一失敗是 `packages/ui/src/version-gap.test.ts` 仍把已移除的 `radix-ui` 當作比較項，拋出 `missing both versions`。依既有裁決不修改該已知舊測試，因此 tasks 6.2、9.2 保持未勾選。
- ego-browser 本機 auth session 下完成六頁截圖：首頁、登入頁、後台首頁、課程頁、`/agent`、`/admin/settings`，檔案在 `docs/verification/rebuild-design-system-from-source/9.3-*.png`。DOM 驗證：前兩頁無 `[data-slot="sidebar"]`；四個後台頁有 sidebar/page-header；`/checkout` 無 sidebar；六頁 body font-family 都是 `Inter, "Inter Fallback", ui-sans-serif, system-ui, sans-serif`。
- 本機瀏覽器 LastPass extension 曾在註冊頁插入 DOM 造成 hydration warning；關閉浮層後重存六張圖，該 warning 屬瀏覽器外掛注入，不是本批次 source path。
