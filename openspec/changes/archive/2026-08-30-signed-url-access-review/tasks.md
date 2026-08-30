## 1. 既有測試盤點

- [x] 1.1 [Tool: cursor] 檢查 `packages/storage/` 與上述7個簽發/代理檔案是否已有測試檔，若有先讀懂既有 mock 方式；若無，讀 `packages/lesson-tool/`（`lesson-tool-embed` SR 產物）既有 SSRF 防護測試作為 image proxy 測試的參考模式。驗證：能指出參考了哪支既有測試。

參考來源：`packages/platform/src/lesson-tool/embed-path.test.ts`（private IP / DNS 指向內網拒發 token）、`apps/saas/app/api/lesson-tool/config/route.test.ts`（`TOOL_URL_PRIVATE` 對 `127.0.0.1`）。既有 mock 風格：`packages/api/modules/course/procedures/send-lesson-message.test.ts`、`packages/api/modules/course/procedures/assign-course-instructor.test.ts`。盤點時 `packages/storage/` 無測試檔、無 test script；image-proxy / logo / avatar / media-upload / lesson-message-upload 皆無對應測試；`assignment-upload.test.ts` 已有 key 與 local token 測試。`packages/lesson-tool/` 目錄不存在，SSRF 模式在 platform + saas lesson-tool。

## 2. Signed URL 簽發點 ownership／過期驗證

- [x] 2.1 [Tool: cursor] `packages/api/modules/organizations/procedures/create-logo-upload-url.ts` 補測試：驗證回傳 key 含正確 organization/user 識別、expiresIn 有設定。驗證：`pnpm --filter api test create-logo-upload-url` 全綠。
- [x] 2.2 [Tool: cursor] `packages/api/modules/course/procedures/media-upload-url.ts` 補測試：驗證回傳 key 含正確 course/instructor 識別、非 instructor 呼叫被拒。驗證：斷言涵蓋 ownership 與非授權情境。
- [x] 2.3 [Tool: cursor] `packages/api/modules/users/procedures/create-avatar-upload-url.ts` 補測試：驗證 key 綁定當前 user id，不可指定他人 id。驗證：斷言涵蓋跨user嘗試。
- [x] 2.4 [Tool: cursor] `packages/api/modules/course/procedures/lesson-message-upload.ts` 補測試：驗證非該 lesson 參與者無法取得 upload url。驗證：`pnpm --filter api test lesson-message-upload` 全綠。
- [x] 2.5 [Tool: cursor] `packages/api/modules/assignment/assignment-upload.ts` 補測試：驗證非該 assignment 擁有者無法取得 upload url。驗證：斷言涵蓋 ownership。
- [x] 2.6 [Tool: cursor] `packages/storage/provider/s3/index.ts` 補測試（若無）：驗證 signed URL 產生函式的 expiresIn 參數確實被傳遞、key 格式符合預期。驗證：測試檔存在且全綠。

## 3. Image Proxy SSRF 防護

- [x] 3.1 [Tool: cursor] `apps/saas/app/image-proxy/[...path]/route.ts` 補測試：驗證非白名單來源（如內網 IP、任意外部網域）被拒絕；合法白名單來源（S3/CDN）正常代理。驗證：`pnpm --filter saas test image-proxy` 全綠，斷言涵蓋拒絕與允許兩種情境。

## 4. Local Upload Fallback 覆查

- [x] 4.1 [Tool: cursor] 確認非 S3 環境（local upload fallback）下，檔案路徑是否可被非 owner 猜測存取；若有測試環境可模擬，補一組驗證測試；若架構本身無此路徑，記錄「不適用」原因。驗證：測試檔或書面說明存在。

適用，不是 N/A。local adapter 存在於 assignment 與 lesson-message：production 未設 S3 時簽發函式直接 throw；`PUT /api/assignment/upload` 與 `PUT /api/course/lesson-messages/upload` 在 `NODE_ENV=production` 回 404；沒 token / 偽 token 分別 400 / 403。過期 HMAC token 驗證為 null。猜 storage key 沒有對應 token 寫不進去。

## 5. PM 驗證與交叉審查

- [ ] 5.1 PM 在同一 worktree 重新執行 `pnpm test`（storage/api/saas 相關），記錄實際通過/失敗數字，與 CLI 自報比對。驗證：PM 貼出實跑輸出。
- [ ] 5.2 每支新測試先跑一次確認會失敗（紅燈驗證）。驗證：抽查至少3支新測試的紅燈過程。
- [ ] 5.3 開另一支 CLI 交叉審查，聚焦 key 是否真的防猜測、image proxy 白名單是否有繞過方式（如大小寫、URL編碼繞過）。驗證：審查方產出書面結論。
- [ ] 5.4 發現真實漏洞立即停止並回報 Fish，標註在 tasks.md 對應項。驗證：若有此情況，已實際告知 Fish。
- [ ] 5.5 全部過關後更新 `openspec/site-remediation-tracker.md` 第4項打勾，執行 `/spectra:archive` 封存，commit+push。驗證：git log 有對應 commit。
