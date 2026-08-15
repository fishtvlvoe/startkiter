## Context

extract-payuni-checkout 已規定 settings → env，但 apps/saas/lib/orders.ts 的 readSettings 固定回空。TEST 站靠 Vercel env 能結帳；教學產品仍缺營運者填金鑰的畫面與加密儲存。無 Organization。現有 User 無 role 欄。

## Goals / Non-Goals

**Goals:**

- 營運者可在站內寫入 PAYUNi 金鑰，checkout 優先用該值
- 未登入／非營運者無法讀寫；密文不明文出現在 GET JSON
- settings 空或缺列時仍走 env；兩者皆缺 POST /api/checkout 維持 503

**Non-Goals:**

- Organization、多角色、發票、Shopline／Stripe、kit PEM、LINE 邀請、Bunny guid 後台
- 抽 thetu／supastarter 後台表單程式碼

## Decisions

### Decision: 營運者用 ADMIN_EMAIL 對 session email

比對 process.env.ADMIN_EMAIL（trim、大小寫不敏感）。相符才是營運者。ADMIN_EMAIL 空字串時無人是營運者，GET／PUT /api/admin/settings/payuni 與 GET /admin/settings 皆 403（無 session 則 401）。

Alternatives Considered:

- User.role=admin 欄位 → 否決：引入多租戶式角色卻無 Organization，還要 seed／升權流程
- 第一個註冊者自動當 admin → 否決：e2e 與學員註冊會誤拿營運權

### Decision: SiteSetting 單列 AES-256-GCM 密文

Prisma model SiteSetting，表名 site_setting：id TEXT PK（本刀僅 id=payuni）、ciphertext TEXT NOT NULL、updatedAt、updatedBy。SETTINGS_ENCRYPTION_KEY 經 SHA-256 成 32-byte key；IV 12 bytes 隨機；payload 格式 v1:base64(iv):base64(tag):base64(ciphertext)。明文 JSON 含 merchantId、hashKey、hashIV、apiUrl。PUT 時缺 SETTINGS_ENCRYPTION_KEY → HTTP 503，不得寫入明文。讀取時密文損壞 → 視同無 settings、fallback env，並寫伺服器 log，不得 500 炸結帳。

DDL:

```
CREATE TABLE "site_setting" (
  "id" TEXT NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "updated_by" TEXT,
  CONSTRAINT "site_setting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "site_setting_updated_at_idx" ON "site_setting"("updated_at");
```

Alternatives Considered:

- 明文欄位存 hashKey → 否決：資料庫外洩即金流被盜
- 獨立 packages/secrets 與新 npm 套件 → 否決：Node crypto 足夠，禁止無謂依賴

### Decision: 部分更新不覆蓋空白密鑰；明確清除才刪列

PUT /api/admin/settings/payuni body：merchantId、hashKey、hashIV、apiUrl、clear（boolean）。hashKey／hashIV 空字串表示保留資料庫既有值。clear=true 刪除 payuni 列，之後只走 env。hashKey 若提供必須長度 32、hashIV 長度 16，否則 HTTP 400。merchantId 提供時不得為空白字串。apiUrl 空則沿用既有或結帳時再套 sandbox 預設。

Alternatives Considered:

- 每次 PUT 覆蓋全部欄位含空字串 → 否決：遮罩表單會把密鑰洗掉
- 永不允許刪除 settings → 否決：無法退回純 env 教學路徑

### Decision: GET 只回遮罩與來源，不回完整密鑰

GET /api/admin/settings/payuni → 200 JSON：merchantId（可完整，非秘密）、hashKeyMasked、hashIVMasked（至少四碼星號＋末四碼；短於四碼則全星號）、apiUrl、source：settings｜env｜none。hashKey／hashIV 完整值不得出現在 JSON。非營運者 403；未登入 401。

Alternatives Considered:

- GET 回完整金鑰方便複製 → 否決：XSS／HAR 外洩
- 學員也可看遮罩 → 否決：營運面不該洩漏商戶號給買家

### Decision: 不抽來源後台，UI 沿用既有 DESIGN token

新增 GET /admin/settings 繁中頁與表單元件，class 沿用 apps/saas/app/globals.css。SiteNav 僅營運者顯示「設定」連到 /admin/settings。不准修改 thetu 或 supastarter 檔案。

Alternatives Considered:

- 拷 thetu admin payments form → 否決：禁止改／抽應用來源，且 UI 棧不同
- 把表單塞進 /app 帳號頁給所有登入者 → 否決：學員不該看到金流設定

## Implementation Contract

- Behavior: 營運者填 PAYUNi 後，即使 env 金鑰不同，POST /api/checkout 使用 settings 值；清除 settings 後回到 env；兩者皆無則 503。學員打 admin API 得 403、打 /admin/settings 重導向 /app 或 403。
- Interface: resolvePayUniCredentials 仍先呼叫 readSettings。readSettings 解密 id=payuni。isOperator(email, env.ADMIN_EMAIL)。encryptSettings／decryptSettings 純函式可單測。
- Failure: 無 ADMIN_EMAIL → 無人能寫。缺 SETTINGS_ENCRYPTION_KEY → PUT 503。解密失敗 → settings 當空、結帳走 env 或 503。
- Acceptance: Vitest 覆蓋 isOperator、encrypt roundtrip、部分更新、clear、遮罩不含完整 hashKey。pnpm test 與 type-check 全綠。POST /api/checkout 既有 fail-closed 案例仍綠。
- Scope in: SiteSetting、admin API、admin 頁、orders.ts 接線、文件。Out: kit／LINE／OAuth／發票／Organization。

## Risks / Trade-offs

- [Risk] SETTINGS_ENCRYPTION_KEY 遺失無法解密舊密文 → Mitigation: 視為無 settings、fallback env；文件寫明換 key 等於清空後台金鑰，須重填
- [Risk] ADMIN_EMAIL 洩漏或打錯大小寫 → Mitigation: trim + 不分大小寫比對；文件只放範例信箱
- [Risk] Prisma migrate 未套 Neon → Mitigation: apply 時對 TEST 跑 migrate；回滾 drop table site_setting

## Migration Plan

1. prisma migrate 新增 site_setting
2. 部署含 ADMIN_EMAIL 與 SETTINGS_ENCRYPTION_KEY 的版本
3. 營運者登入後台填金鑰或維持純 env
4. 回滾：drop table site_setting、回復 emptySettings 等價讀取（僅 env）；結帳不中斷若 env 仍在

## Open Questions

- 無。SUPPORT_EMAIL／kit 欄位下一張 SR，不塞本刀。
