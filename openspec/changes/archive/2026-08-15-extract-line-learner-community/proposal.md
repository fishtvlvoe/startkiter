## Why

課與代碼包已能走通，但付費學員還看不到課程內 LINE 交流群邀請。這是 MVP 履約的下一環：付費才顯示邀請連結，不能靜默入群、不能當客服。

## What Changes

- 修改能力 `line-learner-community`：實作 GET /api/community/line-invite（session＋付費／courseAccess 閘、缺設定 503）。
- 新增課程區最小 UI：顯示「加入學員 LINE 交流群」控制（明示非客服）。
- 邀請 URL 從 env／設定讀取（例 LINE_COMMUNITY_INVITE_URL），fail-closed。
- 更新 AGENTS／config 標明本刀範圍；不准做 Messaging／LIFF／Bot／靜默入群。

## Non-Goals

- 不做 LINE Login 改造（已有）。
- 不做 Messaging API、LIFF、Bot、靜默入群。
- 不做客服進群、SKOOL。
- 不做 site-agent、發票、UI 精修。
- 不建 test-startkiter／Vercel。

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `line-learner-community`: 從規格落地為可呼叫 API＋課程區 UI；entitlement 對齊 paid／courseAccess。

## Impact

- Affected specs: `line-learner-community`
- Affected code:
  - New: `apps/saas/app/api/community/line-invite/route.ts`, `apps/saas/app/course/line-community-panel.tsx`（或同等）
  - Modified: `apps/saas/app/course/page.tsx`, `AGENTS.md`, `openspec/config.yaml`, `apps/saas/.env.example`
  - Removed: (none)
- Dependencies 新增: (none)
- 環境變數新增: `LINE_COMMUNITY_INVITE_URL`
