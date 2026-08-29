## Context

StartKiter 買家目前無法在不改程式碼的情況下更新自己網站的一般頁面/文章內容；`platform-core-boundary` 已宣告頁面編輯系統為 Core 能力，`platform-shell-plugin-architecture`（2026-08-23）已決議拆成獨立 change 待 propose，但尚未有人開案落地。課程內容管理已透過 `course-studio-upgrade`（2026-08-23 封存）完成，其 CRUD/拖曳排序/影片辨識模式可作為本次後台 UI 的參考先例。官方自身內容（部落格、法律頁）現行用 content-collections 讀取 `.mdx` 檔案（`apps/marketing/content-collections.ts`），此機制運作正常且本次不予更動。每位買家部署為獨立倉庫+獨立資料庫（per-buyer 專屬可寫倉庫，`platform-shell-plugin-architecture` 已定案），因此本功能將作為範本程式碼的一部分，透過既有 `buyer-repo-upstream-sync` 機制推送給既有買家。

## Goals / Non-Goals

**Goals:**

- 買家能在自己的後台新增/編輯/發布/下架一般頁面（Pages）與文章（Posts），改動即時生效（不需重新部署）
- 支援 zh-tw／zh-cn／en 三語系，缺少翻譯時 fallback 至 zh-tw（比照現有 i18n 慣例）
- 內容儲存前經過清洗，防止 XSS
- 自訂網址（slug）不得與系統既有路由衝突
- 誤刪/誤改內容可復原至上一版
- 買家新增的頁面納入 sitemap，可被搜尋引擎索引
- 功能位置落在 Core（`packages/platform`），不可被買家透過 Plugin 機制覆蓋或取代
- 既有已履約買家的 `.mdx` 內容可透過遷移腳本一次性轉入新資料表

**Non-Goals:**

- 不做官方自己網站（StartKiter 官方部落格/法律頁）內容來源的遷移或改動，官方繼續使用 `.mdx` + content-collections
- 不做完整版本歷史/多版本比對介面，只留「上一版」單層復原
- 不做富文本協作編輯（多人同時編輯同一頁面的即時同步）
- 不做自訂頁面版型/拖拉式頁面產生器（page builder），本次僅提供結構化欄位（標題、內文、SEO meta、封面圖）+ MDX 內文編輯
- 不做跨買家內容範本市集（marketplace 模板頁面互相複製），如需要另開 change
- 不處理現有 `course-*` 系列 Plugin 的內容管理，範圍與 `course-studio-upgrade` 已完成的課程管理互斥

## Decisions

### Decision: 新增 Page 資料表，不重用現有 Course/Lesson 表格

以獨立的 `Page` model 儲存內容，不與 `Lesson.content` 共用欄位。

Alternatives Considered:
- 直接擴充 `Lesson` model 掛一個 `type: PAGE` 欄位 → 否決：`Lesson` 綁定 `Chapter`/`Course` 外鍵，語意上是課程單元，硬塞會讓查詢邏輯與權限判斷（`course-instructor-scoped-access` 既有邏輯）混淆
- 用現有 `CoursePackMission`（教案系統）的結構重用 → 否決：該表格語意是「任務關卡」，欄位（`missionType`、`gradingRule`）與本次「一般頁面內容」需求不符，硬套會產生大量用不到的欄位

### Decision: 內容以單一 Page 表格 + type 欄位（POST/PAGE）區分文章與頁面

Post 與 Page 共用欄位（title、slug、body、locale、status、seoTitle、seoDescription、coverImageUrl），差異僅在文章有 `publishedAt` 排序需求、頁面沒有。

Alternatives Considered:
- 拆成 `Post` 與 `Page` 兩張獨立表格 → 否決：欄位重疊度超過九成，拆表會讓 sitemap／slug 唯一性檢查／sanitize 邏輯要寫兩份，增加維護成本且無實質效能差異
- 完全套用現有 `content-collections` schema 定義去反推資料庫欄位 → 部分採用：欄位命名沿用 `title`／`excerpt`／`tags`／`published` 慣例以降低買家與 AI 工具跨系統理解成本，但底層儲存改為 Prisma model

### Decision: 內容清洗使用白名單式 sanitizer，於寫入時而非讀取時執行

在 API 寫入（create/update）階段就對 body 內容跑白名單式 sanitize（僅允許 p、h1 到 h6、ul、ol、li、a、img、strong、em、blockquote、code 等標籤），資料庫內僅存乾淨內容。

Alternatives Considered:
- 讀取時（渲染前）才 sanitize → 否決：資料庫會存有害內容，若渲染端有一處忘記 sanitize（例如未來新增 RSS feed、AI 摘要功能直接讀 DB），會直接曝露 XSS 風險；寫入時清洗確保資料庫本身不可能存有害內容
- 不做 sanitize，改用純 Markdown 不允許任意 HTML → 否決：買家貼上從其他工具複製的排版內容常帶 HTML，強制轉 Markdown 會破壞既有排版體驗，且與現有 `.mdx` 系統（本身允許 HTML/JSX）體驗不一致

