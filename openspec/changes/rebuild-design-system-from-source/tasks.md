## 1. Token/CSS 架構重整

- [x] 1.1 撰寫測試驗證 Decision「CSS/token 架構：token 抽成獨立共用包，globals.css 只留 base 樣式」——斷言 `packages/tooling/tailwind/theme.css` 檔案存在且定義 `--background`、`--primary`、`--border` 等核心 CSS 自訂屬性，驗證方式：新增測試，目前為紅燈（檔案不存在）
- [x] 1.2 建立 `packages/tooling/tailwind/theme.css`，依 Decision「配色：完整採用官方 olive 色階，不做客製化偏移」把 `vendor/supastarter-nextjs/packages/tooling/theme.css` 的 olive 色階 CSS 自訂屬性完整複製進來（不做客製化偏移），滿足 Requirement「Design tokens are ported, not approximated」，驗證方式：1.1 測試轉綠燈
- [x] 1.3 撰寫測試驗證 `apps/saas/app/globals.css` 透過 `@import` 引入新建的 `packages/tooling/tailwind/theme.css`，且檔案總行數精簡到 100 行以內（比照官方 41 行的精簡程度），驗證方式：新增測試斷言 import 語句存在且行數門檻，目前為紅燈
- [x] 1.4 移除 `apps/saas/app/globals.css`／`apps/saas/app/design-system.css` 內嵌的 zinc/slate 色階與重複 token 定義，改為 `@import "../../../packages/tooling/tailwind/theme.css"`，驗證方式：1.3 測試轉綠燈，且 `grep -rn "color-zinc\|color-slate" apps/saas/app/globals.css apps/saas/app/design-system.css` 確認無殘留

## 2. 字體策略調整

- [x] 2.1 撰寫測試驗證 Decision「字體：SaaS 後台純 Inter，拿掉 DM Sans + Noto Sans TC fallback」——斷言 `apps/saas` 底下所有 CSS／layout 檔案不再宣告 DM Sans 或 Noto Sans TC 字體，驗證方式：新增測試取代原本斷言 CJK fallback 的 `apps/saas/lib/font-fallback.test.ts`，目前為紅燈
- [x] 2.2 移除 DM Sans 與 Noto Sans TC 字體宣告，`apps/saas` 全站改用 Inter（含 `apps/saas/app/layout.tsx` 的 `next/font/google` 設定），滿足移除後的 Requirement「Chinese text renders with a CJK font fallback」（已由本 change 的 spec delta REMOVED），驗證方式：2.1 測試轉綠燈
- [x] 2.3 用 ego-browser 對首頁「取得開站包 NT$8,800」這類中英混排文字截圖，確認 Inter 系統字體 fallback 鏈渲染出可讀的中文字（非空白或缺字方塊），驗證方式：截圖存檔並附人工確認結論

## 3. 元件庫替換：基礎顯示元件（Button／Card／Badge）

- [x] 3.1 撰寫測試驗證 Decision「元件庫遷移：逐元件源碼比對搬遷，不是重新設計」的 Button／Card／Badge 部分——延續既有 `data-slot` 屬性斷言（`packages/ui/src/components.test.tsx`），額外斷言元件原始碼 import 自 `@base-ui/react` 而非 `radix-ui`，驗證方式：新增 import 來源檢查測試，目前為紅燈
- [x] 3.2 執行 `pnpm --filter=ui shadcn add --base base button card badge`，用 Base UI 版本元件取代 `packages/ui/src/components/button.tsx`、`card.tsx`、`badge.tsx` 現有 Radix UI 實作，滿足 Requirement「UI components come from the shared design system」，驗證方式：3.1 測試轉綠燈
- [x] 3.3 更新 `apps/saas/app/page.tsx`、`apps/saas/app/app/page.tsx` 等呼叫這三個元件的頁面，適配 Base UI 版本的 props 介面差異，驗證方式：既有 `apps/saas/lib/home-shell.test.ts`、`apps/saas/lib/app-home.test.ts` 保持綠燈且 `pnpm --filter @startkiter/saas type-check` 通過

## 4. 元件庫替換：表單元件（Input／Form／Label）

- [x] 4.1 撰寫測試驗證 Input／Form／Label 元件 import 自 `@base-ui/react`，延續 `data-slot="input"` 既有屬性斷言，驗證方式：新增測試，目前為紅燈
- [x] 4.2 執行 `pnpm --filter=ui shadcn add --base base input form label`，取代 `packages/ui/src/components/input.tsx`、`form.tsx`、`label.tsx` 現有實作，驗證方式：4.1 測試轉綠燈
- [x] 4.3 更新 `apps/saas/app/login/login-form.tsx`、`apps/saas/app/signup/page.tsx` 適配新元件 props 介面，滿足 Requirement「UI components come from the shared design system」的登入表單場景，驗證方式：既有 `apps/saas/lib/login-design-system.test.ts` 保持綠燈

