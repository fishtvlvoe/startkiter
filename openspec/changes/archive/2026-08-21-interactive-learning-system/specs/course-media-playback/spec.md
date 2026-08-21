## MODIFIED Requirements

### Requirement: Entitled lessons play configured Bunny media

當有課程權限的學員開啟已發布單元時，系統必須繼續支援已配置的 Bunny Stream 媒體，並將它放入電馭學院的 Fluent Player Shell。Shell 必須在所有核准 provider 上提供一致的深色外觀、16:9 響應式容器、播放控制與可存取 keyboard focus；不得因 provider 不同退回未包裝的裸播放器。

#### Scenario: 有權學員以 Fluent Player Shell 播放 Bunny 單元

- **WHEN** 已購買學員開啟已發布且 provider 為 Bunny 的 lesson-01
- **THEN** 頁面必須以 Fluent Player Shell 與 Bunny adapter 播放該單元，且仍不得向無權使用者輸出該媒體 URL

##### Example: 既有 Bunny 設定向後相容

- lesson-01 有合法 Bunny library／video identifier
- 有 courseAccess 的 user A 看到可播放的統一 Shell
- 未付款 user B 查詢同一 lesson 時回應不含 Bunny embed URL

## ADDED Requirements

### Requirement: Studio 僅接受核准影音來源與安全 URL

Course Studio 必須只接受 Bunny.net、YouTube、Vimeo、HTTPS MP4 與 HTTPS HLS 作為 lesson media source。URL resolver 必須驗證 HTTPS、provider host 或 direct 檔案格式、可抽取的 source identifier 與支援狀態。未知 URL、HTTP URL、Cloudflare Stream、缺少必要 identifier 或不支援格式必須以可修正錯誤拒絕，不能自動當成 MP4 儲存。

#### Scenario: operator 貼上合法 Vimeo URL

- **WHEN** operator 在 Studio 貼上合法 Vimeo URL
- **THEN** resolver 必須回傳 provider 為 vimeo、可用 source identifier 與可解析 metadata 狀態，讓該 lesson 能進一步驗證

##### Example: Vimeo URL 產生可發布前的資訊卡

- operator 輸入一個合法的 HTTPS Vimeo URL
- resolver 擷取 provider=vimeo 與影片 identifier
- Studio 顯示 duration 取得狀態，完成 metadata 驗證後才可按發布

#### Scenario: operator 貼上不支援 URL

- **WHEN** operator 貼上 HTTP、Cloudflare Stream 或未知 host 的 URL
- **THEN** Studio 必須顯示可修正錯誤、拒絕儲存該來源，且 lesson 不得發布

##### Example: 未知 URL 不被靜默降級

- 輸入 https://example.invalid/clip
- resolver 回傳 unsupported_source
- 資料庫不寫入 mediaUrl，也不將 provider 標為 direct MP4

### Requirement: Studio 顯示可驗證的影音資訊卡

當 URL resolver 接受來源時，Studio 必須顯示資訊卡，至少包含 provider、source identifier、duration 與 Fluent Player Shell 相容狀態。duration 必須由 provider adapter 取得或由可驗證 metadata 補齊；未取得 duration 時必須顯示明確狀態並阻止發布，而非假造時長。

#### Scenario: 合法來源顯示完整資訊卡

- **WHEN** resolver 成功解析有 metadata 的 Bunny、YouTube、Vimeo、MP4 或 HLS URL
- **THEN** Studio 必須在同一張資訊卡顯示 provider、duration 與可由 Fluent Player Shell 播放的狀態

##### Example: duration 缺失阻止發布

- operator 儲存一個可辨識但尚無法取得 duration 的 YouTube URL
- Studio 顯示尚未取得時長而不是預設數字
- operator 嘗試發布時收到阻擋原因，直到 adapter 取得或驗證補齊 metadata

### Requirement: 試看與完整播放遵守相同媒體權限邊界

公開試看與完整學員播放必須使用同一套 media resolver 與 Fluent Player Shell，但授權輸出不同：匿名只可取得已發布且 isFreePreview=true 的媒體；非試看完整媒體只可給目前 session 具 Order.courseAccess=true 的使用者。draft 或無權媒體 URL 不能由資訊卡、API、page props 或 client state 外洩。

#### Scenario: 匿名試看不會解鎖相鄰單元

- **WHEN** 匿名訪客成功播放 lesson-01 試看後請求 lesson-02
- **THEN** lesson-02 若不是試看，系統必須拒絕並不輸出其 provider URL、source identifier 或 duration

##### Example: 付費學員使用同一 Shell 看完整課程

- user A 有 courseAccess=true 且開啟非試看的 lesson-02
- Shell 使用 lesson 的已驗證 adapter 播放
- user A 不會因已付款而看到 draft lesson 或其他使用者資料

## REMOVED Requirements

### Requirement: Missing Bunny config falls back safely

**Reason**: 移除舊版靜態 Bunny 缺失時自動 fallback 到暫時 demo 影片的行為。新版 Fluent Player 全面採用 fail-closed 嚴格驗證機制：無合法媒體來源或未知 URL 必須在 Studio 端阻擋儲存與發布；學員端若無已發布之媒體來源則不渲染播放器並顯示白話提示，不再假造暫時 demo 影片。

**Migration**: 課程媒體設定改由 Studio 端 URL resolver 驗證與持久化儲存，無媒體來源之單元以空白/未上架狀態呈現。

#### Scenario: 舊版 Bunny 缺失 fallback 行為被廢止

- **WHEN** 單元未配置合法媒體來源
- **THEN** 系統不得自動播放任何 demo 影片，並直接回傳無媒體狀態

##### Example: 缺失來源時回傳空白而不假造影片

- 單元 mediaUrl 為 null 且未設定任何 provider
- 學員端播放器回傳無媒體狀態並提示未上架
- 系統不載入任何預設 demo 影片


