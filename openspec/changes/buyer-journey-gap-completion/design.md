## Context

2026-09-24 用 ego-browser 實測雲端正式站 `https://app.startkiter.dev` 完整走過一次買家路徑，記錄在 `docs/2026-09-24-畫面落差與上架路徑.md`。四個落差都不是缺後端能力，是畫面沒接上既有能力，或是課程首頁讀了跟教室/官網不同的資料來源。這張 change 只處理該文件第 3、4、5 節；第 6 節（優惠券管理、報表下載、站內通知）與第 8 節（真實付款、GitHub 私倉驗證、LINE 邀請點擊測試、正式站回滾）明確排除，留待後續。

2026-09-24 討論中 Fish 修正了 LINE 連結的做法：不是全站一個環境變數，是每門課各自一個連結，存在課程資料裡，後台可以直接貼上存檔；學員只有買了「這門課」才看得到「這門課」的連結。

## Goals / Non-Goals

**Goals:**

- 課程首頁（`/course`）跟教室、官網共用同一份已發布課綱來源
- 課程管理員能用一個明確的「預覽學員教室」入口看到真實學員畫面，並能單一按鈕返回課程工作室
- 已購買且符合資格的使用者，在結帳頁或課程頁能實際按下「領取代碼包」
- 課程管理員能在課程設定貼上該課程的 LINE 學習群連結並存檔；已購買該課程的學員在該課程頁看到可點擊連結

**Non-Goals:**

- 不新增 GitHub claim 相關 API；沿用 `POST /api/github/claim`、`GET /api/github/claim-status`
- 不新開 LINE 連結專用的 API 端點；存檔沿用既有課程更新路徑（`apps/saas/app/api/course/studio/route.ts`），讀取直接隨課程資料一起回傳
- 不做優惠券建立/停用、組合包/優惠券報表下載、站內通知（文件第 6 節第 5-7 項，另開 change）
- 不做正式站回滾演練、不做真實付款測試、不驗證 GitHub 私倉是否真的生成、不驗證 LINE 邀請連結點擊後是否入群（文件第 8 節，需另外授權或另開驗收任務）
- 不改登入流程、不重畫官網首頁、不接 LINE Login 或任何 LINE 官方介面
- 不做多課程間的權限交叉判斷（目前正式站只有一門已發布課程「電馭學院」，欄位設計成每門課各自一個是為未來多課程鋪路，本次不需要新增跨課程權限邏輯）

## Decisions

### 課程首頁改用課程套件的已發布課綱，取代 listLessons() 固定清單

現況 `apps/saas/app/(authenticated)/(main)/(account)/course/page.tsx` 呼叫 `@startkiter/course` 的 `listLessons()`，回傳的是套件內建的三個固定示範單元標題（「開站包是什麼」「站殼、登入與結帳路徑」「課程模組與權限閘門」），不是資料庫裡已發布的「電馭學院」課程樹。教室（`/course/lesson-01`）走的是資料庫課程樹，兩者標題、順序、id 完全不同，買家點課程首頁的連結進教室會看到跟清單不符的內容。

改法：課程首頁改讀 `packages/course` 對外提供的已發布課程/章節/單元 reader（與官網課綱、教室共用同一個讀取路徑），依 `position` 排序，只能讀已發布資料，不讀 draft。

**Alternatives considered**：
1. 保留 `listLessons()` 靜態清單，改寫死內容成跟電馭學院一致 → 否決，之後課程內容異動又會跟教室不同步，治標不治本
2. 讓教室改讀 `listLessons()` 對齊課程首頁 → 否決，教室資料來源是資料庫已發布課程，是正確的一方，不該讓正確的一方遷就錯的一方

### 課程管理員用獨立的「預覽學員教室」模式看學員畫面，照 docs/ux/startkiter-navigation-focus.html 原始設計稿，不在 /course 選單裡加入口

