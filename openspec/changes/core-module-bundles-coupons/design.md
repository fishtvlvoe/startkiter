## Context

StartKiter 目前商品模型是單一常數（`packages/payments/constants.ts` 的 `MVP_SKU`／`MVP_AMOUNT_TWD`），結帳流程（`apps/saas/app/api/checkout/route.ts`）直接引用這三個常數，沒有商品目錄的概念。

THE-TU（`/Users/fishtv/Development/THE-TU-Project/dev/thetu`，只讀來源，禁止修改）已有成熟的 bundles／coupons 實作，Prisma schema 分別在 `prisma/schema.prisma` 的 `model Bundle`（400 行起）與 `model Coupon`（678 行起），API 在 `app/api/coupon/validate/route.ts`（含 rate-limit 防暴力枚舉優惠碼）。這張 change 把這兩塊抽成 StartKiter 自己的模組，並改造既有商品常數為可查詢的商品目錄。

老闆 2026-08-21 定案：AGENTS.md 已開放 THE-TU 這類模組抽取；統一走 `docs/buyer-extension-convention.md` 的 `packages/<name>/` 慣例，掛進既有 Mount Points（`packages/platform/src/mount-points.ts`）。

## Goals / Non-Goals

**Goals:**

- 課程可以組成「綁定包」商品，有獨立於單一課程的定價
- 結帳時可輸入折扣碼，驗證後套用折扣
- 商品目錄取代寫死的單一 SKU 常數，原本的 MVP SKU（8800 TWD）維持不變、只是變成目錄裡的一項
- 沿用 THE-TU 已驗證過的安全機制（coupon 驗證端點 rate-limit）

**Non-Goals:**

- 不做訂閱制定價與週期扣款（`payuni-recurring-billing` change 範圍）
- 不做多幣別
- 不搬 THE-TU Coupon schema 的 `firstTimeOnly`（首購限定）、`maxPerUser`（每人使用上限）——v1 範圍只要「固定金額或百分比折扣、可選有效期限、可選最大使用次數」
- 不做 bundle 內課程內容編輯（課程管理後台編輯器 change 範圍）
- 不做 coupon 前台促銷展示（例如首頁 banner），v1 只在結帳頁手動輸入

## Decisions

### 抽取對應：THE-TU → StartKiter

| 來源（THE-TU，只讀） | 目標（StartKiter，新建） |
|---|---|
| `dev/thetu/prisma/schema.prisma` `model Bundle`（400-424 行） | `packages/database/prisma/schema.prisma` 新增簡化版 `Bundle`／`BundleCourse` |
| `dev/thetu/prisma/schema.prisma` `model Coupon`（678-706 行附近） | `packages/database/prisma/schema.prisma` 新增簡化版 `Coupon` |
| `dev/thetu/app/api/coupon/validate/route.ts` | `apps/saas/app/api/coupons/validate/route.ts`（沿用 rate-limit 防枚舉的設計意圖，改用 StartKiter 既有的 auth/rate-limit 機制，不搬 THE-TU 的 `lib/rate-limit.ts` 實作） |
| `dev/thetu/app/(admin)/admin/bundles`、`app/(admin)/admin/coupons` | `apps/saas/app/(authenticated)/(main)/(account)/admin/bundles/`、`.../admin/coupons/`（視覺沿用 platform-shell-plugin-architecture 定案的 WordPress Admin 語彙，不沿用 THE-TU 原本的畫面樣式） |
| `dev/thetu/app/(main)/bundles`、`app/(main)/bundles/[slug]` | `apps/saas/app/(main)/bundles/[slug]/page.tsx`（前台 bundle 銷售頁，僅供參考購買流程結構，實際視覺另走 Demo-first） |

Alternatives Considered:
- 直接整包複製 THE-TU 的 Bundle/Coupon schema（含 firstTimeOnly／maxPerUser／minimumAmount） — 否決：v1 不需要這些欄位，先進資料庫的欄位之後要拿掉比一開始不加更麻煩
- 從零設計全新 schema，不參照 THE-TU — 否決：THE-TU 的欄位設計已經過實戰驗證（discountType 二擇一、maxDiscountAmount 上限），重新設計等於重造已解決的問題

### 商品目錄取代寫死常數

新增 `packages/payments/src/catalog.ts`，匯出 `getProduct(productId: string)`：`productId` 為 `"startkiter-mvp"` 時回傳原本的 `{ sku: MVP_SKU, amount: MVP_AMOUNT_TWD, currency: MVP_CURRENCY }`；為 bundle id 時查 `packages/bundles` 取得該 bundle 的價格。`apps/saas/app/api/checkout/route.ts` 改為先呼叫 `getProduct` 取得金額，而非直接引用常數。

