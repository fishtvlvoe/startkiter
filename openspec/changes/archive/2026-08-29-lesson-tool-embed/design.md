## Context

講師目前只能在單元內容裡放影片跟文字（MDX），沒有辦法安全地嵌入外部互動工具（線上白板、練習網站、模擬器）。參考 WooMin（`woomini-flow/woomin`，另一個課程平台）已經驗證過的做法：Lesson 直接加兩個欄位存工具網址與標題，存取時現場簽發短效通行證，並用 sandboxed iframe 顯示，連分享出去的連結都要重新驗證身分。

StartKiter 現有可直接沿用的基礎設施：
- `packages/api/modules/course/procedures/lesson-message-upload.ts` 已有 HMAC-SHA256 簽章模式（`createHmac` + `BETTER_AUTH_SECRET` + 版本前綴字串 + `timingSafeEqual` 比對），本次沿用同一套模式，不重新發明
- `packages/api/modules/course/lib/course-instructor-access.ts` 已有 `hasAnyCourseInstructorAssignment`／`canManageCourse` 講師範圍判斷，本次設定 API 直接呼叫既有函式
- 課程播放頁 `apps/saas/app/(authenticated)/(main)/(account)/course/[lessonId]/classroom-client.tsx` 已有影片區塊（用 `resolveVideoSource`）與 `LessonMdx` 內容渲染區塊並列的版面，本次工具嵌入區塊比照相同並列方式加入

## Goals / Non-Goals

**Goals:**

- 講師能為自己有權限管理的課程單元設定一個外部工具網址與標題
- 學員看課時，若該單元設定了工具，畫面上會出現 sandboxed iframe 顯示這個工具
- 通行證效期 2 小時，綁定 `lessonId` + `userId`，過期或身分不符要重新驗證
- 分享出去的完整連結（含通行證）在效期內任何人打開都要重新走一次課程存取檢查（購課／講師身分），不能因為連結本身就永久放行
- 工具網址在伺服器端組裝代理路徑前，要先擋掉指向內網／localhost／私有 IP 範圍的網址

**Non-Goals:**

- 不做工具網址的內容審核機制（不掃描網址內容是否為釣魚頁面），僅在後台 UI 加上「請確認來源可信」的提示文字，人工判斷由講師自行負責
- 不做多個工具同時嵌入同一單元，v1 一個單元最多一個工具網址
- 不修改既有 `aiPrompt`／`aiContext` 欄位或其用途（那是課堂 AI 助教功能，跟本次工具嵌入無關，不共用命名與邏輯）
- 不做工具網址使用量統計／分析後台
- 不處理需要 cookie-based 登入狀態才能用的第三方工具（sandboxed iframe 是 opaque origin，第三方 cookie 本來就會被瀏覽器擋掉，這是已知限制不在本次解決範圍）

## Decisions

### Decision: 沿用既有 HMAC 簽章模式，不引入新的簽章函式庫

比照 `lesson-message-upload.ts` 的 `sign()`/`localSecret()` 模式：`createHmac("sha256", process.env.BETTER_AUTH_SECRET).update(payload).digest("base64url")`，加上版本前綴字串（例如 `lesson-tool-embed-v1`）與 `timingSafeEqual` 驗證。

Alternatives Considered:
- 引入 `jsonwebtoken` 套件簽發標準 JWT → 否決：專案已有一套自己的輕量 HMAC 慣例在用，多引入一個簽章函式庫只為了這個功能不划算，且既有模式已通過既有測試與正式環境驗證
- 用 Better Auth 既有的 session token 直接當通行證 → 否決：session token 效期跟用途跟這裡需要的「短效、單一用途、可安全放進網址」的通行證性質不同，混用會擴大 session token 外洩的影響範圍

### Decision: `toolUrl`／`toolTitle` 直接加在 Lesson model 上，不建獨立表

比照 WooMin 的做法：一個單元最多一個工具，欄位量小，不需要獨立表格與對應的 CRUD API。

Alternatives Considered:
- 建立獨立 `LessonTool` 表格，支援未來多工具 → 否決：Non-Goals 已明確排除多工具需求，多一張表格只增加本次複雜度沒有實際效益
- 把工具設定塞進既有 `content`（MDX）欄位裡用自訂語法標記 → 否決：MDX 內容跟工具設定是不同關注點，混在一起會讓後台編輯介面跟解析邏輯都變複雜

### Decision: SSRF 防護在伺服器端組裝代理路徑時做網址檢查，不在瀏覽器端做

`packages/platform/src/lesson-tool/url-safety.ts` 在儲存 `toolUrl`（講師設定時）與每次簽發通行證組裝代理路徑時都執行檢查：解析網址 hostname，比對是否為 `localhost`／`127.0.0.1`／`0.0.0.0`／RFC1918 私有網段（`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`）／`169.254.0.0/16`（cloud metadata 常見範圍），命中即拒絕。

Alternatives Considered:
- 只在儲存時檢查一次，之後不再驗證 → 否決：DNS rebinding 攻擊可以讓同一個網域在儲存當下解析到合法 IP、之後解析到內網 IP，只檢查一次無法防範，需要在每次實際使用時也檢查（本次至少在簽發通行證/組裝代理路徑時重新解析檢查一次）
- 用第三方 SSRF 防護套件 → 否決：規則單純（黑名單私有網段），不需要引入額外依賴

### Decision: 新分頁進入頁重新呼叫既有課程存取判斷，不快取存取結果

