## Why

優惠券建立、組合包／優惠券報表、後台發送通知是程式有能力、畫面沒有入口。這三個洞讓營運人員做不了這些管理動作，已經拖太久。

**2026-09-27 更正**：原本這裡還包含「課程頁領取代碼包」「LINE 學習群入口」兩項，跟另一張新卡 `buyer-journey-gap-completion`（2026-09-24 開）重複，而且做法互相衝突（LINE 連結這裡原本規劃走全站環境變數＋新開 `GET /api/community/line-invite`，新卡改成每門課各自一個資料庫欄位、不開新 API，是 Fish 2026-09-24 當面修正的方向）。Fish 2026-09-27 裁決：作廢這裡的兩項，採用新卡的做法；這裡只保留原本沒有衝突的優惠券／報表／通知三項。

## What Changes

- 新增 `packages/coupons` 的建立與停用函式，並在 `apps/saas/app/(authenticated)/(main)/(account)/admin/course/coupons/page.tsx` 加上營運人員可送出的表單；講師既有的「只看自己課程已使用券」列表維持不變。
- 新增 `apps/saas/app/api/export/bundles/route.ts` 與 `apps/saas/app/api/export/coupons/route.ts`，沿用訂單匯出的 `admin.access` 檢查，並把下載按鈕接到組合包管理頁與優惠券頁。
- 新增營運人員發送一則 `APP_UPDATE` 站內通知的程序與後台表單，呼叫既有 `createNotification`，不改歡迎通知的呼叫方式。
- 修改 `apps/saas/modules/admin/component/ExportSpreadsheetButton.tsx`，讓端點型別納入上述兩條新匯出路徑。

## Non-Goals

- 不重做導覽、首頁或整套後台視覺。上一輪沒有留下新的畫面稿，這張變更只補斷掉的入口。
- 不處理 `newsletter-automation-integration` 剩餘工作，也不改寄信 provider。
- 不執行正式站回滾、真實付款、真實寄信或登入後瀏覽器驗收。那些留在既有變更，沒有測試站或授權前不能勾完成。
- 不移除 Organization 頁面，也不裁決「不做多租戶」與 `organization-tenancy` 規格的矛盾。
- 不把 `/admin/revenue` 空殼補上真實營收數字。
- 不新增通知類型或發送對象以外的廣播規則；類型仍只有 `WELCOME` 與 `APP_UPDATE`。
- 不新增 npm 依賴，不改 Prisma `Coupon` 欄位。

## Capabilities

### New Capabilities

- `coupon-administration`: 營運人員可建立一張優惠券並停用它，不必直接改資料庫。結帳驗證的狀態碼契約不變。

### Modified Capabilities

- `sheets-export-engine`: 組合包與優惠券試算表除了能產出檔案，還要能由具備 `admin.access` 的人從既有管理頁下載。
- `notifications`: 具備營運權限的人可對指定使用者建立一則 `APP_UPDATE` 站內通知；使用者若已關閉該類型的站內通知，則不寫入。

## Impact

- Affected specs: `coupon-administration`（新增）、`sheets-export-engine`、`notifications`。
- Affected code: `admin/course/coupons`、`admin/course/bundles`、`app/api/export/bundles`、`app/api/export/coupons`、`packages/coupons`、`packages/api` 通知程序、`packages/sheets` 既有模板的呼叫端、`ExportSpreadsheetButton`。
- Dependencies 新增: 無。
- 環境變數新增: 無。
