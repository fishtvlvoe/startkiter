## 1. 資料庫與型別

- [x] 1.1 新增 Prisma `Page` model 與 `ContentType`／`ContentStatus` enum，含 `@@unique([slug, locale])` 與 `@@index([type, status, locale])`（對應 Decision: 新增 Page 資料表，不重用現有 Course/Lesson 表格；Decision: 內容以單一 Page 表格 + type 欄位（POST/PAGE）區分文章與頁面）。驗證：`pnpm --filter database prisma validate` 通過，migration SQL 檔內含指定的 unique 與 index

## 2. 紅燈測試（TDD，先寫測試，此時全部應為失敗）

- [x] 2.1 [P] 撰寫 sanitize 函式單元測試，涵蓋 `<script>`／`onerror=`／`javascript:` payload 被移除與允許標籤（p、h1-h6、ul、ol、li、a、img、strong、em、blockquote、code）被保留兩類案例（對應 Requirement: Content is sanitized before storage；Decision: 內容清洗使用白名單式 sanitizer，於寫入時而非讀取時執行）。驗證：新測試檔執行為紅燈（函式尚未實作）
- [x] 2.2 [P] 撰寫 slug 檢查單元測試，涵蓋落入掛載點衍生黑名單、同語系重複 slug 兩種拒絕情境（對應 Requirement: Slug must not collide with reserved routes or existing content；Decision: slug 保留字用靜態黑名單比對，自動衍生自現有掛載點路由集合）。驗證：新測試檔執行為紅燈
- [x] 2.3 [P] 撰寫版本復原單元測試，涵蓋有 `previousSnapshot` 可還原、無 snapshot 回 409 兩種情境（對應 Requirement: Buyer can restore the previous version of a content record；Decision: 版本復原採儲存前自動備份上一版的單層快照，不做完整版本歷史表）。驗證：新測試檔執行為紅燈
- [x] 2.4 [P] 撰寫 Pages CRUD API 整合測試，涵蓋草稿建立、發布後 `publishedAt` 寫入、非 operator 呼叫遭 401/403 拒絕三種情境（對應 Requirement: Buyer can create and edit page or post content；Requirement: Non-operator cannot access the pages management API 相關情境）。驗證：新測試檔執行為紅燈
- [x] 2.5 [P] 撰寫 sitemap 整合測試，涵蓋 `PUBLISHED` 內容出現於輸出、`DRAFT`／`ARCHIVED` 內容不出現兩種情境（對應 Requirement: Published content is included in the site's sitemap；Decision: sitemap 改為執行期動態產生，不再是建置期靜態產出）。驗證：新測試檔執行為紅燈
- [x] 2.6 [P] 撰寫 `.mdx` 遷移腳本測試，涵蓋 `--dry-run` 不寫入資料庫、正式執行時 `title`/`date`/`tags`/`published` 正確映射至 `Page` 欄位兩種情境（對應 Requirement: Existing file-based content can be migrated into the database）。驗證：新測試檔執行為紅燈
- [ ] 2.7 執行一次 2.1 至 2.6 全部新增測試檔，確認全部為紅燈失敗（尚無對應實作），記錄每個失敗訊息，供第 3 節逐項核對是否已修正為綠燈

## 3. 核心邏輯實作

- [ ] 3.1 [P] 實作 sanitize 函式（`packages/platform/src/pages-cms/sanitize.ts`），讓 2.1 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠
- [ ] 3.2 [P] 實作 slug 保留字清單與檢查函式（`packages/platform/src/pages-cms/reserved-slugs.ts`，衍生自 `MOUNT_POINTS` 路由前綴），讓 2.2 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠
- [ ] 3.3 [P] 實作版本復原邏輯（更新 `Page` 前把目前欄位寫入 `previousSnapshot`，還原時寫回主欄位），讓 2.3 測試轉綠燈。驗證：`pnpm --filter platform test` 全綠
- [ ] 3.4 實作 Pages CRUD API（`POST /api/pages-cms`、`PATCH /api/pages-cms/[id]`、`POST /api/pages-cms/[id]/restore`、`DELETE /api/pages-cms/[id]`），串接 3.1-3.3 的 sanitize／slug 檢查／版本復原邏輯，回傳 `{ page, warnings }` 形狀，讓 2.4 測試轉綠燈。驗證：`pnpm --filter api test` 全綠
- [ ] 3.5 [P] 實作 sitemap 合併邏輯（`apps/marketing/app/sitemap.ts` 同時讀取既有 `.mdx` 檔案清單與資料庫 `Page` 表格已發布項目，設定 revalidate 快取），讓 2.5 測試轉綠燈。驗證：`pnpm --filter marketing test` 全綠
- [ ] 3.6 [P] 實作 `.mdx` 遷移腳本（`tooling/scripts/migrate-mdx-to-pages-cms.ts`，支援 `--dry-run`），讓 2.6 測試轉綠燈。驗證：`pnpm tsx tooling/scripts/migrate-mdx-to-pages-cms.ts --dry-run` 對測試 fixture 資料夾輸出正確筆數與失敗清單

## 4. 後台 UI 與 Core 掛載

- [ ] 4.1 [P] 建立頁面管理後台列表頁與新增/編輯表單（含類型/語系切換、標題、slug、內文、SEO 標題/描述、封面圖欄位、sanitize warnings 顯示、還原上一版按鈕），呼叫 3.4 的 API（對應 Requirement: Buyer can create and edit page or post content）。驗證：ego-browser 走一次「新增草稿→發布→看到 warnings 提示（若有）→按還原→確認內容回復」的完整畫面流程並截圖存證
- [ ] 4.2 [P] 於 `packages/platform/src/mount-points.ts` 新增 `pages-cms` Core 掛載項（`requiresOperator: true`），並在 Plugin manifest 驗證邏輯中把 `pages-cms` 列為保留 id、拒絕任何 Plugin 註冊同名掛載點（對應 Requirement: This capability is a fixed Core capability, not a replaceable Plugin）。驗證：`mount-points.test.ts` 新增案例確認 Plugin 註冊 `pages-cms` 遭拒絕，且後台側邊欄實際出現「頁面管理」選單項目

## 5. 整合驗證與交付

- [ ] 5.1 執行全域測試（`platform`／`api`／`saas`／`marketing` 四個 package 的 `pnpm test`）與 `pnpm type-check`，全部通過。驗證：附上實際跑出的通過筆數（例如 X/X passed），不得只回報「測試通過」四字
- [ ] 5.2 由不同於本次實作的 CLI 或 agent 執行一次獨立 code review，檢查 Critical／High 發現數為 0；若有發現，送回修復後回到 5.1 重新驗證。驗證：code review 報告存為 `openspec/changes/buyer-pages-cms/code-review.md`
- [ ] 5.3 用真實測試買家帳號走一次端對端：新增頁面、發布、確認公開網址可見、確認該頁面出現於 sitemap 輸出、故意改壞內容後按還原確認回復正確；並對測試用 `.mdx` fixture 執行一次 `migrate-mdx-to-pages-cms.ts --dry-run` 確認輸出筆數與檔案清單正確。驗證：截圖與指令輸出存證，附在最終驗收報告中
