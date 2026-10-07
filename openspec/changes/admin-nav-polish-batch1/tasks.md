## 1. 紅燈測試

- [ ] 1.1 依「Collapsible section headings」「Expandable parent items」「Accessible custom group controls」在 `apps/saas/modules/shared/components/NavBar.test.tsx` 用客戶端渲染＋點擊新增紅燈測試：Example 表三列（預存收合 vs 目前頁）、在 `/admin/settings/einvoice` 點系統設定可收起且 `aria-expanded="false"`、子選單項目是 Next.js `Link`（以 mock `next/link` 斷言被使用，或斷言點擊時呼叫 router 而非整頁導向）、分區／子選單／自訂分組按鈕皆有 `aria-expanded` 與指向存在 id 的 `aria-controls`、改名按鈕 `aria-label="重新命名分組"`。既有測試預期不改。驗證：`pnpm --filter @startkiter/saas exec vitest run modules/shared/components/NavBar.test.tsx` 新測試失敗、舊測試仍綠。
- [ ] 1.2 依「Widget does not cover the mobile tab bar」新增 `apps/saas/modules/deployment/components/SupportWidget.test.tsx` 紅燈測試：外層容器 class 含手機底部偏移（≥ 80px，對應 Tailwind `bottom-20` 以上）與 `md:bottom-6`。驗證：新測試失敗。

## 2. 實作

- [ ] 2.1 [after: 1.1] 修改 `NavBar.tsx`：子選單 `<a>` 改 `Link`；展開狀態改為「在子頁時預設展開、使用者手動收起後收起」；目前頁所在分區強制展開；三種展開按鈕補 `aria-expanded`／`aria-controls` 與對應容器 id；改名按鈕補 `aria-label` 與 `focus-visible:opacity-100`；未分組項目的分區計算提到元件頂層 `useMemo`。不得重新引入 render 期間讀 localStorage（避免 hydration 不一致）。驗證：1.1 全綠，`pnpm --filter @startkiter/saas exec vitest run` 全綠。
- [ ] 2.2 [after: 1.2] 修改 `SupportWidget.tsx` 外層定位為手機 `bottom-20`、`md:bottom-6`。驗證：1.2 轉綠。

## 3. 驗收

- [ ] 3.1 [after: 2.1, 2.2] 跑 `pnpm --filter @startkiter/saas run type-check` 與正式 build。PM 親審 diff 後部署，正式站 ego-browser：桌面 1440 在 `/admin/course/quiz`（先把內容分區收起再重新整理）內容分區展開且測驗管理亮起、在發票設定頁可收起系統設定、點子選單切頁網址變但頁面不整頁重載（以 `performance.getEntriesByType('navigation')` 數量不變判斷）；手機 390 客服泡泡與底部選單不重疊（量兩者座標）。截圖存 `~/Downloads/sk-batch1-*.png`。驗證：截圖與量測數字。
