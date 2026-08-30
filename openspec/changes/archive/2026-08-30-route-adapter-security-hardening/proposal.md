## Why

全站盤點（`openspec/changes/archive/full-site-audit-2026-08-30.md`）發現多支 SaaS API route 只有業務邏輯層測試，缺少直接打 HTTP 層的測試，401/403/404、簽章驗證、跨 user ownership 隔離等安全邊界沒有可驗證的證據。沒有測試不代表沒漏洞，只是沒被抓到。

## What Changes

- 盤點 `apps/saas/app/api/` 底下所有 route，列出目前完全沒有 `route.test.ts`（或雖有測試但未涵蓋 401/403/404/ownership/簽章）的清單
- 為缺口 route 補上直接 HTTP 層測試，涵蓋：
  - 未登入請求 → 401
  - 登入但角色/擁有權不符 → 403
  - 資源不存在 → 404
  - webhook／簽章型 route（payuni、shopline、stripe、github）→ 驗證簽章錯誤時拒絕
  - 涉及 user 資料的 route → 驗證無法讀取/操作他人資料（cross-user ownership）
- 補 `/api/repo-version` 直接路由測試（買家更新機制核心邏輯已有測試，API 層目前沒有）
- 不改動任何被測 route 的生產邏輯；測試過程中若抓到真實漏洞（例如某支 route 缺少 ownership 檢查），立即停止該項並回報 Fish 決定處理順序，不在本 SR 範圍內直接修復

## Non-Goals (optional)

- 不重構 route adapter 架構或抽共用 middleware（發現重複模式可以記錄建議，但不動手做）
- 不新增功能、不改變既有 API 的請求/回應格式
- 不處理 `openspec/site-remediation-tracker.md` 其他項目（#4 signed URL/#6 通知測試等）
- 若測試抓到真實安全漏洞，只記錄與回報，修復另開 SR 或由 Fish 決定是否併入本輪緊急處理

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected specs: 無（純測試補強，不變更任何 spec 定義的行為）
- Affected code:
  - New（測試檔）：
    - `apps/saas/app/api/assignment/upload/route.test.ts`
    - `apps/saas/app/api/bundles/[id]/route.test.ts`
    - `apps/saas/app/api/bundles/admin/route.test.ts`
    - `apps/saas/app/api/course/ai-notes/settings/route.test.ts`
    - `apps/saas/app/api/course/lesson-messages/upload/route.test.ts`
    - `apps/saas/app/api/course/lessons/route.test.ts`
    - `apps/saas/app/api/cron/assignment-upload-cleanup/route.test.ts`
    - `apps/saas/app/api/cron/lesson-message-upload-cleanup/route.test.ts`
    - `apps/saas/app/api/github/claim-status/route.test.ts`
    - `apps/saas/app/api/github/claim/route.test.ts`
    - `apps/saas/app/api/mcp/connections/route.test.ts`
    - `apps/saas/app/api/mcp/connections/[id]/route.test.ts`
    - `apps/saas/app/api/pages-cms/route.test.ts`
    - `apps/saas/app/api/pages-cms/[id]/route.test.ts`
    - `apps/saas/app/api/pages-cms/[id]/restore/route.test.ts`
    - `apps/saas/app/api/repo-version/route.test.ts`
  - Modified（已有測試但需要補 401/403/404/ownership 情境）：
    - `apps/saas/app/api/bundles/route.test.ts`
    - `apps/saas/app/api/checkout/route.test.ts`
    - `apps/saas/app/api/checkout/status/route.test.ts`
    - `apps/saas/app/api/coupons/validate/route.test.ts`
    - `apps/saas/app/api/course/studio/route.test.ts`
    - `apps/saas/app/api/lesson-tool/config/route.test.ts`
  - 不動：`apps/saas/app/api/**/route.ts` 生產邏輯本身（除非發現真漏洞，回報後另行決定）