`/lesson-tool/[lessonId]/[encodedOrigin]` 每次載入都重新呼叫既有的課程存取判斷函式（購課狀態／講師範圍），不使用任何形式的存取結果快取。

Alternatives Considered:
- 通行證本身視為已驗證身分，頁面直接信任通行證有效就放行 → 否決：這樣一來通行證外洩（例如學員截圖分享網址、瀏覽器紀錄外流）就等於永久授權，即使原本的購課關係已經取消（退款）也繼續能用；重新驗證才能讓退款後立即失效

## Implementation Contract

**行為（Behavior）**：
- 講師在課程管理後台的單元編輯區塊，看到「內嵌工具（選填）」欄位（網址 + 標題），填寫後儲存，若网址命中內網黑名單，儲存被拒絕並顯示明確錯誤訊息
- 學員看課時，若該單元有設定 `toolUrl`，畫面上（影片區塊旁或下方，比照 WooMin 版面）出現一個 sandboxed iframe，載入這個工具，且能看到工具標題
- 學員點擊「在新分頁開啟」，開啟 `/lesson-tool/[lessonId]/[encodedOrigin]?token=...`，該頁面重新驗證這個學員目前是否仍有權限看這堂課，沒有權限就顯示 404（不透露「這堂課存在但你沒有權限」這種會洩漏課程存在性的訊息，比照現有 `notFound()` 慣例）
- 通行證超過 2 小時，任何用到它的請求都視為無效，需要重新整理頁面觸發重新簽發

**介面 / 資料形狀**：
```prisma
model Lesson {
  // ...既有欄位不變...
  toolUrl   String?
  toolTitle String?
}
```
- `packages/platform/src/lesson-tool/token.ts` 匯出：
  - `signLessonToolToken(lessonId: string, userId: string): string`
  - `verifyLessonToolToken(token: string, lessonId: string, userId: string): boolean`
- `packages/platform/src/lesson-tool/url-safety.ts` 匯出：
  - `isPrivateOrLocalUrl(url: string): boolean`
- API：`PATCH /api/lesson-tool/config`（body: `{ lessonId, toolUrl, toolTitle }`），只有 `canManageCourse` 通過的講師/操作員能呼叫，回傳 400 + `TOOL_URL_PRIVATE` 當網址命中黑名單

**失敗模式（Failure modes）**：
- 講師設定的網址命中內網黑名單 → 400，`TOOL_URL_PRIVATE`，不儲存
- 通行證驗證失敗（過期／被竄改／lessonId 或 userId 不符）→ 該次 iframe 載入失敗，顯示「工具目前無法使用，請重新整理頁面」，不顯示技術細節
- 新分頁頁面判斷該學員已無課程存取權限（例如已退款）→ 404，不揭露課程存在與否
- 非講師/操作員呼叫設定 API → 403

**驗收標準（Acceptance criteria）**：
- 單元測試：`isPrivateOrLocalUrl` 對 `localhost`、`127.0.0.1`、`10.1.2.3`、`192.168.1.1`、`169.254.169.254` 回傳 `true`；對一般公開網域回傳 `false`
- 單元測試：`signLessonToolToken`/`verifyLessonToolToken` 正常簽發驗證通過；竄改 payload、lessonId 不符、userId 不符、超過 2 小時皆驗證失敗
- 整合測試：非該課程講師呼叫設定 API 回傳 403，且 `Lesson.toolUrl` 未被寫入
- 整合測試：已退款/無購課紀錄的使用者開啟新分頁進入頁，回傳 404
- 端對端：設定工具網址、進入課程頁看到 iframe、開新分頁驗證重新檢查存取權限

**範圍邊界（Scope boundaries）**：
- 範圍內：Lesson 欄位新增、通行證簽發驗證、SSRF 黑名單、講師設定 API、學員端內嵌顯示、新分頁重新驗證
- 範圍外：工具網址內容審核、多工具支援、工具使用量統計、AI 講義生成（另外兩張獨立 change）

## Risks / Trade-offs

- [Risk] 分享出去的完整代理連結（含通行證）在 2 小時效期內，任何拿到這個連結的人都能用，不會二次確認身分（WooMin 原始碼自己也承認這個取捨）→ Mitigation: 通行證綁定 `userId`，且新分頁進入頁會重新查該 `userId` 是否仍有課程存取權限，退款後立即失效；效期壓在 2 小時降低外洩窗口
- [Risk] 講師填入的工具網址本身可能是釣魚頁面，系統無法自動判斷 → Mitigation: UI 明確標示「外部工具，請確認來源可信」，且僅限有課程管理權限的講師/操作員能設定，降低任意使用者亂填的風險
- [Risk] SSRF 黑名單用網域字串比對可能被 DNS rebinding 繞過（儲存時解析到合法 IP，實際載入時該網域已改指向內網 IP）→ Mitigation: 每次簽發通行證/組裝代理路徑都重新解析檢查一次，不只在儲存當下檢查
- [Risk] 每個買家部署都要有自己獨立的 `BETTER_AUTH_SECRET`，若買家沿用範本預設值未更換，通行證可能被跨買家偽造 → Mitigation: 這是既有 `lesson-message-upload.ts` 就共用的既存風險非本次新增，`localSecret()` 已在 production 環境強制檢查 `BETTER_AUTH_SECRET` 存在，本次沿用同一道防線不額外處理

## Open Questions

- iframe sandbox 屬性 `allow-scripts allow-forms allow-popups allow-downloads` 是否要根據工具類型再收緊（例如某些工具不需要 `allow-downloads`），留待實作時依實際串接的工具類型評估，不在設計階段鎖死
