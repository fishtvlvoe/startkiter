## Why

StartKiter 公開銷售頁目前只顯示一門固定 8800 元商品，Course 沒有自己的售價；買家無法從前台瀏覽多門課並購買選定課程。現行 access resolver 又把 legacy MVP SKU 當成所有課程的權限，因此擴成多課程前必須先修正課程資格映射，並把唯一 GitHub 代碼包與課程教材分開。

## What Changes

- 新增多門已發布課程的公開目錄與個別銷售頁，保留現有 /course MVP 銷售頁。
- 新增單課 CourseOffer，保存售價與發布狀態，不把商品價格放進 Course 教學內容。
- 新增 OrderCourseEntitlement snapshot，付款時記錄實際授予的 courseId，將 startkiter-mvp 舊訂單固定映射到既有原課程。
- 修改 checkout 商品解析，支援 CourseOffer 的伺服器售價與 PAYUNi，登入返回時保留選定課程。
- 新增逐課程交付：課程權限、該課的 LINE 邀請與既有 CourseWelcomeEmail。
- 擴充唯一 GitHub CodePackage 資格：舊開站包、單門課與課程組合包都可取得同一種代碼包；每位買家仍由單一模板取得一個個人 repo，多買不重複建 repo；使用 pull 唯讀權限。
- 修改 GitHub kit claim eligibility 與退款彙總，只有仍有有效 CodePackage 訂單時保留 repo。
- 使用 additive migrations、legacy mapping preflight 與 rollback gate；不刪除現有 Course、Order、Bundle 或 Grant 資料。

## Non-Goals

- 不建立 CRM、分眾、電子報行銷、SMS、漏斗編輯器或完整網站編輯器。
- 不把教學影片、教材或課程內容搬進 GitHub CodePackage。
- 不建立每課不同 CodePackage、模板或 repository。
- 不修改 Bundle 管理／買家頁，也不併入 buyer-bundle-checkout-entry 尚未完成的正式站付款驗收。
- 不新增付款 gateway、登入 provider 或環境變數。

## Capabilities

### New Capabilities

- `public-course-storefront`: 公開列出多門有售價的已發布課程，提供課程詳情、價格、預覽與購買入口。
- `course-offer-commerce`: 為單門 Course 管理單次 TWD CourseOffer，使用伺服器商品目錄完成 PAYUNi checkout，並在付款時 snapshot 課程權限。
- `course-purchase-fulfillment`: 以付款訂單交付精確課程權限、逐課 LINE 邀請／歡迎信及全站唯一 CodePackage 資格。

### Modified Capabilities

- `github-kit-fulfillment`: CourseOffer 與 Bundle 訂單可取得唯一 CodePackage claim eligibility；每位買家維持一個專屬 repo；GitHub 權限改為 pull 唯讀；退款只有在沒有其他有效合格訂單時才撤銷。
- `payuni-checkout`: CourseOffer 與 Bundle 使用伺服器已保存的商品代碼、價格與幣別完成付款，不沿用只接受 legacy MVP SKU／價格上限的通知判斷。

## Impact

- Affected specs：新增上述 3 個 capability；修改 `openspec/specs/github-kit-fulfillment/spec.md` 的 claim eligibility 與 repository permission requirements，以及 `openspec/specs/payuni-checkout/spec.md` 的商品價格與付款通知規則。`course-bundles`、`course-module`、`line-learner-community`、`einvoice-issuance` 作為相容性依據。
- Affected code：`apps/marketing` course catalog/detail/CTA；`apps/saas` CourseOffer management、public catalog API、checkout page/API、PAYUNi notify、refund/GitHub claim；`packages/database` additive CourseOffer/OrderCourseEntitlement schema；`packages/payments` catalog；`packages/course` access；`packages/api/modules/course` welcome email/LINE access。
- Dependencies 新增：無；沿用 Next.js、React、TypeScript、Prisma/PostgreSQL、oRPC、PAYUNi、GitHub App、mail 與現有 UI packages。
- Environment variables 新增：無。
- Prerequisites：先讀既有 buyer-bundle-checkout-entry 實作與 task 7.2 外部驗收狀態；本 change 不重做其已完成 Bundle buyer routes。2026-10-13 本 change 位於 active changes 且已有工作樹程式修改；施工狀態以實際 diff 與各項驗收證據為準。結帳相關修改須先核對 route／資料責任，不因本 change active 就視同 Bundle 的外部付款驗收已通過。總計畫對接與進入／退出條件見 `docs/blueprint/creator-platform-development-handoff.md`。