Alternatives Considered:
- 保留 `MVP_SKU`／`MVP_AMOUNT_TWD` 常數不動，bundle 走完全獨立的第二套結帳邏輯 — 否決：兩套結帳邏輯並存會讓 coupon 折扣、PAYUNi 呼叫等共用邏輯要各寫一次，違反 DRY，且未來訂閱制商品也要掛進同一個目錄，及早統一介面
- 商品目錄改資料庫驅動（新增 Product 表取代所有寫死商品） — 否決：v1 只有 1 個固定 SKU + 動態 bundle，MVP SKU 本身不需要變成可編輯的資料庫紀錄，過度設計

### Coupon 驗證邏輯放進獨立 `packages/coupons/`，不放進 `packages/payments/`

Coupon 的驗證規則（折扣類型、有效期、使用次數）是獨立業務邏輯，不天生屬於金流套件；`packages/payments` 只需要呼叫 `packages/coupons` 匯出的 `validateCoupon()` 取得折扣結果，兩者維持 `docs/buyer-extension-convention.md` 規定的獨立套件邊界，互相不 import 對方內部檔案。

Alternatives Considered:
- Coupon 邏輯直接寫進 `packages/payments/` — 否決：`packages/payments` 已經是最大的既有套件（多個 provider），繼續塞會讓套件邊界模糊，違反既有的一模組一套件慣例

## Implementation Contract

**Behavior**（使用者可觀察的行為）：

- operator 在側邊欄「課程綁定包」頁面可以新增/編輯 bundle：選擇多個既有課程、設定組合價格、發布/下架
- operator 在側邊欄「優惠券」頁面可以新增/編輯 coupon：設定代碼、折扣類型（固定金額或百分比）、可選有效期限、可選最大使用次數
- 買家在結帳頁可以輸入折扣碼，系統即時驗證並顯示折扣後金額；折扣碼無效時顯示明確錯誤原因（不存在／已過期／已達使用上限）
- 買家購買 bundle 商品時，PAYUNi 結帳金額為 bundle 的組合價，付款成功後取得 bundle 內所有課程的存取權

**Interface / data shape:**

```ts
// packages/bundles/src/types.ts
type Bundle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  priceTwd: number;
  status: "draft" | "published" | "archived";
  courseIds: string[]; // 對應 packages/course 現有課程的 id
};

// packages/coupons/src/types.ts
type Coupon = {
  id: string;
  code: string; // 大寫，唯一
  discountType: "amount" | "percent";
  amountOff: number | null; // discountType === "amount" 時必填
  percentOff: number | null; // discountType === "percent" 時必填，1-100
  maxDiscountAmount: number | null; // percent 折扣的金額上限，選填
  maxRedemptions: number | null; // null 或 0 = 無限
  timesRedeemed: number;
  active: boolean;
  startsAt: string | null; // ISO datetime，null = 立即生效
  expiresAt: string | null; // ISO datetime，null = 永不到期
};

// packages/payments/src/catalog.ts
type Product = {
  productId: string; // "startkiter-mvp" 或 bundle id
  sku: string;
  amount: number;
  currency: "TWD";
};
function getProduct(productId: string): Promise<Product | null>;
```

- `GET /api/bundles` → 回傳已發布 `Bundle[]`（前台銷售頁用），未登入可存取
- `POST /api/bundles`／`PUT /api/bundles/:id` → operator 專用，新增/編輯 bundle
- `POST /api/coupons/validate` → body `{ code: string; productId: string }`，回傳 `{ valid: true, finalAmount: number, discountAmount: number } | { valid: false, reason: "not_found" | "expired" | "not_started" | "max_redemptions_reached" }`
- `POST /api/checkout` 既有端點擴充：body 新增可選 `productId`（預設 `"startkiter-mvp"`）與可選 `couponCode`

DB DDL（PostgreSQL，對應 Prisma model，簡化自 THE-TU）：

```sql
CREATE TABLE "Bundle" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priceTwd" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE INDEX "Bundle_status_idx" ON "Bundle"("status");

CREATE TABLE "BundleCourse" (
  "id" TEXT PRIMARY KEY,
  "bundleId" TEXT NOT NULL REFERENCES "Bundle"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "BundleCourse_bundleId_courseId_key" ON "BundleCourse"("bundleId", "courseId");

CREATE TABLE "Coupon" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "discountType" TEXT NOT NULL,
  "amountOff" INTEGER,
  "percentOff" INTEGER,
  "maxDiscountAmount" INTEGER,
  "maxRedemptions" INTEGER,
  "timesRedeemed" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL
);
CREATE INDEX "Coupon_active_idx" ON "Coupon"("active");
```

**Failure modes:**

- `POST /api/coupons/validate` 對不存在的 `code` → `{ valid: false, reason: "not_found" }`，回應一律 200（不用 404，避免用狀態碼洩漏碼是否存在的枚舉線索，行為對照 THE-TU 但簡化狀態碼設計）
- coupon 已過期（`expiresAt` 早於現在）→ `{ valid: false, reason: "expired" }`
- coupon 尚未生效（`startsAt` 晚於現在）→ `{ valid: false, reason: "not_started" }`
- `timesRedeemed >= maxRedemptions`（`maxRedemptions` 非 null 且非 0）→ `{ valid: false, reason: "max_redemptions_reached" }`
- `POST /api/coupons/validate` 短時間內同一 IP 大量請求 → 429（沿用既有 rate-limit 機制，具體門檻於 tasks 實作時對齊既有 API 慣例）
- `productId` 對應的 bundle 不存在或未發布 → `POST /api/checkout` 回 404
- Bundle 建立時 `courseIds` 含不存在的課程 id → 拒絕建立，回 400

