# buyer-pages-cms 端對端驗收

日期：2026-08-29

## 後台流程（4.1 / 5.3）

1. operator 登入後台 `/admin/pages`
2. `POST /api/pages-cms` 新增 PAGE `verify-draft-page`，body 含 `<script>alert(1)</script>`
   - 201，`warnings: ["removed tag: script"]`，資料庫 body 不含 script，status=DRAFT
3. `PATCH` 發布 → status=PUBLISHED，`publishedAt` 有值
4. `PATCH` 把 body 改成「誤改後的內容」
5. `POST .../restore` → body 回到「第一版內容」

截圖：`01-list.png`、`02-new-form.png`、`05-restored.png`、`06-sidebar-pages-cms.png`

## 公開站

- `GET http://localhost:3001/zh-tw/verify-draft-page` → 200
- 頁面標題「驗證草稿頁」，內文「第一版內容」，不含 script
- `GET /verify-draft-page` → 307 到 `/zh-tw/verify-draft-page`
- 截圖：`07-public-page.png`

## Sitemap

`GET http://localhost:3001/sitemap.xml` 含：

- `http://localhost:3001/verify-draft-page`
- `http://localhost:3001/zh-cn/verify-draft-page`
- `http://localhost:3001/en/verify-draft-page`

原檔：`sitemap.xml`

## MDX 遷移 dry-run

```
wouldCreate: 1
created: 0
failed: [{ file: "broken.mdx", error: "missing frontmatter" }]
files: ["hello"]
```
