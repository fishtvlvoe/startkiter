## Context

- 左側「控制台」目前是 `course-dashboard`（`/admin/course/dashboard`，`COURSE_ADMIN_APP`），頁面只呼叫 `getCourseDashboardMetrics(userId)` 顯示上架課程數、學員數、近 30 天營收。
- `apps/saas/modules/shared/lib/nav-menu-items.ts` 的 `getMountNavigationContext` 用「最長路徑比對到的 manifest 項目」決定工作區：`/admin/course/...` 比對到 app scope 的課程項目，`getAppRoleForPath` 設成課程 App 角色，NavBar 因此改畫課程管理員選單。只有比對不到任何項目的 `/admin/...` 才落回平台工作區。
- `/admin` 目前沒有 `page.tsx`；`admin/layout.tsx` 只做登入與權限檢查。
- 可用資料（2026-10-07 讀 `packages/database/prisma/schema.prisma` 確認）：`LessonPrivateMessage.readByTeacher`、`LessonComment.isRead` 與 `deletedAt`、`CourseReview.replyContent`（無審核狀態欄位）、`EmailDeliveryLog.status` 與 `createdAt`、`Order.status`（pending/paid/refunded）、`amount`、`paidAt`。
- 可用設定讀取：`getEmailSettingsSummary()`（`packages/mail/lib/email-settings.ts`，含 `activeProvider`）、`loadCheckoutGatewayCredentials()`（`packages/payments/gateway-settings.ts`，回傳 null 代表未設定）、`getInvoiceSettings()`（`packages/api/modules/course/lib/invoice-settings.ts`，含 `einvoiceEnabled`）、`readAiProviderSettings()`（`packages/ai/lib/provider-settings.ts`）、環境變數 `NEXT_PUBLIC_SUPPORT_EMAIL`。

## Design Source

- Source：`~/Downloads/startkiter-dashboard-mockup.html`，2026-10-07 Fish 回覆「可以」
- Cache：`.spectra/design-cache/platform-admin-dashboard/startkiter-dashboard-mockup.html`
- 關鍵值：

| 區塊 | 內容 | 版位 |
| --- | --- | --- |
| 數字概況 | 近 30 天營收、近 30 天訂單、學員總數、上架課程 | 4 欄，手機 2 欄 |
| 待處理 | 未讀學員私訊、未讀課程留言、未回覆評價、近 7 天寄送失敗信件，各附數字徽章與前往連結；0 用灰色徽章 | 左 1.3fr |
| 網站設定檢查 | 寄信、金流、電子發票、客服信箱、AI 助手，各列勾選或警示圖示＋狀態膠囊，點列前往設定頁 | 右 1fr |
| 最近訂單 | 最新 5 筆：時間、學員 email 遮罩、課程、金額 | 左 |
| 快速操作 | 新增課程、寫電子報、建立優惠券、查看前台 | 右 |
| 色彩 | 警示底 `#fff4e5` 字 `#b54708`；正常底 `#e8f5ea` 字 `#2f7a3a`；卡片邊框 `#e7e4da` 圓角 12px | — |

實作用 `@startkiter/ui` 的 `Card` 與既有 design tokens，圖示用 SVG，不用 Emoji。

## Goals / Non-Goals

**Goals:**

- `/admin` 一頁看到整站營運數字、待處理事項與設定是否完成
- 總管理員在任何後台頁都看到同一套選單
- 只讀既有資料，不改資料結構

**Non-Goals:**

- 期間對比百分比、圖表、小工具自訂
- 新的通知或已讀機制
- 課程管理員（非總管理員）的選單與課程儀表板內容

## Decisions

### 控制台資料集中在一支彙整函式

新增 `getPlatformDashboard(): Promise<PlatformDashboard>`（`packages/api/modules/admin/lib/platform-dashboard.ts`），用 `Promise.allSettled` 平行查詢各區塊，任一查詢失敗只讓該區塊回 `{ status: "unavailable" }`，其他區塊照常顯示。

Alternatives Considered：
- 頁面裡直接寫多個查詢：無法單元測試、失敗時整頁 500，否決。
- 每個區塊各開一支 API 由前端分別抓：多 5 次往返，且只是內部頁面，否決。

### 學員數與上架課程沿用 getCourseDashboardMetrics

總管理員呼叫 `getCourseDashboardMetrics(userId)` 時 `manageableCourseWhereForUser` 回 `{}`（全部課程），數字等於整站，不另寫一份。

Alternatives Considered：
- 另寫整站統計查詢：與課程儀表板算法分岔，日後兩邊數字對不上，否決。

### 「未讀」「未回覆」沿用既有欄位

未讀私訊 = `LessonPrivateMessage.readByTeacher = false`；未讀留言 = `LessonComment.isRead = false AND deletedAt IS NULL`；未回覆評價 = `CourseReview.replyContent IS NULL AND isVisible = true`；寄送失敗 = `EmailDeliveryLog.status = FAILED AND createdAt >= now - 7 天`。設計稿的「待審核評價」改為「未回覆評價」，因為評價沒有審核狀態欄位。

Alternatives Considered：
- 新增 `reviewStatus` 欄位做審核：需要 migration 與審核流程，超出範圍，否決。

### 設定檢查只回布林與顯示文字，不回憑證

每項回 `{ ok: boolean, label: string, href: string }`。金流以 `loadCheckoutGatewayCredentials() !== null` 判斷；回傳物件含金鑰，彙整函式內只取布林與 gateway 名稱。

