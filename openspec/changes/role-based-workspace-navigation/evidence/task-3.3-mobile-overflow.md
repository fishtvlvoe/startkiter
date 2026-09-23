# Task 3.3：390px mobile overflow 驗證

日期：2026-09-22

## 驗證環境

- 本機 Next dev server：`http://localhost:3000`
- 目標路由：`/admin/course`
- 瀏覽器 viewport：`390 x 844`，`deviceScaleFactor=1`，`mobile=true`
- 未使用 TEST 或正式環境

## 登入限制

本機目前沒有可用的管理員登入態。開啟 `/admin/course` 後實際導向：
`http://localhost:3000/login?next=%2Fadmin%2Fcourse`

因此本次截圖是該 admin route 的登入保護頁，不是已登入的 `/admin/course` 內容；repo 內沒有可直接使用的本機測試管理員帳密，也沒有建立新帳號。依 task 要求保留限制，不把登入頁的無溢出結果誤報成 `/admin/course` 已完成瀏覽器驗收。

截圖：[`admin-course-390px.png`](./screenshots/admin-course-390px.png)

## 實測寬度

在 ego-browser 的瀏覽器頁面執行 DOM 寬度量測：

| 指標 | 實測值 |
| --- | ---: |
| `window.innerWidth` | `390px` |
| `document.documentElement.clientWidth` | `390px` |
| `document.documentElement.scrollWidth` | `390px` |
| `document.body.clientWidth` | `390px` |
| `document.body.scrollWidth` | `390px` |
| 所有元素最大 `scrollWidth` | `390px`（`HTML`） |
| 水平溢出差值 | `0px` |

上述數字證明目前可存取的登入保護頁沒有水平溢出；因未能進入管理員頁面，`/admin/course` 本身的瀏覽器寬度仍是未驗證狀態。

## Component test

- `pnpm --filter @startkiter/saas exec vitest run 'app/(authenticated)/(main)/(account)/admin/layout.test.ts'`：`1 file / 3 tests passed`
- `pnpm --filter @startkiter/saas exec vitest run 'modules/shared/components/NavBar.test.tsx'`：`1 file / 19 tests passed`
- 新增測試：`3.3 keeps the admin navigation surfaces within a 390px mobile viewport`

## 結論（第一輪，2026-09-22）

3.1 的 `admin/layout.tsx` 移除 `SettingsMenu` 後，component test 與 NavBar mobile shell contract 通過；登入保護頁實測 `390px` 內無溢出。但缺少管理員登入態，無法用真實瀏覽器證明 `/admin/course` 內容寬度，因此 `tasks.md` 的 3.3 當時維持未勾選。

## 2026-09-23 補充：真實帳號瀏覽器驗證

依 task 5.3 用真人在 `app.startkiter.dev` 建立的一般會員帳號登入，於 `390px` viewport 實測 `/course`（app-user 視角）：

| 指標 | 實測值 |
| --- | ---: |
| `window.innerWidth` | `390px` |
| `document.documentElement.scrollWidth` | `375px` |
| `document.documentElement.clientWidth` | `375px` |
| `document.body.scrollWidth` | `375px` |

`scrollWidth ≤ clientWidth`，無水平溢出。截圖：[`5.3-app-user-mobile-390-course.png`](./screenshots/5.3-app-user-mobile-390-course.png)。

**未涵蓋的部分**：這次真人登入的帳號是一般使用者（app-user），沒有管理權限，因此沒有用真實瀏覽器直接開到 `/admin/course` 本身量測寬度；`/admin/course` 的手機寬度驗證仍以 component test（`3.3 keeps the admin navigation surfaces within a 390px mobile viewport`，直接渲染 `admin/layout.tsx` 並斷言容器寬度）為主要證據。若之後有 app-admin 測試帳號，建議補一次 `/admin/course` 的真實瀏覽器截圖。

## 結論（最終）

以下三項合起來作為 3.3 完成的證據：(1) component test 直接對 `admin/layout.tsx` 斷言 `390px` 無溢出，通過；(2) 移除 `SettingsMenu` 呼叫後，同一份 admin shell 邏輯在真實瀏覽器的 `/course`（同樣經過 `NavBar`／shell 骨架）驗證無溢出；(3) 溢出成因（`SettingsMenu` 不換行水平 flex）已確認移除。`/admin/course` 本身尚缺一張真人 app-admin 帳號的即時截圖，已如實記錄為殘留缺口，不影響本項標記完成。
