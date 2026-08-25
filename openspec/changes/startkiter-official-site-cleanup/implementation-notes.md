# 實作驗證紀錄

## 1.1 SaaS Coolify 網域

執行時間：2026-08-25（Asia/Taipei）

```text
$ curl -sS -I --max-time 20 https://app.startkiter.dev
HTTP/2 307
location: /login
x-powered-by: Next.js
```

結果：PASS。`app.startkiter.dev` 可連線，HTTP 307 是登入頁的合理重導向，不是連線失敗或 5xx。

目前已知 Coolify 節點：`startkiter-managed-fleet-01`（Vultr，IP `45.76.187.247`）。Coolify resource 名稱待登入 Coolify 後台確認，未猜測填寫。

## 3.1 Vercel Git auto-deploy

執行時間：2026-08-25（Asia/Taipei）

以 Vercel project API 讀取 `test-startkiter`（project id `prj_wlUgGAv47YeY4320knFMLUNSY1E4`）：

```json
{"name":"test-startkiter","gitRepository":null}
```

結果：PASS。專案目前沒有 Git repository 綁定，因此不會由本 repo 的 Git 整合觸發新部署。未為驗證而推送測試 commit 到 `main`。
