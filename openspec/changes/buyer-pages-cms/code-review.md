# buyer-pages-cms 獨立 Code Review

審查範圍：`main..fishtvlvoe/buyer-pages-cms`，HEAD `e4f45932`。依序讀取 `proposal.md`、`design.md`、`spec.md`、`tasks.md`，再檢查本 change 的所有 source diff 與相關既有授權/渲染程式碼。

## Critical

無。

## High

### H-1：後台頁面與 pages-cms API 使用兩套不一致的授權判斷

- 檔案：`apps/saas/app/(authenticated)/(main)/(account)/admin/pages/layout.tsx:1-6`
- 檔案：`apps/saas/lib/admin-access.ts:5-9`
- 檔案：`packages/api/modules/pages-cms/handlers.ts:30-41`
- 檔案：`packages/api/modules/course/lib/course-operator.ts:5-12`
- 觸發：登入帳號的 `user.role === "admin"` 與 `user.email === ADMIN_EMAIL` 不一致。
- 理由：後台 layout 只呼叫 `requireGlobalAdmin()`，其判斷是 `checkPermission(..., "admin.access")`，而 `admin.access` 只看 `user.role === "admin"`。API 的 `requireOperator()` 則完全改用 email 與 `ADMIN_EMAIL` 比對，沒有確認 `user.role`。因此，role 為 `admin` 但不是 `ADMIN_EMAIL` 的帳號可以看到 `/admin/pages` 並看到管理 UI，卻會在所有 API 呼叫收到 403；反過來，email 等於 `ADMIN_EMAIL` 但 role 不是 `admin` 的帳號，API 可執行讀寫，但頁面 layout 會 redirect，形成 UI/API 權限邊界分裂。
- 影響：權限結果不可預期；更嚴重的是 API 允許一個未具 global admin role 的帳號直接建立、發布、下架與還原所有 Page。這直接違反「後台頁面與 API 使用同一 operator 邊界」的驗收意圖。
- 修復方向：抽出單一 server-side operator/admin guard，讓 layout 與所有 pages-cms API 共用同一個權限來源；並補上兩個反向矩陣測試：role admin/non-`ADMIN_EMAIL`、`ADMIN_EMAIL`/non-admin role。

### H-2：`.mdx` 遷移繞過 sanitizer，公開頁面直接渲染未清洗內容

- 檔案：`tooling/scripts/migrate-mdx-to-pages-cms.ts:144-154`
- 檔案：`tooling/scripts/migrate-mdx-to-pages-cms.ts:199-201`
- 檔案：`apps/marketing/modules/blog/lib/database-pages.ts:22-40`
- 檔案：`apps/marketing/app/[locale]/[...rest]/page.tsx:47-50`
- 觸發：正式遷移時 `defaultCreatePage()` 直接呼叫 `db.page.create({ data: input })`；`input.body` 是 parser 讀出的原始 MDX/HTML，沒有呼叫 `sanitizePageBody()`。
- 理由：spec 明定所有 HTML/MDX body 在寫入資料庫前必須清洗，且資料庫不得保存 `<script>`、事件屬性或 `javascript:` URI。這條直接 DB 寫入路徑沒有遵守該契約。之後 `database-pages.ts` 讀出已發布內容，公開頁面以 `dangerouslySetInnerHTML={{ __html: page.body }}` 渲染，所以遷移檔案中的 `<script>` 或事件屬性會成為儲存型 XSS。`--dry-run` 只是不寫入，正式模式仍然有此缺口。
- 影響：任何被遷移的惡意或不可信 `.mdx` 都能在買家公開站訪客瀏覽時執行；也使後續 restore 可能把這些未清洗 snapshot 再寫回公開內容。
- 修復方向：遷移與 API 共用同一個 sanitize/write service，不允許 script 直接呼叫 Prisma create；遷移測試加入 `<script>`、`onerror`、`javascript:` fixture，並確認資料庫寫入 payload 已清洗且 warnings 可追蹤。

## Medium

### M-1：slug 檢查沒有做 URL path normalization，可繞過保留路由判斷

- 檔案：`packages/platform/src/pages-cms/reserved-slugs.ts:14-16,31-52`
- 檔案：`apps/marketing/app/sitemap-entries.ts:33-41`
- 觸發：輸入 `../admin`、`blog/../admin` 或含 `.`/`..` path segment 的 slug。
- 理由：檢查只取原始字串第一個非空 segment；`../admin` 的第一段是 `..`，因此不會命中 `admin` 黑名單。產生 URL 時 `new URL("/../admin", baseUrl)` 會正規化為 `/admin`，實際 URL 與檢查時的 slug 不同。Slug 也沒有明確的格式限制或 canonicalization。
- 影響：可建立與系統路徑產生實際碰撞的內容，並造成 sitemap 與公開路由的結果不一致。這是 slug collision requirement 的邊界漏洞。
- 修復方向：先拒絕 `.`、`..`、空 segment 與不符合 slug grammar 的輸入，或先用與 URL 產生完全相同的 path normalization 後再檢查每個有效 segment；補充 dot-segment、重複 slash、URL encoding 測試。

