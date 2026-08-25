## Task 2.1 阻塞：Coolify Dashboard 遭覆蓋

- `coolify-test.startkiter.dev` 被先前部署的 NGINX demo image 佔用。
- 無論使用 `curl` 還是 `ego-browser` 存取該網域（包含 `/api/v1/teams`），都會回傳 NGINX Hello World 頁面，無法觸及 Coolify Dashboard。
- 嘗試直接存取 IP `45.76.187.247:8000` 超時（可能受限於 ufw）；`http/https://45.76.187.247` 則回傳 Traefik 404/503。
- 無 SSH 權限（Host key verification failed / Permission denied），無法從主機端停止 NGINX 容器。
- 因此無法建立 `apps/marketing` resource，需待老闆手動移除 NGINX 對該網域的佔用，或提供正確的 Coolify Dashboard 網域/路徑。

## Task 2.2 & 5.2 已完成

- Cloudflare DNS 已將 `startkiter.dev` 成功指向 `45.76.187.247` (Proxied)。
- 由於 2.1 尚未完成，Coolify 尚未設定接收 `startkiter.dev` 的請求，目前 `curl -I https://startkiter.dev` 會收到 Traefik 的 `503 Service Unavailable`（預期中的行為）。
- `app.startkiter.dev` 正常回傳 `307`。
- `test-startkiter.vercel.app` 正常回傳 `404`。