2026-09-27 對照設計稿（`docs/ux/startkiter-navigation-focus.html`）發現：設計稿本來就畫了這個橋接情境，做法是「預覽模式」——課程管理員在 `/admin/course` 工作室內按下「預覽學員教室」，進入 `/course/preview` 這個獨立路由，畫面呈現真實學員會看到的內容，右上角固定一顆「返回課程管理員」按鈕，且預覽模式下不顯示任何管理選單。這跟原本規劃的「在 `/course` 學員選單裡插入一條連到 `/admin/course` 的項目」方向不同：原方向是從學員側加管理入口，設計稿是從管理側加預覽入口，兩者反向。2026-09-27 Fish 裁決採用設計稿方向。

改法：
1. `/admin/course` 課程工作室新增「預覽學員教室」按鈕，導向 `/course/preview`。
2. 新增 `/course/preview` route：內容呼叫跟真實 `/course` 相同的已發布課程 reader（跟第一個 Decision 共用同一份資料來源，避免又出現第二套課程清單），但版面不掛任何選單（不掛學員選單、不掛管理選單），只在固定位置顯示一顆「返回課程管理員」按鈕，連回 `/admin/course`。
3. 真實學員使用的 `/course` 保持不變，不因為這次改動而長出任何新按鈕或新選單項目；只有課程管理員本人透過工作室按下「預覽學員教室」才會進到 `/course/preview`，兩條路由的內容資料來源相同、但外框（選單/返回鈕）不同。

**Alternatives considered**：
1. 原方向：在 `/course` 學員選單直接插入一條連到 `/admin/course` 的項目 → 否決，這是 2026-09-24 想出來的簡化版，改動量小但不符合原始設計稿的「預覽模式」概念，且會讓真實學員的 `/course` 選單邏輯多一層「判斷實際角色」的分支，設計稿選擇把這個複雜度隔離在一個獨立預覽路由裡，不動真實學員頁面
2. 讓課程管理員登入後直接落地在 `/admin/course`、不進 `/course` → 否決，管理員仍需要用學員視角驗貨或體驗自己的課程，只是這次改用「工作室內按預覽鈕」而不是「學員頁面本身判斷角色」

### 領代碼按鈕是條件式渲染的 UI 元件，接上既有 API，不新增後端邏輯

領代碼已有完整後端流程（`POST /api/github/claim` 送出、`GET /api/github/claim-status` 查狀態），缺的只是畫面上的按鈕與查詢串接。渲染條件是「使用者對 `startkiter-mvp` 這筆訂單 `courseAccess: true` 且 `kitClaimEligible: true`」，查詢邏輯沿用既有訂單查詢，不新增判斷路徑。

**Alternatives considered**：
1. 把領代碼按鈕只放課程首頁，不放結帳頁 → 否決，結帳頁是購買完成後第一個看到的頁面，也需要出口，兩處不是互斥選擇
2. 在按下按鈕當下才判斷資格（現況不顯示按鈕就不查） → 否決，會讓不符資格的人看到一個永遠失敗的按鈕，違反「未達資格者不顯示可按按鈕」的可觀察行為

### LINE 學習群連結是 `Course` 資料表的欄位，不是全站環境變數；存檔沿用既有課程更新路徑

原始文件（`docs/2026-09-24-畫面落差與上架路徑.md` 第 5 節）建議讀全站環境變數 `LINE_COMMUNITY_INVITE_URL`。2026-09-24 討論中 Fish 修正方向：不同課程要能各自設定不同的 LINE 群連結，因為未來不會只有一門課。改為在 `Course` 資料表新增 `lineInviteUrl String?` 欄位，課程工作室（Course Studio）設定頁多一個輸入框，存檔沿用既有課程更新流程 `apps/saas/app/api/course/studio/route.ts`（該路由已經支援 `{ title, description, status }` 這種單一動作更新課程多個欄位的寫法，`lineInviteUrl` 併入同一個 payload，不另開路由）。讀取端：已發布課程資料本來就會回傳給前端，`lineInviteUrl` 隨同回傳，不用額外查詢。