### Decision: slug 保留字用靜態黑名單比對，自動衍生自現有掛載點路由集合

建立 `packages/platform/src/pages-cms/reserved-slugs.ts`，內容為 `MOUNT_POINTS` 所有 `mount.route.path` 首段 + 固定系統路徑（api、admin、auth、_next）聯集，買家建立或修改 slug 時檢查是否落在此黑名單。

Alternatives Considered:
- 手動維護一份獨立黑名單清單，不自動比對 `MOUNT_POINTS` → 否決：未來新增掛載點時容易忘記同步更新黑名單，造成路由衝突的資安與可用性風險
- 執行期用 Next.js 路由表反查衝突 → 否決：Next.js 沒有公開 API 在 runtime 反查已註冊路由表，且會增加每次儲存的效能開銷

### Decision: 版本復原採儲存前自動備份上一版的單層快照，不做完整版本歷史表

`Page` model 新增 `previousSnapshot Json?` 欄位，每次 update 前把目前資料寫入該欄位，還原時直接把 `previousSnapshot` 內容寫回主欄位。

Alternatives Considered:
- 建 `PageRevision` 獨立表格記錄完整歷史 → 否決：Non-Goals 已明確排除完整版本歷史介面，多一張表格與對應 UI 會擴大本次範圍；買家的核心痛點是救回上一次手滑，不是版本比對
- 不做任何復原機制，靠資料庫備份還原 → 否決：資料庫層級備份還原是要工程師介入等級的救援，不符合買家自助的產品定位，也違反「防止資料遺失的錯誤處理不能省」的底線

### Decision: sitemap 改為執行期動態產生，不再是建置期靜態產出

`apps/marketing/app/sitemap.ts` 改用具 revalidate 秒數的動態產生策略，查詢時合併 `.mdx` 檔案清單與資料庫 `Page` 表格的已發布項目。

Alternatives Considered:
- 維持建置期靜態 sitemap，買家新增頁面後需觸發重新部署才會出現在 sitemap → 否決：違背本次按儲存即時生效的核心目標，買家新增頁面後短則數十分鐘、長則要等下次部署才會被搜尋引擎收錄，體驗不一致
- 用不設 revalidate 的完全動態（每次請求都查資料庫）→ 否決：sitemap 是高頻被爬蟲請求的端點，每次都查資料庫會造成不必要的資料庫負載，改用固定 revalidate 秒數（如 300 秒）平衡即時性與效能

## Implementation Contract

**行為（Behavior）**：
- 買家登入後台，側邊欄新增「頁面管理」選單（掛載於 `packages/platform/src/mount-points.ts`，`id: "pages-cms"`，`requiresOperator: true`）
- 買家可在此新增一筆內容，選擇類型（文章／頁面）、填標題、slug、內文（MDX）、SEO 標題/描述、封面圖、語系，按「發布」後，30 秒內該內容出現在對應語系的公開網址上
- 買家按「儲存草稿」時，內容存為 `status: DRAFT`，不出現在公開網站
- 買家輸入的 slug 若落在保留字黑名單或與其他已存在的同語系內容重複，儲存時回傳明確錯誤訊息並拒絕儲存，不得靜默截斷或自動改名
- 買家按「還原上一版」，該筆內容的所有欄位回復至上一次儲存前的狀態，此動作本身也會被記錄（`previousSnapshot` 更新為還原前的當前版本，允許再次復原）

**介面 / 資料形狀**：

```prisma
enum ContentType {
  POST
  PAGE
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Page {
  id               String        @id @default(cuid())
  type             ContentType
  slug             String
  locale           String
  title            String
  excerpt          String?
  body             String        @db.Text
  coverImageUrl    String?
  seoTitle         String?
  seoDescription   String?
  status           ContentStatus @default(DRAFT)
  publishedAt      DateTime?
  previousSnapshot Json?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@unique([slug, locale])
  @@index([type, status, locale])
  @@map("page")
}
```

- API：`POST /api/pages-cms`（新增）、`PATCH /api/pages-cms/[id]`（更新，含 sanitize 與 slug 檢查）、`POST /api/pages-cms/[id]/restore`（還原上一版）、`DELETE /api/pages-cms/[id]`（下架，軟刪除為 ARCHIVED，不硬刪）
- 每支寫入 API 回傳形狀：`{ page: Page, warnings: string[] }`，`warnings` 用於回報 sanitize 時被移除的標籤，讓買家知道內容被調整過

**失敗模式（Failure modes）**：
- slug 衝突或落在黑名單 → 400，錯誤訊息明確指出衝突原因（`SLUG_RESERVED` 或 `SLUG_TAKEN`）
- sanitize 移除了買家輸入的標籤 → 200 成功儲存，但 `warnings` 陣列非空，前端需顯示提示，不得靜默吞掉
- 找不到 `previousSnapshot`（例如從未編輯過的新內容按還原）→ 409，訊息告知無上一版可復原
- 未授權（非該站台 operator）呼叫任何 pages-cms API → 401/403，比照現有 `isCourseOperator` 判斷模式

