## Why

規格要求金鑰填後台、env 當 fallback，但結帳現在只透過 emptySettings() 讀環境變數，學員裝完後台沒地方改 PAYUNi。這張把可替換的 settings 讀取接到真的加密儲存與營運者畫面，不然「小白不改 .env」這課永遠教不完。

## What Changes

- 新增加密 SiteSetting 資料表與加解密套件路徑 packages/database 與 packages/payments 或 apps/saas/lib
- 新增營運者判定（ADMIN_EMAIL 對 session email；無 Organization）
- 新增 GET 與 PUT /api/admin/settings/payuni：讀寫 PAYUNi merchantId／hashKey／hashIV／apiUrl；密文不明文回傳
- 新增 /admin/settings 繁中設定頁與導覽入口（僅營運者）
- 修改 apps/saas/lib/orders.ts 的 readSettings：先讀 DB settings，空則 env；缺金鑰仍 503
- 修改 apps/saas/.env.example 與 docs/deploy-and-public-url.md 標 ADMIN_EMAIL 與 SETTINGS_ENCRYPTION_KEY

## Non-Goals

- 不做 Organization／多管理員角色矩陣
- 不做發票、Shopline／Stripe 金鑰頁
- 不做 GitHub kit PEM、LINE 群邀請、Google／LINE Login 後台欄位（仍走 env／跳過項）
- 不做 Bunny 課片 guid 後台
- 不准抽 thetu／supastarter／libon.me 應用程式碼

## Capabilities

### New Capabilities

- `operator-settings`: 營運者後台金鑰設定、加密儲存、非營運者禁入

### Modified Capabilities

- `payuni-checkout`: 結帳憑證必須先讀後台 settings 再 fallback env
- `saas-shell`: 已登入營運者可達管理設定區；學員不可見

## Impact

- Affected specs: operator-settings（新）, payuni-checkout, saas-shell
- Affected code:
  - New: apps/saas/app/admin/settings/page.tsx, apps/saas/app/admin/settings/payuni-settings-form.tsx, apps/saas/app/api/admin/settings/payuni/route.ts, apps/saas/lib/operator.ts, apps/saas/lib/site-settings.ts, packages/database/prisma/migrations for site_setting
  - Modified: packages/database/prisma/schema.prisma, apps/saas/lib/orders.ts, apps/saas/app/components/site-nav.tsx, apps/saas/.env.example, docs/deploy-and-public-url.md, packages/payments/src/credentials.ts if mask helpers land there
  - Removed: none
- Dependencies: 無新 npm 套件（Node crypto AES-256-GCM）
- Env: ADMIN_EMAIL, SETTINGS_ENCRYPTION_KEY（寫入 settings 必填；缺則 POST 503、讀取仍可走 env）
