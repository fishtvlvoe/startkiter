## Why

StartKiter 已完成底層地基（登入、課程播放引擎、後台外殼/Plugin、通知系統），但交付面向（官網部署、行銷內容、買家文件站、乾淨安裝包、課程生命週期通知）尚未開始，且散落在 4 張獨立 parked change 加 1 張未啟動的 in-progress change 裡，沒有單一地方可以看到全貌與排序。這張 change 是總覽與排序控制點，不是新功能實作。

## What Changes

- 建立一個總覽 tasks.md，把既有 5 張 change 的 apply 順序、驗收標準、Fish 決策點統一列出，取代散落在 docs/discuss/ 的非正式筆記
- 依序驅動（本 change 的 tasks 本身就是「派工 + 驗收」動作，不是重寫已有 change 的內容）：
  1. `vps-production-deployment`（修復 `startkiter.dev` 503，最急）
  2. `marketing-site-real-content`（换真實定價與文案）
  3. `buyer-docs-site`（`docs.startkiter.dev`）
  4. `plan-clean-install-package-repo`（買家最終交付的乾淨代碼包）
  5. `course-lifecycle-email`（訂閱到期等生命週期通知）
- 每張子 change 完成 apply + 獨立 CR 乾淨後，本 change 對應 task 才勾選；archive 決策一律回報 Fish，不自動 archive

## Non-Goals

- 不重新定義任何子 change 的 proposal/design/specs 內容——子 change 各自的範圍與驗收標準以其自己的 artifacts 為準，本 change 不覆寫
- 不引入新的 Core 能力或新 capability，純粹是執行排序與驗收追蹤
- 不包含 `multi-gateway-checkout` 卡 Stripe 正式憑證的部分（那是既有 change 本身的卡點，等 Fish 提供憑證，不在本次排序範圍內）

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected specs: 無新增/修改 capability，本 change 不產生 specs/ 目錄
- Affected code:
  - New: `docs/discuss/2026-08-27-product-delivery-master-roadmap.md`（總覽文件，非程式碼，隨本 change 一併維護）
  - Modified: 依序由 5 張子 change 各自的 tasks.md 定義（見各子 change）
