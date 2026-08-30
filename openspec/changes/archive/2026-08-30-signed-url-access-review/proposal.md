## Why

全站盤點（`openspec/changes/archive/full-site-audit-2026-08-30.md`）第7節優先順序第4項：課程媒體、頭像、assignment上傳、lesson message等多處使用 signed URL／image proxy／local upload，但這些機制的邊界（跨user是否能猜到/存取他人資源key、URL過期後是否真的失效、撤銷機制、production環境的fallback行為）沒有系統性覆查與測試證據。

## What Changes

- 盤點所有簽發 signed URL 的程式碼路徑：`packages/storage/provider/s3/index.ts`、`packages/api/modules/organizations/procedures/create-logo-upload-url.ts`、`packages/api/modules/course/procedures/media-upload-url.ts`、`packages/api/modules/users/procedures/create-avatar-upload-url.ts`、`packages/api/modules/course/procedures/lesson-message-upload.ts`、`packages/api/modules/assignment/assignment-upload.ts`
- 盤點 `apps/saas/app/image-proxy/[...path]/route.ts`（image proxy 入口）的存取控制邏輯
- 為每個 signed URL 簽發點補測試：驗證 URL 的 key/path 是否綁定正確的 owner（無法用猜測的 key 存取他人資源）、過期時間是否符合預期、image proxy 是否會代理任意外部 URL（防止 SSRF，比照 `lesson-tool-embed` SR 已建立的 SSRF 防護模式）
- 確認 local upload（非 S3 環境的 fallback 路徑）在 production 設定下的行為是否符合預期（例如不該把 local 檔案路徑暴露給非 owner）
- 若發現真實漏洞（例如 key 可預測、過期時間未強制、image proxy 可代理任意內網位址），立即停止並回報 Fish，不在本 SR 範圍內直接修復

## Non-Goals (optional)

- 不重構 storage provider 架構、不更換 S3 SDK
- 不新增新的上傳功能
- 不處理 `openspec/site-remediation-tracker.md` 其他項目
- 抓到漏洞只記錄回報，修復另開SR或由Fish決定是否併入本輪緊急處理

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

- Affected specs: 無（純覆查與補測試，不變更任何 spec 定義的行為）
- Affected code:
  - New（測試檔）：
    - `packages/storage/provider/s3/index.test.ts`（若不存在）
    - `apps/saas/app/image-proxy/[...path]/route.test.ts`（若不存在）
    - `packages/api/modules/organizations/procedures/create-logo-upload-url.test.ts`
    - `packages/api/modules/course/procedures/media-upload-url.test.ts`
    - `packages/api/modules/users/procedures/create-avatar-upload-url.test.ts`
    - `packages/api/modules/course/procedures/lesson-message-upload.test.ts`
    - `packages/api/modules/assignment/assignment-upload.test.ts`
  - Modified：上述既有測試檔（若已存在則補情境，不建新檔）
  - 不動：簽發邏輯本身（除非發現真漏洞，回報後另行決定）