Alternatives Considered：
- 直接把各設定 summary 傳給頁面：金流 credentials 含明碼，否決。

### 總管理員在 /admin/... 固定使用平台工作區

`getMountNavigationContext` 在 `platformAdmin === true` 且路徑以 `/admin` 開頭時，`resolutionPath` 設為 `/admin`、不設 App 角色，直接解析平台工作區；目前頁面的選取狀態仍由實際 pathname 比對。非總管理員維持現行邏輯。

Alternatives Considered：
- 把課程管理頁搬到 `/admin/platform/...` 網址：所有既有連結都要改，否決。
- NavBar 端覆寫 workspace：解析結果與 NavBar 不一致，帳號選單與手機分頁會各自判斷，否決。

### 控制台用新 mount entry，課程儀表板回課程子選單

新增 `admin-dashboard`（`/admin`，`PLATFORM_APP`，`section: "core"`，labelKey `admin.menu.dashboard`＝「控制台」）。`course-dashboard` 移除 `section`、加回 `groupId: "course-admin"`，顯示名改回「課程儀表板」。

Alternatives Considered：
- 讓 `course-dashboard` 改連 `/admin`：同一 id 指兩種頁面，課程管理員會失去課程儀表板，否決。

## Implementation Contract

**Behavior**

- 總管理員開 `/admin`：看到 5 個區塊；數字為 0 時顯示 0，不顯示空白。
- 某區塊查詢失敗：該區塊顯示「暫時無法載入」，其他區塊正常，頁面 HTTP 200。
- 待處理每列連結：私訊 → `/admin/course/messages`、留言 → `/admin/course/comments`、評價 → `/admin/course/review`、寄送失敗 → `/admin/email-settings`。
- 設定檢查每列連結：寄信 → `/admin/email-settings`、金流 → `/admin/settings/checkout-gateway`、電子發票 → `/admin/settings/einvoice`、客服信箱 → `/admin/email-settings`、AI → `/admin/settings/ai-provider`。
- 總管理員在 `/admin/course/dashboard`、`/admin/course/quiz` 等頁：左側仍是 5 分區選單，「課程」展開且對應子項選取。
- 非總管理員的課程管理員在 `/admin/course/...`：選單與現在相同。
- 非總管理員開 `/admin`：沿用 admin layout 既有檢查導回 `/`。

**Interface / data shape**

```ts
type Section<T> = { status: "ok"; data: T } | { status: "unavailable" };
type PlatformDashboard = {
  kpis: Section<{ revenueLast30Days: number; paidOrdersLast30Days: number; studentCount: number; publishedCourseCount: number }>;
  todos: Section<{ unreadMessages: number; unreadComments: number; unrepliedReviews: number; failedEmailsLast7Days: number }>;
  checks: Section<Array<{ key: "email" | "gateway" | "einvoice" | "supportEmail" | "ai"; ok: boolean; label: string; href: string }>>;
  recentOrders: Section<Array<{ id: string; paidAt: string; maskedEmail: string; courseTitle: string; amount: number }>>;
};
export async function getPlatformDashboard(userId: string, now?: Date): Promise<PlatformDashboard>;
```

- `maskedEmail`：本地部分保留第 1 個字，其餘換成 `***`，例 `a***@gmail.com`。
- 最近訂單只取 `status = paid`，依 `paidAt` 由新到舊 5 筆。

**Failure modes**

- 單一區塊查詢 throw：該區塊 `unavailable`，用 `logger.warn` 記錄區塊名稱，不記錄任何憑證。
- 沒有任何訂單：最近訂單顯示「還沒有訂單」。

**Acceptance criteria**

- `platform-dashboard.test.ts` 覆蓋 spec 所有 Example 與失敗情境
- `pnpm --filter @startkiter/api test`、`pnpm --filter @startkiter/platform test`、`pnpm --filter @startkiter/saas exec vitest run`、`pnpm --filter @startkiter/saas run type-check`、正式 build 全綠
- 部署後 ego-browser 桌面 1440 與手機 390：`/admin` 五區塊、點每個連結無 404/500、`/admin/course/quiz` 左側仍是總管理員選單

**Scope boundaries**

- In scope：上列彙整函式、`/admin` 頁、兩個 mount entry 調整、工作區判斷、i18n。
- Out of scope：Non-Goals 所列。

## Risks / Trade-offs

- [Risk] 工作區判斷改動影響所有 `/admin/course/...` 頁的 NavBar、帳號選單、手機分頁（L103 共用元件風險）→ Mitigation：先寫紅燈測試覆蓋總管理員與非總管理員兩種角色在 `/admin/course/quiz` 的解析結果；保留既有 `nav-menu-items.test.ts` 課程管理員案例預期不變。
- [Risk] 控制台每次載入發 10 次左右查詢 → Mitigation：全部 `count`／`aggregate`／`take: 5`，平行執行；量測正式站 `/admin` 回應時間（估計 1 秒內，未量測，部署後以 ego-browser 載入時間確認）。
- [Risk] 金流憑證物件被誤傳到前端 → Mitigation：彙整函式回傳型別不含憑證欄位，測試斷言回傳 JSON 不含測試用金鑰字串。

## Migration Plan

1. 合併部署即生效，無資料遷移。
2. 回滾：revert 本 change 的 commit。
