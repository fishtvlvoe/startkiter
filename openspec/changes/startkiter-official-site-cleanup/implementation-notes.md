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

## 3.2 舊 Vercel 網址

執行時間：2026-08-25（Asia/Taipei）

已移除 `test-startkiter` Vercel project 的 `test-startkiter.vercel.app` domain binding，並移除該 project。驗證結果：

```text
$ curl -sS -I --max-time 20 https://test-startkiter.vercel.app
HTTP/2 404
x-vercel-error: DEPLOYMENT_NOT_FOUND
```

結果：PASS。舊測試網址不再指向有效 deployment；`app.startkiter.dev` 仍回 HTTP 307 `/login`，兩者狀態已明確區隔。

## 4.1 文件同步

已更新 `AGENTS.md` 指向 `openspec/changes/startkiter-official-site-cleanup/`，並同步 README 的正式網域與舊 Vercel 測試站狀態。

## 5.1 Spectra 驗證

```text
$ spectra validate startkiter-official-site-cleanup
✓ startkiter-official-site-cleanup — valid
```

結果：PASS。

## 2.1–2.2 Coolify resource 與正式 DNS

結果：BLOCKED。`https://app.coolify.io` 目前只顯示登入頁；本機沒有 `COOLIFY_BASE_URL` 或 `COOLIFY_API_TOKEN`，因此沒有建立 resource，也沒有在 resource 尚未存在時先建立 `startkiter.dev` DNS，避免把正式網域指到空服務。

已知目標節點與既有測試資源來自本 repo 的 infra 紀錄：節點 `startkiter-managed-fleet-01`；既有測試資源為 `docker-image-rzbtl1kdjd9mdtfabeoaa9tj` 與 `startkiter-coolify-git-deploy-test`。它們不是 marketing resource，未冒充使用。

## 5.2 三網域最終狀態

執行時間：2026-08-25（Asia/Taipei）

```text
app.startkiter.dev       HTTP/2 307  location: /login
startkiter.dev           curl: (6) Could not resolve host
test-startkiter.vercel.app HTTP/2 404  x-vercel-error: DEPLOYMENT_NOT_FOUND
```

結果：BLOCKED。SaaS 與舊 Vercel 網址符合預期，但官方 marketing 網域尚未建立 DNS／Coolify resource，不能把 5.2 標成 PASS。

## 完整驗證

原始命令 `pnpm test && pnpm build` 已執行；第一次因 Prisma generated client 不存在而在測試階段停止。以一次性 `DATABASE_URL` 執行 Prisma generate 後重跑，測試仍在 `course-quiz` 的真實資料庫 CRUD 因資料庫拒絕存取而失敗；沒有可用真實資料庫連線，未把測試報成全綠。

獨立執行 `DATABASE_URL=... pnpm build`：PASS，turbo 2/2 build tasks 成功（marketing、saas）。build 輸出含 Better Auth default-secret 警告，未影響 exit code 0。