**Acceptance criteria:**

- `pnpm test` 全綠
- `curl -X POST /api/coupons/validate` 對有效碼回傳正確折扣金額，對無效碼回傳對應 `reason`
- operator 側邊欄可見「課程綁定包」「優惠券」兩個新選單項目（`requiresOperator: true`）
- 買家用 bundle 商品完成 PAYUNi 結帳後，取得 bundle 內所有課程的存取權（沿用既有 `courseAccess` 授權欄位判斷邏輯，擴充為判斷是否屬於已購 bundle）
- 每個新增後台頁面（bundles、coupons 管理頁）的靜態 HTML demo 經老闆確認後才寫真代碼

**Scope boundaries:**

- In scope: `packages/bundles/`、`packages/coupons/`、商品目錄改造（`packages/payments/src/catalog.ts`）、結帳流程擴充支援 productId/couponCode、Mount Points 新增兩個 operator 選單、`Bundle`/`BundleCourse`/`Coupon` 三張新表、bundle 前台銷售頁
- Out of scope: 訂閱制商品、多幣別、coupon 進階規則（首購限定/每人上限）、bundle 內課程內容編輯、coupon 前台促銷展示

## Risks / Trade-offs

- [Risk] 商品目錄改造是 **BREAKING** 變更，既有結帳流程呼叫方式改變 → Mitigation: `productId` 設計為可選參數，預設值 `"startkiter-mvp"`，未傳入時行為與改造前完全一致，既有測試不需大幅修改
- [Risk] Coupon 驗證端點是公開端點，可能被暴力枚舉猜測有效碼 → Mitigation: 沿用既有 API 慣例加上 rate-limit；無效碼一律回 200 + reason，不用狀態碼區分「碼不存在」與「碼存在但過期」，降低枚舉線索
- [Risk] `mvp-offer`／`v1-scope-boundary` 兩份既有 spec 的「單一 SKU／固定 8800」Requirement 被放寬，可能影響其他依賴這條規則的既有邏輯（例如既有測試斷言金額恆為 8800）→ Mitigation: 修改前先跑一次 `pnpm test` 確認哪些既有測試斷言這個假設，逐一調整為「MVP SKU 商品固定 8800，但商品目錄可有其他項目」
- [Risk] Bundle 定價與既有課程存取權邏輯（`packages/course/access.ts` 的 `canAccessCourse`）的整合方式若沒設計好，可能出現「買了 bundle 但某堂課看不到」的授權漏洞 → Mitigation: tasks 階段安排專門的紅燈測試涵蓋「已購 bundle → bundle 內每一堂課都可存取」與「退款 bundle → bundle 內所有課程一併鎖回」兩個 scenario

## Migration Plan

部署步驟：

1. 合併資料庫 migration，新增 `Bundle`、`BundleCourse`、`Coupon` 三張表（新增表，不影響既有資料）
2. 部署 `packages/bundles`、`packages/coupons` 兩個新套件
3. 部署商品目錄改造（`packages/payments/src/catalog.ts`）與結帳流程擴充——因為 `productId` 為可選參數且預設值與改造前行為一致，此步驟對既有 MVP SKU 購買流程無感知影響
4. 部署 Mount Points 新增的兩個 operator 選單與對應後台頁面
5. 部署前台 bundle 銷售頁
6. 驗證通過後，`spectra archive` 前確認 `mvp-offer`／`v1-scope-boundary` 的 spec 修訂已反映實際行為

回滾策略：`Bundle`／`BundleCourse`／`Coupon` 為新增表，回滾可直接 `DROP TABLE`；商品目錄改造與結帳流程擴充可 `git revert`（因為預設行為與改造前一致，revert 無資料損失風險）；已建立的 bundle/coupon 資料若要保留供之後重新上線，不隨代碼回滾一併刪除，由 operator 自行決定是否清空。

## Open Questions

- Bundle 退款時，是否要求「整包退款」或允許「bundle 內單一課程退款」？THE-TU 原始設計未涵蓋這個情境，需要老闆裁決，暫時假設 v1 只支援整包退款（撤銷 bundle 內全部課程存取權），單一課程退款留待之後有需求再議
- Coupon 是否要支援「綁定特定 bundle」（只能用在某個 bundle，不能用在 MVP SKU 或其他 bundle）？THE-TU schema 有 `CouponBundles` 關聯，v1 暫時假設 coupon 是全站通用（可用在任何商品），綁定特定商品留待之後有需求再議
- rate-limit 的具體門檻數字（每分鐘幾次請求）留待 tasks 實作時對齊 StartKiter 既有 API 的 rate-limit 慣例（若尚無既有慣例，實作時一併建立）
