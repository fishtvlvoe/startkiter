## Context

`extract-payuni-checkout` 已封存：登入後可建 8800 Order，PAYUNi notify 會把 `courseAccess`／`kitClaimEligible` 打開。站上仍無課程播放入口，`courseAccess` 無法被產品路徑驗證。

來源只讀：`/Users/fishtv/Development/THE-TU-Project/dev/thetu` 的觀看／權限畫面與相關 hooks（改寫抽進 `packages/course`）。不准抽學院營運、電子報、作業、優惠券。不准改來源 repo。

## Goals / Non-Goals

**Goals:**

- 付費學員（Order.courseAccess=true）可在站內列出單元並播放
- 未付費／退款後（courseAccess=false）請求播放回 HTTP 403，且不回傳媒體本體
- 課程是 sellable site 上的一個模組，不是整站唯一長相

**Non-Goals:**

- GitHub kit claim／collaborator API
- LINE 社群邀請 UI
- site-agent
- 完整 CMS／課程編輯器／作業／優惠券
- 精確觀看秒數報表（可留最小 progress 欄位，但不做分析後台）

## Decisions

### Decision: Entitlement 只讀 Order.courseAccess

播放授權以該 user 是否存在至少一筆 `sku=startkiter-mvp` 且 `courseAccess=true` 的 Order 為準。不另建 Enrollment 表。

Alternatives Considered:

- 新建 Enrollment 表 → 否決：與已落地雙旗標重複，易漂移
- 只看 status=paid → 否決：退款後 status=refunded 但必須同時看 courseAccess=false

### Decision: 課程目錄先用套件內靜態 manifest

`packages/course` 內建 `lessons` 常數（id、title、mediaUrl 或 placeholder）。MVP 不抽完整 CMS。

Alternatives Considered:

- 立刻建 Prisma Lesson／Media 表 → 否決：本刀目標是權限閘＋播放殼，內容營運可後補
- 硬編碼在 apps/saas page → 否決：模組邊界不清，難測

### Decision: 改寫抽 thetu 播放殼，不拷學院路由樹

來源對應（只讀 → 目標）：

- thetu 觀看／權限相關 UI／hooks → `packages/course/src/`
- apps/saas 掛載薄路由（例如 `/course`、`/course/[lessonId]`）呼叫套件 API

Alternatives Considered:

- 整包搬 thetu app/course → 否決：會帶入學院營運
- 全新自寫播放器、完全不看 thetu → 否決：重複造輪，違反白名單改寫抽策略

### Decision: 播放 API 與頁面雙層閘

Server Component／API 都必須檢查 courseAccess。前端隱藏按鈕不算授權。

Alternatives Considered:

- 只靠 client 隱藏 → 否決：可直打 URL
- 只靠 middleware cookie flag → 否決：與 Order 真相不同步

## Implementation Contract

Behavior:

- 已登入且 courseAccess=true：可開啟課程列表與單元播放頁，媒體可載入
- 已登入但 courseAccess=false 或未登入：播放請求 HTTP 403，回應不得含媒體 URL／串流本體
- 退款後同一 user 再打播放 API → 403

Interface / data shape:

- `canAccessCourse(userId): Promise<boolean>`（讀 Order）
- `listLessons(): LessonSummary[]`
- `getLesson(lessonId): LessonDetail | null`
- SaaS routes：課程列表與 `/course/[lessonId]`（實際 path 可微調，但必須在 apps/saas）

Failure modes:

- 未登入 → 401 或導向登入（與現有 auth 一致）
- 無授權 → 403
- 未知 lessonId → 404
- 不因缺媒體設定而回 500 暴露堆疊；缺設定 fail-closed 明確錯誤

Acceptance criteria:

- Vitest：有／無 courseAccess 的授權函式測試
- 手動或 route test：付費可進、未付費 403
- `spectra validate extract-course-module` 通過
- 來源 thetu scoped path `git status`／`git diff` 無修改

Scope boundaries:

- In: packages/course、apps/saas 課程路由、必要的最小 DB（僅當 progress 必備時）、文件標註現行施工
- Out: GitHub kit、LINE 社群、site-agent、發票、Shopline／Stripe

## Risks / Trade-offs

[Risk] 靜態 manifest 的 mediaUrl 洩漏 → Mitigation: 播放 URL 只在授權通過後回傳；公開頁不嵌未授權 URL

[Risk] 改寫抽過大帶入學院功能 → Mitigation: tasks 白名單檔案；禁止拷 coupons／homework／newsletter

[Risk] courseAccess 與 session user 對錯人 → Mitigation: 一律用 session.user.id 查 Order，禁止 client 傳 userId 覆寫

## Migration Plan

1. 落地 packages/course + 測試
2. 掛 apps/saas 路由
3. 用一筆 paid／refunded fixture 驗證 200／403
4. 回滾：移除課程路由與套件 export；Order 旗標保留不動

## Open Questions

- MVP 第一支媒體要用真實 signed URL 還是 placeholder player？
- 是否本刀就要寫 LessonProgress 表，或只做「能播」？
