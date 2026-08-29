## Why

買家目前想改自己網站的文字/文章（首頁介紹、關於我們、部落格），唯一方法是直接改 `.mdx` 原始碼檔案再重新部署，對不會寫程式的買家不可行。`platform-core-boundary` 已宣告「頁面編輯系統」是官方 Core 固定能力（買家不可用 Plugin 取代），但具體實作一直沒有落地，買家目前實質上沒有內容管理功能可用。

## What Changes

- 新增買家後台「頁面/文章管理」功能：新增/編輯/發布/下架 Posts 與 Pages，支援 zh-tw／zh-cn／en 三語系
- 新增資料庫表格儲存買家自訂內容，後台按儲存即時生效（不需重新部署）
- 買家自己網站（`apps/marketing`）改為同時讀取兩種內容來源：既有 `.mdx` 檔案（StartKiter 官方保留使用，不受影響）與新資料庫表格（買家專用）
- 新增此功能於 `packages/platform/src/mount-points.ts` 掛載點清單，掛進後台選單，標記為 Core（不可被 Plugin 機制覆蓋或取代）
- 新增內容清洗（sanitize）機制，防止買家貼入的內容含有惡意程式碼
- 新增網址（slug）保留字檢查，避免買家自訂頁面路徑與系統既有路由衝突
- 新增「上一版本」還原機制，買家誤刪/誤改內容可復原
- 修改 sitemap 產生邏輯，納入資料庫來源的買家頁面（原本只讀 `.mdx` 檔案）
- 新增既有 `.mdx` 內容一次性轉入資料庫的遷移腳本，供已履約買家升級時使用

## Capabilities

### New Capabilities

- `buyer-pages-cms`: 買家後台管理自己網站 Posts/Pages 內容的系統，含多語系、即時生效、內容安全防護、版本復原

### Modified Capabilities

（無：新增掛載點項目屬於既有掛載點註冊機制定義下的正常使用方式，不構成需求變更）

## Impact

- Affected specs: `buyer-pages-cms`（新建）
- Affected code:
  - New:
    - `packages/database/prisma/schema.prisma`（新增 Page/Post 相關 model）
    - `packages/platform/src/pages-cms/`（CMS 核心邏輯：CRUD、sanitize、slug 檢查、版本復原）
    - `apps/saas/app/(authenticated)/(main)/(account)/admin/pages/`（後台管理頁面 UI）
    - `apps/saas/app/api/pages-cms/route.ts`（後台 CRUD API）
    - `tooling/scripts/migrate-mdx-to-pages-cms.ts`（既有 `.mdx` 內容遷移腳本）
  - Modified:
    - `packages/platform/src/mount-points.ts`（新增掛載點）
    - `apps/marketing/modules/blog/lib/posts.ts`（改為同時支援 `.mdx` 與資料庫兩種來源）
    - `apps/marketing/app/sitemap.ts`（納入資料庫來源頁面）
    - `apps/marketing/app/[locale]/[...rest]/page.tsx`（公開站讀取資料庫 PAGE）
    - `apps/marketing/app/[locale]/blog/[...path]/page.tsx`（公開站讀取資料庫 POST）
  - Removed: 無