## 5. 元件庫替換：互動元件（Tooltip／Spinner／ColorModeToggle）

- [x] 5.1 撰寫測試驗證 Tooltip／Spinner／ColorModeToggle 元件 import 自 `@base-ui/react`，且 Decision「Dark and light mode share the same component system」描述的 `.dark` class 切換行為維持不變，驗證方式：新增測試，目前為紅燈
- [x] 5.2 執行 `pnpm --filter=ui shadcn add --base base tooltip spinner`，取代 `packages/ui/src/components/tooltip.tsx`、`spinner.tsx` 現有實作；`color-mode-toggle.tsx` 改用 Base UI 的狀態管理原語重寫深色模式切換邏輯，驗證方式：5.1 測試轉綠燈
- [x] 5.3 用 ego-browser 對首頁與後台首頁分別測試深色/淺色模式切換，確認切換後 `document.documentElement.classList.contains('dark')` 正確變化且視覺無跳動或殘留樣式，驗證方式：Requirement「Dark and light mode share the same component system」的既有測試場景保持綠燈，並截圖存檔佐證

## 6. 移除 Radix UI 依賴

- [x] 6.1 確認 `packages/ui/src` 底下所有元件檔案不再 import 任何 `radix-ui` 相關套件，滿足 Decision「元件庫遷移：逐元件源碼比對搬遷」的完成狀態，驗證方式：`grep -rn "from \"radix-ui\"\|from 'radix-ui'" packages/ui/src` 無匹配結果
- [ ] 6.2 從 `packages/ui/package.json` 移除 `radix-ui` 依賴、新增 `@base-ui/react` 依賴，滿足 Impact 段落宣告的依賴變更，驗證方式：`pnpm install` 後 `pnpm --filter @startkiter/ui type-check` 與 `pnpm --filter @startkiter/ui test` 皆通過

## 7. 型別化權限

- [ ] 7.1 撰寫測試驗證 Requirement「Operator role determines visible permission-gated navigation」的三個 Scenario——分別斷言 instructor 角色只看到課程內容管理導覽、owner 角色看到全部權限導覽、角色無法解析時側欄不顯示任何權限限定導覽項且不拋出例外，驗證方式：新增 `apps/saas/lib/permissions.test.tsx`，目前為紅燈
- [ ] 7.2 依 Decision「型別化權限與多租戶切換器：對接 organization-role-model 既有角色矩陣」實作 `usePermissions` hook 與 `PermixProvider`，讀取 `organization-tenancy` capability 定義的 owner/admin/instructor/user 權限矩陣進行型別化權限判斷，取代 `apps/saas/lib/operator.ts` 現有的布林 `requiresOperator` 判斷，驗證方式：7.1 測試轉綠燈
- [ ] 7.3 更新 `apps/saas/app/components/app-shell.tsx` 的側欄導覽渲染邏輯改用 `usePermissions` 判斷各導覽項目可見性，驗證方式：既有 `apps/saas/lib/platform-shell.test.tsx` 保持綠燈且新增的權限測試涵蓋 AppShell 渲染結果

## 8. 多租戶切換器

- [ ] 8.1 撰寫測試驗證 Requirement「Multi-organization users can switch active organization from the shell」的三個 Scenario——多組織使用者看到切換器、單組織使用者不看到切換器、切換組織後資料範圍更新，驗證方式：新增 `apps/saas/lib/organization-switcher.test.tsx`，目前為紅燈
- [ ] 8.2 實作 `OrganizationSelect` 元件加入 AppShell 側欄使用者區塊，串接 `organization-role-model` 已封存 change 定義的 Organization/Member 資料模型讀取使用者所屬組織清單，驗證方式：8.1 測試轉綠燈

## 9. Review 與驗收

- [ ] 9.1 對第 1-8 節的程式碼變更跑一輪 correctness／security／performance 三角度 code review，涵蓋元件庫替換是否遺漏 Radix UI 殘留、型別化權限是否有繞過路徑、多租戶切換是否有資料洩漏風險，驗證方式：Review 報告列出的 Critical 發現數為零，報告存成 `docs/cr-report-rebuild-design-system-from-source.md` 並 commit
- [ ] 9.2 執行 `pnpm build` 與 `pnpm test` 全專案，驗證方式：兩個指令皆以 exit code 0 結束
- [ ] 9.3 用 ego-browser 對首頁、登入頁、後台首頁、課程頁、`/agent`、`/admin/settings` 六個頁面分別截圖，確認 olive 配色與 Inter 字體一致套用，且比對 `platform-shell-plugin-architecture` Phase 1 已完成的 Shell 統一結構未被破壞（`/agent`、`/admin/settings` 仍是側欄結構，`/checkout` 仍未套殼），驗證方式：六張截圖存檔並附比對結論
