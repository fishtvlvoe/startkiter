## 1. TDD：營運者與加解密

- [x] 1.1 先寫失敗 Vitest：鎖定 Requirement: Operator identity matches ADMIN_EMAIL 與 Decision: 營運者用 ADMIN_EMAIL 對 session email（trim、不分大小寫；空 ADMIN_EMAIL → 無人）。驗證：isOperator 測試檔存在且實作前紅燈。 [Tool: sonnet]
- [x] 1.2 [P] 先寫失敗 Vitest：鎖定 Decision: SiteSetting 單列 AES-256-GCM 密文（roundtrip；缺 SETTINGS_ENCRYPTION_KEY 不得加密成功）。驗證：encrypt/decrypt 測試實作前紅燈。 [Tool: sonnet]
- [x] 1.3 [P] 先寫失敗 Vitest：鎖定 Requirement: Operator can write encrypted PAYUNi settings 與 Decision: 部分更新不覆蓋空白密鑰；明確清除才刪列（空 hashKey 保留舊值；clear true 刪列）。驗證：site-settings 單元測試實作前紅燈。 [Tool: sonnet]

## 2. 儲存與 API

- [x] 2.1 依 Decision: SiteSetting 單列 AES-256-GCM 密文 新增 Prisma SiteSetting 與 migration（site_setting PK id、ciphertext、updated_at、updated_by 與 updated_at index），讓 1.2 轉綠。驗證：schema 有 model SiteSetting；migration SQL 含 PRIMARY KEY 與 index。 [Tool: sonnet]
- [x] 2.2 實作 isOperator 與 AES helper，讓 1.1／1.2 轉綠。驗證：pnpm test 相關案例全綠。 [Tool: sonnet]
- [x] 2.3 實作 GET／PUT /api/admin/settings/payuni，對應 Requirement: Unauthenticated admin settings fail closed、Requirement: Operator can read masked PAYUNi settings、Requirement: Operator can write encrypted PAYUNi settings、Decision: GET 只回遮罩與來源，不回完整密鑰（401／403／400／503／200；JSON 無完整 hashKey）。驗證：API 行為有 focused test 或單元測試覆蓋遮罩與 503；pnpm test 全綠相關檔。 [Tool: sonnet]

## 3. 結帳接線與 UI

- [x] 3.1 先寫失敗 Vitest 再接線：Requirement: Checkout credentials prefer admin settings then env（settings 覆寫 env；空列走 env；壞密文不得 500）。驗證：credentials／checkout 測試轉綠；corrupt ciphertext 不丟 500。 [Tool: sonnet]
- [x] 3.2 依 Decision: 不抽來源後台，UI 沿用既有 DESIGN token 落地 GET /admin/settings 繁中表單與 SiteNav 營運者連結，對應 Requirement: Operator navigation reaches settings（學員無連結、無表單金鑰欄）。驗證：rg 學員導覽無 /admin/settings；手動或 smoke 營運者可見設定入口。不准改 thetu／supastarter。 [Tool: sonnet]
- [x] 3.3 更新 apps/saas/.env.example 與 docs/deploy-and-public-url.md 說明 ADMIN_EMAIL、SETTINGS_ENCRYPTION_KEY；缺 key 則 PUT 503、結帳仍可走 env。驗證：兩檔皆出現這兩個變數名稱與 fail-closed 敘述。 [Tool: sonnet]

## 4. Review

- [x] 4.1 確認來源 repo 未被寫入；spectra analyze operator-payuni-settings 與 spectra validate operator-payuni-settings 無 Critical；pnpm test 與 pnpm type-check 全綠。驗證：CLI 輸出與測試全綠。 [Tool: sonnet]
