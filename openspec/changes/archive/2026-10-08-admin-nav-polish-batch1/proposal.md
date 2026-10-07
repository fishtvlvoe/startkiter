## Why

2026-10-07 全站 UI 巡查（`~/Downloads/sk-ui-audit/report.md`，98 條）第 1 批：左側選單與全站共用元件。實測與程式碼核實的問題：子選單連結用原生連結、每點一次整頁重新載入；在子頁時子選單收不起來；分區收合後人在該分區子頁也不會打開，看不出目前位置；展開／收合按鈕沒有給螢幕閱讀器的狀態；手機版右下客服泡泡壓在底部選單上。

## What Changes

- 修改側邊欄子選單連結：改用 Next.js 站內連結，切頁不再整頁重新載入
- 修改子選單展開邏輯：在子頁時預設展開，但使用者可以手動收起
- 修改分區收合：目前頁面所在的分區一律展開，不受先前收合紀錄影響
- 新增無障礙屬性：分區、子選單、自訂分組的展開按鈕補 `aria-expanded` 與 `aria-controls`；分組改名按鈕補 `aria-label` 並在鍵盤聚焦時可見
- 修改 `apps/saas/modules/deployment/components/SupportWidget.tsx`：手機版（md 以下）客服泡泡移到底部選單上方，不再遮住
- 重構 `SidebarGroupedNav` 未分組項目的分區計算，改為頂層 `useMemo`，移除 JSX 內的立即執行函式

## Non-Goals

- 不做拖曳分組的鍵盤替代操作（巡查第 C07 條，屬新功能，排到第 5 批）
- 不處理展開狀態載入後的版面跳動（C06）：要改成 cookie 由伺服器帶出，牽動 layout，另評估
- 「系統設定」上層沒有自己的頁面入口（C05）維持現狀：`/admin/settings` 目前只有標題卡，刻意不列為子項
- 手機各頁跑版、用語、空白頁、新增功能：分別在第 2 到 5 批
- 學員端選單是否加入「我的網站」：屬產品決策，第 4 批再問

## Capabilities

### New Capabilities

- `floating-support-widget`: 客服浮動按鈕在手機版的位置不得遮住底部選單

### Modified Capabilities

- `admin-sidebar-sections`: 子選單連結站內切換、子頁可手動收起、目前頁所在分區強制展開、展開按鈕無障礙屬性

## Impact

- Affected specs: `floating-support-widget`（新）、`admin-sidebar-sections`
- Affected code: `apps/saas/modules/shared/components/NavBar.tsx`、`apps/saas/modules/shared/components/NavBar.test.tsx`、`apps/saas/modules/deployment/components/SupportWidget.tsx`
- Dependencies 新增：無
- 環境變數新增：無