顯示條件：使用者對「該課程」有購買權限（沿用既有 `Order.courseAccess` 判斷，目前正式站只有一門已發布課程，等同於現有的全站購買判斷），且該課程的 `lineInviteUrl` 為非空、`https://` 開頭的字串，才顯示連結；其餘情況（欄位空、非 https、未購買）一律不顯示。

**Alternatives considered**：
1. 沿用環境變數 `LINE_COMMUNITY_INVITE_URL`（原文件建議）→ 否決，Fish 明確要求每門課各自一個連結，環境變數只能是全站一份，無法滿足
2. 另開一支 `PATCH /api/course/:id/line-invite` 專用端點 → 否決，`studio/route.ts` 的課程更新動作已經是「一次送多個欄位」的通用寫法，`lineInviteUrl` 只是多一個欄位，沒有理由為單一欄位另開端點
3. 存在獨立資料表（如 `CourseLineInvite`）而非 `Course` 直接加欄位 → 否決，這是課程的一對一屬性，不需要獨立資料表；`Course` 已有 `coverImageUrl` 這種同類型的可選字串欄位先例

## Implementation Contract

**行為**：
- 買家開啟 `/course`，看到的單元清單標題、順序與 `/course/lesson-01` 教室、`/zh-tw/course` 官網課綱三處一致
- 課程管理員在 `/admin/course` 工作室按下「預覽學員教室」，進入 `/course/preview`，看到跟真實學員一致的課綱內容，畫面不含任何選單，右上角固定「返回課程管理員」按鈕，按下回到 `/admin/course`；真實學員使用的 `/course` 不因此改動而新增任何選單項目或按鈕
- 已購買且 `kitClaimEligible` 為 true 的使用者，在結帳頁「你已擁有開站包」文案旁、以及課程頁，都能看到「領取代碼包」按鈕，按下後觸發既有 `POST /api/github/claim` 流程；未達資格者不顯示可按按鈕
- 課程管理員在課程工作室（Course Studio）的課程設定裡能貼上並存檔該課程的 LINE 學習群連結
- 已購買該課程的學員在該課程頁看到可點擊的「加入 LINE 學習群」連結，連往該課程 `lineInviteUrl` 的值；該值未設定或非 `https://` 開頭時，頁面不出現這個區塊；未購買該課程的使用者不出現這個區塊

**Interface / data shape**：
- 課程首頁單元資料改用 `packages/course` 既有的已發布課程 reader（與教室、官網共用的同一組匯出函式），不再匯入 `listLessons`
- 新增 `/course/preview` route（`apps/saas/app/(authenticated)/(main)/(account)/course/preview/page.tsx`），內容呼叫跟 `/course` 相同的已發布課程 reader，layout 不掛用戶選單，固定一顆返回按鈕連往 `/admin/course`
- `/admin/course` 工作室新增一顆「預覽學員教室」按鈕，`href` 直接指向 `/course/preview`，不需要額外型別或 API
- 領代碼按鈕呼叫既有 `POST /api/github/claim`、`GET /api/github/claim-status`，不變更這兩個端點的 request/response 形狀
- `packages/database/prisma/schema.prisma` 的 `Course` model 新增 `lineInviteUrl String?`（可為 null，不設 `@db.Text`，一般 URL 長度足夠用預設 String 型別），需要一支 Prisma migration
- `apps/saas/app/api/course/studio/route.ts` 現有課程更新的 payload 型別新增 `lineInviteUrl?: string` 欄位，寫入邏輯併入既有 `data: { title, description, status: courseStatus }` 的同一個 `db.course.update` 呼叫

**Failure modes**：
- 已發布課程樹為空（尚未發布任何章節）時，課程首頁顯示空狀態文案，不拋錯、不顯示假資料
- `lineInviteUrl` 缺失或非 https：靜默不顯示該區塊，不噴錯誤訊息給使用者
- 存檔時輸入非 https 網址：課程工作室存檔動作回傳驗證錯誤，不寫入資料庫，不靜默存入非法值
- claim 呼叫失敗（如已經 claim 過、額度用盡）：沿用 `POST /api/github/claim` 既有錯誤回應顯示對應文案，不新增錯誤型別

