## Why

付款與 `Order.courseAccess` 已落地，但站上還不能看課，買家付完 8800 沒有履約入口。現在抽課程觀看／權限模組，才能驗證「付了才能播、沒付就 403」。

## What Changes

- 新增 `packages/course`：改寫抽 thetu 觀看與權限畫面（只留模組，不抽學院營運）
- 修改 `apps/saas`：掛課程列表／單元播放路由，權限讀取該 user 的 MVP Order `courseAccess`
- 修改 `AGENTS.md`、`README.md`、`openspec/config.yaml`：標明現行施工為 `extract-course-module`
- 修改 `course-module` 規格：補齊 entitlement 閘門、單元清單、播放失敗行為的可測契約

## Non-Goals

- 不做 GitHub kit 邀請／claim（留給 `github-kit-fulfillment`）
- 不做 LINE 學員社群邀請連結（留給 `line-learner-community`）
- 不做 site-agent 工具
- 不抽電子報、優惠券、作業、課程邀請、賣課 onboarding
- 不准改 thetu／supastarter／line-hub 來源 repo
- 不接 Shopline／Stripe、不做發票

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `course-module`: 明確以 Order.courseAccess 閘播放；定義站內播放路由與未授權 403

## Impact

- Affected specs: course-module
- Affected code:
  - New: packages/course/, apps/saas/app/(course)/ 或同等課程路由
  - Modified: apps/saas（掛載課程頁）、AGENTS.md、README.md、openspec/config.yaml、packages/database（若需 Lesson／Progress 最小表）
  - Removed: (none)
- Dependencies 新增: 可能新增套件僅限播放 UI 必要依賴（以 design 定案）
- 環境變數新增: 無新金流金鑰；若影片 CDN／signed URL 需要，design 再列