**驗收標準（Acceptance criteria）**：
- 單元測試：sanitize 函式對已知 XSS payload（`<script>`、`onerror=`、`javascript:` href）的輸入，輸出不含該惡意片段
- 單元測試：slug 黑名單檢查涵蓋 `MOUNT_POINTS` 所有現有路由前綴與固定系統路徑
- 整合測試：建立內容、發布、呼叫 sitemap 產生邏輯，確認該內容的 URL 出現在輸出中
- 整合測試：編輯已發布內容兩次，呼叫還原 API，確認內容回到第一次編輯後、第二次編輯前的狀態
- 端對端：透過遷移腳本匯入一組既有 `.mdx` fixture 檔案，資料庫出現對應筆數的 `Page` 紀錄，欄位對應正確（title 對應 title、date 對應 publishedAt、tags 保留）

**範圍邊界（Scope boundaries）**：
- 範圍內：Posts/Pages 的 CRUD、多語系、sanitize、slug 檢查、單層版本復原、sitemap 整合、`.mdx` 遷移腳本、Core 掛載點註冊
- 範圍外：課程內容管理（已完成，見 `course-studio-upgrade`）、官方自己網站內容遷移、完整版本歷史、多人協作編輯、page builder 版型系統

## Risks / Trade-offs

- [Risk] sitemap 改為 runtime 動態查詢資料庫，若買家內容量成長或流量提升，可能拖慢 sitemap 產生速度甚至影響搜尋引擎爬取 → Mitigation: 設定 revalidate 快取（如 300 秒），非每次請求都即時查詢；資料庫查詢加上 `[type, status, locale]` index
- [Risk] sanitize 白名單標籤清單訂太嚴，買家慣用的排版（如影片內嵌 iframe）被整段移除，買家誤以為系統壞掉 → Mitigation: 移除的標籤透過 `warnings` 明確回報給前端顯示，不靜默吞掉；白名單清單放在獨立常數檔，未來可依實際回饋擴充
- [Risk] 既有已履約買家執行 `.mdx` 遷移腳本時，檔案 frontmatter 格式不規則（缺欄位、日期格式不一）導致遷移失敗或資料錯亂 → Mitigation: 遷移腳本先跑 `--dry-run` 輸出將寫入的筆數與任何解析失敗的檔案清單，人工確認無誤才真的寫入資料庫
- [Risk] `previousSnapshot` 只存一層，買家連續存錯兩次會覆蓋掉真正想復原的版本 → Mitigation: Non-Goals 已明確排除完整版本歷史，此為刻意的範圍取捨；UI 需在還原按鈕旁明確標示僅能復原至上一次儲存
- [Risk] 買家倉庫透過 `buyer-repo-upstream-sync` 拉取此次更新時，若買家已自行修改過 `apps/marketing/modules/blog/lib/posts.ts`（依現有官方文件允許串接外部 CMS 的擴充方式），merge 時可能衝突 → Mitigation: 比照 `platform-shell-plugin-architecture` 既有機制，買家主動觸發同步、非官方主動 push，衝突由買家的 AI 工具在同步當下處理，不在本次自動解決

## Migration Plan

部署步驟：
1. 執行 Prisma migration 新增 `Page` model 與 `ContentType`／`ContentStatus` enum（新增表格，不影響既有資料）
2. 部署 `packages/platform/src/pages-cms/` 與後台 UI、API 路由
3. 部署 `apps/marketing` 的 sitemap 與 blog utils 改動（同時支援兩種來源）
4. 掛載點註冊（`mount-points.ts` 新增 `pages-cms` 項目）上線後，後台選單即出現頁面管理
5. 針對已履約買家，另行排程執行 `tooling/scripts/migrate-mdx-to-pages-cms.ts --dry-run` 確認無誤後，由買家或 StartKiter 團隊人工觸發正式遷移，不自動背景執行

回滾策略：
- Prisma migration 為新增表格與新增 enum，回滾可直接 `DROP TABLE "page"` 與移除 enum，不影響既有 Course/Lesson 等表格
- `mount-points.ts` 掛載點新增可用 git revert 還原，UI／API 路由改動同樣可 git revert
- sitemap 改動若造成效能問題，可先移除動態設定退回純 `.mdx` 靜態來源，資料庫內容不受影響，只是暫時不出現在 sitemap

## Open Questions

- 既有已履約買家要不要收到「新功能上線，可執行遷移」的主動通知？通知管道與時機留待老闆裁決，本次 tasks.md 只列出遷移腳本本身，不含通知機制
- sanitize 白名單標籤清單的最終版本（是否允許 iframe 嵌入影片等）留待實作階段依 `course-media-library` 現有的媒體嵌入慣例決定，不在本次設計階段鎖死
