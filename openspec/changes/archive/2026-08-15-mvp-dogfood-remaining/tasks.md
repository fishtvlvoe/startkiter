## 1. Course media

- [x] 1.1 packages/course：三課對應 Bunny guid（env 可覆寫）；解析 embed URL；缺設定 fallback。對應 Requirement: Entitled lessons play configured Bunny media；Decision: Bunny 用 iframe.mediadelivery.net/embed/{libraryId}/{guid}，video id 由 env 或目錄常數對應三課。驗證：unit test 覆蓋有／無 env。 [Tool: sonnet]
- [x] 1.2 lesson 頁改 embed／fallback UI；未授權不露出 media。對應 Requirement: Unauthorized learners do not receive media URLs；Decision: 缺 Bunny 設定時 fail 回 placeholder 並在 UI 標「示範影片」，不准空白炸頁。驗證：無 courseAccess 頁面無 mediadelivery URL。 [Tool: sonnet]

## 2. Buyer surface + checkout

- [x] 2.1 agent／demo／kit 錯誤映射繁中＋catch。對應 Requirement: Buyer-visible errors use plain Traditional Chinese；Decision: 買家錯誤一律映射繁中；原始 error code 只進 server log。驗證：rg 買家 UI 無 provider_failed 字面。 [Tool: sonnet]
- [x] 2.2 頁尾／帳號支援信箱；checkout 明確用 BETTER_AUTH_URL。對應 Requirement: Support email is visible when configured；Requirement: Checkout callback URLs use the public HTTPS base；Decision: 支援信箱讀 SUPPORT_EMAIL，空則 EMAIL_FROM，再空則不顯示區塊。驗證：文件＋程式路徑。 [Tool: sonnet]

## 3. Env and close-out

- [x] 3.1 Vercel 灌 BUNNY_* 與 SUPPORT_EMAIL／EMAIL_FROM；更新 docs；跳過項寫明。對應 Decision: Bunny 用 iframe.mediadelivery.net/embed/{libraryId}/{guid}，video id 由 env 或目錄常數對應三課。驗證：vercel env ls 可見 BUNNY_LIBRARY_ID。 [Tool: sonnet]
- [x] 3.2 Claude OK＋Codex 無 Critical 後 archive。驗證：CLI＋代理。 [Tool: sonnet]
