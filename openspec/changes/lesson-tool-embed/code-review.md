# lesson-tool-embed 獨立 Code Review

審查範圍：`main...HEAD`（merge-base：`f8f7cf628d234771cb715727a92a363bb4974144`），並以 `git log --oneline main..HEAD` 列出的 lesson-tool commit 實際 patch 為準。

本報告只審查本 change 的 32 個實際新增／修改檔案。`main` 後來才合併的 `course-ai-notes-single` 檔案不屬於本次 change，未列入 findings。

## Critical

無。

## High

### H-1：SSRF 黑名單沒有做 DNS 解析，且 IPv6／IPv4-mapped 位址可繞過

位置：

- `packages/platform/src/lesson-tool/url-safety.ts:39-55`
- `packages/platform/src/lesson-tool/embed-path.ts:22-24`
- `apps/saas/app/api/lesson-tool/config/route.ts:56-60`
- `apps/saas/app/lesson-tool/[lessonId]/[encodedOrigin]/page.tsx:67-69`

`isPrivateOrLocalUrl` 只讀 `new URL(url).hostname`，只對字串形式的 `localhost` 與部分 IPv4 做分類，沒有呼叫 DNS resolver，也沒有把 hostname 解析出的所有 A／AAAA 位址逐一檢查。因此 `https://public-name.example` 即使目前解析到 `10.0.0.1` 或 `169.254.169.254`，仍會回傳 `false`；儲存時與簽發時都會放行，違反 design 要求的 DNS rebinding 防護。

同一個 classifier 也放行以下內部位址形式：`http://[fc00::1]/`（ULA）、`http://[fe80::1]/`（IPv6 link-local）、`http://[::ffff:127.0.0.1]/`（IPv4-mapped loopback）。這些不是測試中的 IPv4 dotted-decimal，但仍屬 private/local 位址。實際 Node `URL` probe 顯示上述 hostname 可被正常解析，而目前函式會落到 `return false`。

影響：攻擊者若能讓講師儲存或讓既有網域發生 DNS rebinding，瀏覽器 iframe／新分頁可被導向內部服務；若未來代理路徑加入 server-side fetch，這也會直接形成 server-side SSRF。修正需要在儲存與每次使用時解析 hostname，檢查所有 A／AAAA 結果，並完整涵蓋 loopback、RFC1918、link-local、ULA、IPv4-mapped IPv6 等範圍；不能只補測試中的幾個 literal。

### H-2：學員端 iframe 沒有經過通行證閘門，實際直接載入 `toolUrl`

位置：

- `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/lesson-tool-embed.tsx:22-38`
- `apps/saas/app/lesson-tool/[lessonId]/[encodedOrigin]/page.tsx:85-92`
- `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/page.tsx:79-92`

`buildLessonToolEmbedPath` 只用來產生「在新分頁開啟」的 wrapper href；`LessonToolEmbed` 的 iframe `src` 卻是資料庫中的原始 `toolUrl`。新分頁 page 也只是驗證後把同一個原始 URL 放進 iframe，沒有代理、signed fetch 或其他 server-side gate。

因此 token 只保護 wrapper HTML，不保護實際工具請求。任何拿到／猜到外部工具 URL 的人都能直接請求該 URL，分享 wrapper token 也不是唯一存取路徑；退款後 404 只會讓 wrapper 失效，不能撤回已暴露的直接工具 URL。這與 proposal 所稱「避免未購課的人繞過授權直接拿到工具真實網址」及「verify token before serving embedded tool」不一致。

修正方向是讓 iframe 載入受保護的 same-origin proxy endpoint，由 endpoint 驗證 token、重新檢查課程權限及 SSRF 解析結果後才向外抓取／代理；若產品接受外部工具 URL 本來就是公開資源，則應在 spec 明確移除「通行證保護工具本身」的承諾，而不能把 wrapper 404 當成撤權完成。

## Medium

### M-1：工具網址沒有限制 scheme，`data:`／`javascript:`／`file:` 也會被當成公開工具

位置：

- `apps/saas/app/api/lesson-tool/config/route.ts:10-14, 56-60`
- `packages/platform/src/lesson-tool/url-safety.ts:39-55`
- `apps/saas/app/lesson-tool/[lessonId]/[encodedOrigin]/page.tsx:71-92`

API schema 只要求 `toolUrl` 是字串；`isPrivateOrLocalUrl` 對非 HTTP(S) scheme 不拒絕。實際上 `new URL("data:text/html,...")`、`new URL("javascript:...")`、`new URL("file:///etc/passwd")` 都可成功，`origin` 為 `null`，之後仍可能被組成 embed path 並交給 iframe。sandbox 降低了同源資料存取風險，但沒有把這些 scheme 變成外部可信工具，且 `allow-scripts`／`allow-popups` 仍留下釣魚或不預期內容執行面。

修正應在共用 server-side validator 明確只允許 `http:`／`https:`，再做 DNS/IP 檢查；儲存、簽發及新分頁組裝都使用同一驗證結果。

### M-2：後台儲存不是原子操作，工具 URL 被拒絕時其他單元變更已先寫入

位置：`apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx:567-605`

`handleSaveLesson` 先呼叫 `/api/course/studio` 更新標題、影片、MDX、`aiContext`，成功後才呼叫 `/api/lesson-tool/config`。若第二步因 `TOOL_URL_PRIVATE`、權限錯誤或網路錯誤失敗，前半段已持久化，但 UI 顯示整次工具設定儲存失敗。使用者重試或清除欄位時可能以為整筆沒有保存，造成部分更新與畫面認知不一致。

這不是權限繞過，但違反「儲存工具設定」的完整性預期。應把 tool 欄位納入同一個受權限與 SSRF 驗證的 lesson update transaction，或至少先驗證 tool 設定、再提交其他欄位，並在部分成功時明確回報哪些欄位已保存。

## Low

無。

## 已確認沒有發現問題的重點

- `packages/platform/src/lesson-tool/token.ts:14-39` 使用 `createHmac("sha256")`、`BETTER_AUTH_SECRET`、版本 payload 與 `timingSafeEqual`，模式符合 `lesson-message-upload.ts`；payload 的 `lessonId`／`userId`／TTL 也有驗證。
- `apps/saas/app/lesson-tool/[lessonId]/[encodedOrigin]/page.tsx:51-65` 每次 dynamic page load 都重新呼叫 `userCanAccessCourseId` 與 `canManageCourse`，權限撤銷會在 token TTL 內阻擋並 `notFound()`；沒有看到把 access result cache 起來的程式碼。
- `apps/saas/app/api/lesson-tool/config/route.ts:47-54` 先以 lesson 所屬 `courseId` 呼叫既有 `canManageCourse`，非講師／操作員在 update 前即回 403；現有測試也斷言 `db.lesson.update` 不會被呼叫。

## 驗證紀錄

- platform 聚焦測試：3 files、13 tests passed。
- saas lesson-tool 聚焦測試：2 files、8 tests passed。
- 測試未涵蓋 DNS resolution／rebinding、IPv6 private ranges、非 HTTP scheme、以及 iframe 是否經過 token-protected proxy，因此上述問題不會被目前測試捕捉。
