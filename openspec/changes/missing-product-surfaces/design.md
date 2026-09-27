## Context

**2026-09-27 更正**：原本此處的「課程頁領取代碼包」「LINE 學習群入口」兩項已作廢，改由 `buyer-journey-gap-completion` 處理（LINE 連結方向也已改為每門課各自資料庫欄位，不走全站環境變數＋獨立 API），本檔以下內容只保留優惠券／報表／通知三項，原本的 GitHub claim／LINE 段落已移除。

優惠券資料表 `Coupon` 已存在，代碼比對使用 `discountType` 值 `amount` 與 `percent`。正式程式只有驗證與核銷，沒有建立或停用。課程優惠券頁只列出目前使用者可管理課程裡、已被訂單用過的券。`Coupon` 沒有課程外鍵，因此建立動作不能開放給一般講師。

`BundlesSpreadsheet` 與 `CouponsSpreadsheet` 已能產出 xlsx。訂單與營收下載走 `admin.access`，按鈕元件的端點型別只有這兩條。通知建立函式 `createNotification` 目前只被 `createWelcomeNotification` 呼叫，使用者側路由只有列表、已讀與偏好。

## Goals / Non-Goals

**Goals:**

- 營運人員可建立一張優惠券並停用它。講師仍只看到自己範圍內已使用的券。
- 具 `admin.access` 的人可下載組合包與優惠券試算表。
- 營運人員可對一個已存在的使用者建立一則 `APP_UPDATE` 站內通知。該使用者若關閉此類型的站內通知，不寫入一列。

**Non-Goals:**

- 不改 `createNotification` 的參數形狀，不改 `createWelcomeNotification`。
- 不處理課程頁領取代碼包、LINE 學習群入口（已作廢，見 `buyer-journey-gap-completion`）。
- 不新增資料表、不改 `Coupon` 欄位、不新增通知類型。
- 不重做導覽、不補營收數字、不處理電子報自動化與雲端驗收。

## Decisions

### 優惠券建立與停用放在 coupons 套件，只有營運人員能呼叫

新增 `createCoupon` 與 `deactivateCoupon`。代碼先 trim 再轉大寫，與驗證函式同一規則。`discountType` 只接受 `amount` 與 `percent`。`amount` 必須有正整數 `amountOff`；`percent` 的 `percentOff` 必須是 1 到 100 的整數。重複代碼回傳衝突，不覆寫舊券。停用只把 `active` 設為 false，不刪列、不改 `timesRedeemed`。

頁面與 API 都用 `operatorHttpStatus`。講師看得到的列表查詢維持現狀。列表若讀到 `percent`，顯示百分比；現在的頁面把非 `PERCENT` 都顯示成金額，新建的 `percent` 券會被看錯，所以同一頁的顯示判斷改成認得 `percent`。

**Alternatives Considered**

- 在頁面裡直接 `db.coupon.create`：否決。驗證規則已經在 `packages/coupons`，再寫一套會分叉。
- 開放任何進得了這頁的講師建立：否決。券沒有課程外鍵，講師建立會變成全站券。

### 兩種新報表沿用訂單匯出的權限與回應形狀

新增兩支 `adminProcedure`，輸入是已查好的列，輸出 `{ filename, contentType, data }`，`data` 為 xlsx 的 base64。HTTP 路由先檢查 session 與 `admin.access`，再查資料、呼叫程序，並以附件回傳。組合包路由使用 `BundlesSpreadsheet`，優惠券路由使用 `CouponsSpreadsheet`。`ExportSpreadsheetButton` 的端點聯集加上這兩條路徑。空資料仍回 200 與一份只有表頭的檔案，不回 404。

**Alternatives Considered**

- 合成單一 `/api/export/:kind`：否決。訂單與營收已是獨立路徑，測試也鎖定路徑。
- 改用比 `admin.access` 更寬的營運人員判斷：否決。新報表與訂單報表應是同一扇門，避免營運 email 帳號突然多拿到訂單級匯出。

### 後台只發送 APP_UPDATE，不改建立函式