**Acceptance criteria**：
- 元件測試：課程首頁單元清單斷言來源函式呼叫與教室頁相同、不呼叫 `listLessons`
- 元件測試：`/course/preview` route 斷言不渲染任何選單元件、渲染單一返回按鈕連往 `/admin/course`；`/course` route 斷言選單維持既有五項，不因這次改動新增項目
- 元件測試：`/admin/course` 工作室斷言渲染「預覽學員教室」按鈕，`href` 為 `/course/preview`
- 元件測試：claim 按鈕在資格 true/false 兩種 fixture 下的渲染狀態
- 元件測試：LINE 連結在欄位存在且 https／欄位缺失／欄位非 https 三種情境的渲染結果，各自搭配「已購買該課程」與「未購買」兩種使用者狀態
- 後端測試：課程工作室更新動作存入非 https 字串時回傳驗證錯誤且不寫入
- 部署後以 ego-browser 用已購買測試帳號與純學員測試帳號各走一次，對照本文件行為逐項截圖

**Scope boundaries**：
- 範圍內：`/course` 課程首頁資料來源、`/course/preview` 預覽路由與工作室的「預覽學員教室」入口、結帳頁與課程頁的領代碼按鈕、`Course.lineInviteUrl` 欄位與課程工作室存檔、課程頁的 LINE 連結顯示
- 範圍外：優惠券管理、組合包/優惠券報表下載、站內通知、GitHub 私倉是否真的生成的驗證、LINE 邀請連結點擊後是否入群、正式站回滾演練、真實付款流程、電子報自動寄信、多課程間跨課程權限邏輯

## Risks / Trade-offs

[Risk] 課程首頁改讀已發布課程樹後，若目前資料庫沒有已發布的章節/單元，會從「三個示範項目」變成空清單，畫面觀感變差 → Mitigation：確認正式站「電馭學院」課程樹已發布（2026-09-24 實測教室可正常開課，代表已發布資料存在），任務完成後以相同帳號重新核對課程首頁不再是空清單

[Risk] `/course/preview` 若沒有做權限檢查，任何登入使用者（不只課程管理員）都能直接打網址進去，變相繞過權限邊界 → Mitigation：`/course/preview` route 沿用既有的 `app-admin` route guard，非課程管理員直接開這個網址要被導回或拒絕，不能只靠「工作室裡才看得到按鈕」這種隱藏連結當作權限控制

[Risk] 領代碼按鈕接上既有 API 後，若同時有多個使用者重複點擊，可能觸發重複 claim 請求 → Mitigation：沿用既有 `POST /api/github/claim` 本身的冪等/資格判斷，UI 層在請求進行中停用按鈕，不新增後端防重放邏輯（不在本次範圍內）

[Risk] `Course.lineInviteUrl` 新增 migration 需要在正式站資料庫執行 → Mitigation：欄位是可為 null 的新增欄位，不動既有欄位、不改既有資料，標準 additive migration，風險等同既有 `coverImageUrl` 這類欄位新增

## Migration Plan

1. Prisma schema 新增 `Course.lineInviteUrl String?`，產生 migration，先在本機與 TEST 環境跑過、確認既有課程資料不受影響（既有 row 該欄位為 null）
2. 課程首頁資料來源切換：先在測試環境確認已發布課程樹能正確渲染，跑通既有課程相關測試套件作為前後基準
3. 選單新增入口：純前端渲染邏輯變更，不涉及資料庫，隨後續部署生效
4. 領代碼按鈕、LINE 連結顯示：純前端渲染邏輯變更，領代碼不新增端點；LINE 連結存檔併入既有課程更新路徑，跟隨 migration 一起部署

**回滾策略**：課程首頁、選單入口、領代碼按鈕三項是純前端渲染邏輯，出問題時以 `git revert` 對應 commit 並重新部署即可。`lineInviteUrl` 欄位是 additive migration，新增欄位不影響既有查詢；若需回滾程式碼，欄位保留在資料庫不需要額外的 down migration，之後仍可安全重新啟用。