### M-2：sitemap 查詢沒有用到 design 指定的 composite index

- 檔案：`apps/marketing/app/sitemap.ts:31-41`
- 檔案：`packages/database/prisma/schema.prisma:1353-1354`
- 檔案：`packages/database/prisma/migrations/20260829180000_add_page/migration.sql:29-33`
- 觸發：sitemap query 只有 `where: { status: "PUBLISHED" }`，但唯一新增 index 是 `(type, status, locale)`。
- 理由：該 composite index 的 leading column 是 `type`；查詢沒有 type 條件，不能按 design 所寫的 `(type,status,locale)` 路徑有效篩選。公開頁面查詢也同樣只用 `status`（`apps/marketing/modules/blog/lib/database-pages.ts:24-25`）。資料量變大時會退化為掃描較多 page rows，與 design 的效能 mitigation 不符。
- 影響：sitemap 是爬蟲高頻端點；買家內容量上升後，資料庫負載與 sitemap latency 會增加。
- 修復方向：依實際查詢形狀新增以 `status` 開頭的 index，或拆成按 type 的查詢並讓 where 條件對齊既有 index；用資料庫 `EXPLAIN` 驗證，而不是只驗證 migration SQL 存在 index。

### M-3：sitemap 與 fallback 會把單一語系內容錯誤發布到其他語系 URL

- 檔案：`apps/marketing/app/sitemap-entries.ts:33-41`
- 檔案：`apps/marketing/modules/blog/lib/database-pages.ts:57-66`
- 觸發：資料庫只有 `locale: "en"` 的 `about` Page，或只有 `locale: "zh-cn"` 的內容。
- 理由：sitemap 對每筆已發布 Page 無視 `page.locale`，直接對 `input.locales` 全部產生 URL。公開查詢找不到請求語系與 `fallbackLocale` 時，又退回 `matches[0]`；因此一筆 en-only 內容可能出現在 `/about`、`/zh-cn/about`，並在中文請求中顯示 English，而不是依設計固定 fallback 到 zh-tw。現有 sitemap 測試反而把「zh-tw Page 產生 /en URL」寫成預期，沒有驗證 locale 綁定。
- 影響：搜尋引擎收到不存在或語言錯誤的 canonical URL；訪客在錯誤語系頁面看到內容。這也讓 sitemap 宣稱存在的 URL 與實際語系內容不一致。
- 修復方向：明確定義 fallback URL 策略；至少 sitemap 必須依實際 locale 產生，fallback 頁面只在產品決定允許時產生，且禁止 `matches[0]` 這種非 deterministic 語系 fallback。補上 en-only、zh-cn-only、zh-tw fallback 測試。

## 審查驗證

- `pnpm --filter @startkiter/platform test -- --run src/pages-cms/sanitize.test.ts src/pages-cms/reserved-slugs.test.ts src/pages-cms/restore.test.ts`：13 files / 77 tests passed（Vitest 也執行了 package 內既有測試）。
- `pnpm --filter @startkiter/api exec vitest run modules/pages-cms/handlers.test.ts`：1 file / 5 tests passed。
- `pnpm --filter @startkiter/marketing test -- --run app/sitemap.test.ts`：5 files / 37 tests passed（Vitest 也執行了 package 內既有測試）。
- `pnpm exec vitest run tooling/scripts/migrate-mdx-to-pages-cms.test.ts`：1 file / 2 tests passed。
- `git diff --check main..HEAD`：通過。
- API package 全 test 嘗試：49 files / 221 tests passed，但另有既有 `modules/assignment/assignment-lifecycle.test.ts` 因未設定 `DATABASE_URL` 在 import 時失敗；這是環境/baseline 證據，不視為 pages-cms 通過證明。

## 改動範圍

功能必要的資料表、API、platform core、admin UI、marketing page/sitemap、migration 與測試皆在本 change 範圍內。另有兩個 proposal Impact 未明列但為公開頁面實作所需的既有檔案修改：

- `apps/marketing/app/[locale]/[...rest]/page.tsx`
- `apps/marketing/app/[locale]/blog/[...path]/page.tsx`

它們不是與功能無關的改動，但 proposal 的 Impact 清單不完整，應在 change 文件補列，避免把既有 route 行為變更漏在 scope review 外。

## Verdict

不通過。Critical 0、High 2、Medium 3、Low 0。至少 H-1 與 H-2 修復並重新執行完整驗證前，不應 archive 這張 change。