新增營運人員程序，輸入為目標 `userId`、標題與內文。程序確認目標使用者存在後，呼叫 `createNotification({ userId, type: APP_UPDATE, data: { title, message } })`。`createNotification` 在站內偏好關閉時不插入列；程序把「沒有插入」回成 `{ created: false }`，把有插入回成 `{ created: true, id }`。

**Alternatives Considered**

- 讓營運人員選 `WELCOME`：否決。歡迎通知已有專用函式，後台再發會跟註冊流程撞文案。
- 修改 `createNotification` 增加 `actorId`：否決。歡迎通知是現有呼叫端，簽名維持不動。

## Implementation Contract

### Behavior

- 未登入的人看不到課程首頁面板；直接打領取 POST 仍是既有 401。
- 已登入但沒有領取資格的人看到不可按的說明，面板不發送 POST。
- 建立優惠券：非營運人員 403；空代碼或折扣欄位不合規則 400 且不寫入；代碼已存在 409 且原列不變；成功 201，代碼為大寫。
- 停用優惠券：非營運人員 403；代碼不存在 404；成功後 `active` 為 false。
- 匯出：未登入 401，無 `admin.access` 403，通過者 200，內容類型為 xlsx。
- 發送通知：未登入 401，非營運人員 403，使用者不存在 404，成功且偏好允許為 201 並插入 `APP_UPDATE`，偏好關閉站內通知為 200 且不插入。

### Interface / data shape

- `createCoupon` 輸入：`{ code, discountType: "amount" | "percent", amountOff?: number, percentOff?: number, maxDiscountAmount?: number, maxRedemptions?: number, startsAt?: Date, expiresAt?: Date }`。成功回傳新建的券 id 與正規化代碼。失敗理由為 `invalid` 或 `duplicate`。
- `deactivateCoupon` 輸入為正規化前的代碼字串。失敗理由為 `not_found`。
- 優惠券管理 HTTP：`POST /api/coupons` 建立，`POST /api/coupons/deactivate` 停用。JSON 錯誤形狀為 `{ error: string }`。
- `GET /api/export/bundles` 與 `GET /api/export/coupons` 成功時內容類型為 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`。
- 通知程序輸入：`{ userId: string, title: string, message: string }`。標題與內文 trim 後不得為空字串，最長 120 與 500。

### Failure modes

- 匯出查無資料仍給空表，不把空表當成錯誤。
- 停用已停用的券仍回成功，`active` 維持 false。

### Acceptance criteria

- `packages/coupons` 測試覆蓋建立成功、重複代碼、percent 超出 1–100、停用不存在的代碼。
- `apps/saas` 路由測試覆蓋兩支匯出的 401 與 403，優惠券建立的 403 與 409，通知發送的 403、404 與偏好關閉不插入。

### Scope boundaries

- 範圍內：優惠券建立/停用、組合包/優惠券報表下載、站內通知發送三個入口與它們的權限檢查。
- 範圍外：電子報、正式站部署、營收數字、Organization 頁、課程頁領取代碼包、LINE 學習群入口（已作廢，見 `buyer-journey-gap-completion`）。

## Risks / Trade-offs

- [Risk] 講師利用優惠券頁建立全站券 → Mitigation：建立與停用同時在頁面與 `operatorHttpStatus` 擋住，講師查詢條件不改。
- [Risk] 改到 `createNotification` 讓歡迎通知不再寫入 → Mitigation：不改該函式簽名與歡迎通知呼叫，新程序是另一個呼叫端。
- [Risk] 優惠券匯出把代碼交給非管理員 → Mitigation：與 `GET /api/export/orders` 相同，先過 `admin.access`。

## Migration Plan

- 部署：這次沒有 Prisma 遷移。跟一般應用程式部署一起上線即可。
- 回滾：還原這次變更的應用程式版本。已建立的優惠券列與已寫入的通知列留在資料庫，不需要反向 SQL。回滾後，既有驗證與歡迎通知仍使用原來的表。

## Open Questions

無。環境變數未填時的行為已定為失敗關閉，不在這張變更裡發明預設邀請網址。
