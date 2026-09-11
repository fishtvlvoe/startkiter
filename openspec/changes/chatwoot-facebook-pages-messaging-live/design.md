## Context

Chatwoot 已在 Oracle `chatwoot-oracle-01` 運行，`https://support.startkiter.dev/` 可用。Meta App `opcos`（id `2578433362383415`）已設定 `FB_*`，粉專「Fishtv余啟彰」已建 Chatwoot Facebook inbox，App 層 webhook callback 為 `https://support.startkiter.dev/bot`，管理員測試私訊雙向成功。App 仍為開發模式，路人與第三方自綁粉專受 Meta 門禁限制。

## Goals / Non-Goals

### Goals

- 讓 opcos App 具備送審／上線 Messenger（`pages_messaging`）的前置條件與可驗證狀態
- 文件清楚區分：自家粉專路人進線 vs 客戶自綁其他粉專
- 維持現有 Fishtv 頻道可用，不中斷已驗證的測試對話

### Non-Goals

- 不啟用 StartKiter 產品站 widget
- 不保證 Meta 審核時程
- 不做其他社群通道審核

## Decisions

### Decision: 沿用既有 Meta App opcos，不新建 App

Rationale: 帳號已達未驗證商業「最多 15 個 App」上限；opcos 已有粉專 token、webhook、Chatwoot 綁定。

Alternatives Considered:
- 新建「StartKiter Support」App → Meta 阻擋建立
- 每個客戶自備 Meta App → 運維成本過高，不符合統一客服台

### Decision: App Review 材料以公開 HTTPS 法律頁為準，優先複用 opcos.me legal 內容

Rationale: Meta 要求 Privacy Policy／Terms URL；opcos.me marketing 已有 legal 內容，缺的是穩定公開路由。

Alternatives Considered:
- 把法律頁掛在 support.startkiter.dev → 混淆客服產品與 Meta App 擁有者品牌
- 只放 GitHub raw markdown → 審核常拒非產品網域

### Decision: 「正式可用」分兩階驗收：本側就緒 + Meta Live

Rationale: Meta 人工審核是外部時鐘；SR 不可因等待審核而永遠卡在 apply。

Alternatives Considered:
- 以 Meta 核准當唯一完成條件 → 無法自動收斂、老闆必須盯審核信箱
- 只寫文件不送審 → 路人進線問題未解

### Decision: 多客戶粉專採 Chatwoot 每頁一 inbox，共用同一 Meta App

Rationale: Chatwoot Facebook channel 本就是 Page OAuth；Live 後客戶用自己的粉專授權即可。

Alternatives Considered:
- 每客戶獨立 Chatwoot 實例 → 成本與維運爆炸
- 共用單一粉專轉發 → 無法滿足「綁定不是我們的粉絲頁」

## Implementation Contract

### Observable behavior

- Graph `GET /{app-id}/subscriptions` 回傳 `object=page`、`callback_url=https://support.startkiter.dev/bot`、`active=true`，且含 `messages` 欄位
- Chatwoot `Channel::FacebookPage` 對 Fishtv 粉專仍有效；管理員測試私訊可建立／回覆對話
- `docs/chatwoot-facebook-messaging.md` 與 `docs/support-runtime-topology.md` 記載：App id、開發／Live 差異、多客戶綁定邊界、驗收指令
- 公開 Privacy／Terms URL 以瀏覽器或 curl 回 200 且為 HTML 頁
- 當 Meta App 仍為開發模式：文件 MUST 標明僅 App 角色使用者進線；當切 Live 且權限核准後：文件 MUST 標明路人私訊預期進線，並留下至少一次非角色帳號驗收紀錄（或明確記錄「待非角色帳號驗收」與阻擋原因）

### Scope in

- Meta Developer Console／Graph 設定、法律頁公開、Chatwoot 文件與 runbook、Fishtv 頻道健康檢查、送審材料準備與送出（若材料齊）

### Scope out

- Meta 審核員決策時程、產品 widget 啟用、其他 messaging 產品

### Failure modes

- 法律頁 404／非 HTTPS → 不得宣稱可送審
- webhook 訂閱變空 → 先修復再送審
- Live 後路人仍不進線 → 查 App Review 權限狀態、粉專 subscribed_apps、Chatwoot rails `/bot` POST log，不得只改文件結案

## Risks / Trade-offs

- [Risk] Meta 要求商業驗證或補充證件 → Mitigation: tasks 將驗證狀態列為閘門；缺證件時標記 blocked 並寫進 Open Questions，不假裝完成
- [Risk] Live 切換後既有 Dev 測試行為改變 → Mitigation: 先保留 Fishtv 頻道；切 Live 前後各跑一次雙向私訊
- [Risk] data_access_expires_at 異常舊值 → Mitigation: 送審前用 Graph debug_token 檢查；必要時重新 OAuth 換發 page／user token 寫回 Channel::FacebookPage
- [Risk] 跨 repo（opcos.me）變更與 startkiter SR 不同步 → Mitigation: runbook 以「公開 URL 可達」為驗收，不綁單一 repo 路徑為唯一完成條件

## Migration Plan

1. 確認 webhook／粉專訂閱／Chatwoot FB 設定健康
2. 公開法律頁 URL 並填入 Meta App 設定
3. 準備並送出 `pages_messaging`（及 Meta 要求的相關權限）審核材料
4. 核准後切 Live；用非 App 角色帳號對 Fishtv 粉專測進線
5. 更新 topology／messaging runbook

Rollback: App 切回開發模式；webhook／Chatwoot 設定不回滾除非驗收失敗且需隔離；文件標回開發門禁。

## Open Questions

- Meta Business「費雪資訊坊」是否已通過商業驗證？若否，Fish 是否能提供驗證所需證件（本 agent 無法代開政府證件）
- 非角色測試帳號要用哪一個個人 FB（避免再用管理員帳號誤判 Live 成功）
