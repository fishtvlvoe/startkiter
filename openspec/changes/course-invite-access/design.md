## Context

跟 `payuni-recurring-billing` 擴充 `BundleCourseAccessReader` 新增 `hasActiveSubscription` 同一模式：`canAccessCourseId`（`packages/course/access.ts`）是依賴注入 reader，不直接呼叫 db，這次延續同一模式新增第四種授權來源。

`CourseInvite.tokenHash` 是 unique 索引欄位，查詢兌換請求時用 hash 值透過資料庫索引查找對應記錄（不是逐字元比對明文 token），天然避免 timing attack，不需要額外的 `timingSafeEqual` 比對機制（那是用於「已知雙方都有的密鑰做訊息驗證」情境，跟這裡「查詢是否存在某個 hash 值」的情境不同）。

## Goals / Non-Goals

**Goals:**

- 邀請碼以 hash 存放，明文只在建立時回傳一次
- 兌換規則正確：限 email、限次數、限期限、可停用
- `canAccessCourseId` 新增邀請來源判斷，延續既有依賴注入模式

**Non-Goals：**（同 proposal.md）

## Decisions

### Decision: Token 以 hash 存放，查詢走資料庫索引比對而非逐字元比對

建立邀請時產生一個高熵隨機字串（32 bytes，`node:crypto` 的 `randomBytes`），只在 API 回應中回傳一次明文（供 operator 複製連結），資料庫只存 `sha256` hash（`tokenHash`，unique 索引）。兌換時對輸入 token 算 hash 後直接查資料庫 `tokenHash = ?`，找不到即視為無效。

Alternatives Considered:
- 明文存 token → 否決：資料庫洩漏時邀請碼可直接被用來兌換課程，跟密碼不應該明文存放是同一個道理
- 用 `timingSafeEqual` 逐一跟資料庫所有邀請記錄比對 → 否決：這是為了防止「攻擊者能觀察比對耗時來反推正確值」的情境設計的機制，這裡查詢走資料庫索引查找（不是應用層逐一比對已知集合），沒有這個攻擊面，加上去只是不必要的效能負擔

### Decision: canAccessCourseId 新增 hasRedeemedInvite 分支，延續既有依賴注入模式

`BundleCourseAccessReader` 新增方法 `hasRedeemedInvite: (userId, courseId) => Promise<boolean>`，`canAccessCourseId` 在既有 MVP entitlement／bundle／訂閱判斷都不成立時，最後呼叫此方法。Production reader（`createPrismaBundleCourseAccessReader`）查詢 `db.courseInviteRedemption.findFirst({ where: { userId, courseId } })`。

Alternatives Considered:
- 兌換成功後直接建立一筆 `Order{courseAccess: true, sku: "invite-{courseId}"}` 讓既有邏輯自動生效，不修改 `canAccessCourseId` → 否決：這會讓 `Order` 表混雜「真實付款」與「免費贈與」兩種語意不同的記錄，未來任何依賴 `Order` 判斷「這是真實收入」的報表/對帳邏輯都要額外排除這種假訂單，改動面比直接擴充 reader 更大且更容易產生混淆

## Implementation Contract

**Behavior:**
- Operator 建立邀請連結，設定限制條件，取得明文連結（僅顯示一次）
- 買家點擊連結，登入後系統驗證條件，成功則立即取得課程存取權
- 條件不符（已過期、已達使用上限、email 不符、已停用）時明確告知原因，不建立兌換記錄

**Interface / data shape:**
- `BundleCourseAccessReader.hasRedeemedInvite(userId, courseId): Promise<boolean>`

**DB DDL:**
```sql
CREATE TABLE "course_invite" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "email" TEXT,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "course_invite_courseId_idx" ON "course_invite"("courseId");
CREATE INDEX "course_invite_active_expiresAt_idx" ON "course_invite"("active", "expiresAt");

CREATE TABLE "course_invite_redemption" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL,
  "inviteId" TEXT NOT NULL REFERENCES "course_invite"("id") ON DELETE RESTRICT,
  "redeemedAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("userId", "courseId")
);
```

**Failure modes:**
- Token 無效（查無對應 hash）→ 明確錯誤訊息，不建立記錄
- 已過期／已達使用上限／email 不符／邀請已停用 → 各自明確錯誤訊息
- 同一使用者對同一課程重複兌換（可能透過不同邀請連結）→ 資料庫唯一鍵拒絕，視為已有權限

**Acceptance criteria:**
- `pnpm --filter @startkiter/api test` 涵蓋：正常兌換成功、四種失敗情境、`canAccessCourseId` 對已兌換使用者放行
- `pnpm type-check`／`pnpm build` 全綠
- `spectra validate course-invite-access` 0 warnings

**Scope boundaries:**
- In scope：`CourseInvite`／`CourseInviteRedemption` model；`hasRedeemedInvite` reader 方法；兌換與建立 API；operator 管理頁
- Out of scope：`payuni-checkout`／`subscription-billing` 不修改；批量邀請產生；到期提醒信

## Risks / Trade-offs

- [Risk] 邀請連結若被轉發給不該擁有課程的人（無 email 限制時任何人都能用）→ Mitigation: 這是既有設計的預期行為（operator 自行決定要不要限定 email），不是本次要防的風險，記錄供 operator 使用時知悉
- [Risk] `usedCount` 遞增與 `CourseInviteRedemption` 建立若不在同一 transaction，可能有並發競態 → Mitigation: 用同一資料庫 transaction 包裝兌換流程的驗證與寫入
