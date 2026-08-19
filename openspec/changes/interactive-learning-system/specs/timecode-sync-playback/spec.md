## ADDED Requirements

### Requirement: 時間碼使用正規化秒數

時間碼輸入可以是 MM:SS 或非負整數秒，但在資料與 runtime 中必須正規化為非負整數秒。start 不能大於 end；時間碼不得為負數、不可解析、超出已知 duration 或落在不存在的 lesson block。

#### Scenario: 合法時間碼被正規化

- **WHEN** MDX block 指定 01:30
- **THEN** parser 必須把它正規化為 90 秒，供 player adapter 與 block engine 共用

#### Scenario: 非法時間碼阻止發布

- **WHEN** operator 儲存 start 大於 end、負數或超出已知 duration 的時間碼
- **THEN** Studio 必須顯示驗證錯誤，且 lesson 不得發布

##### Example: 相同輸入得到相同秒數

- 01:30 與數字 90 都輸入至同一個 TimelineSync block
- 兩種輸入都正規化為 90
- active block 與 seek 行為完全一致

### Requirement: 播放器與課程內容可雙向時間碼同步

Fluent Player Shell 的 provider adapter 必須發出目前播放秒數，讓 TimelineSync 在有效區間高亮；使用者點擊合法時間碼時，adapter 必須 seek 至正規化秒數。auto-scroll 不得搶走 keyboard focus，並須尊重 reduced-motion 偏好。這項契約必須以真實 player current-time event 驗證，不得只測試獨立 hook。

#### Scenario: 播放進度啟用對應積木

- **WHEN** player adapter 送出 90 秒 current-time event，且某 TimelineSync block 範圍涵蓋 90 秒
- **THEN** 對應 block 必須成為 active，並依使用者 motion 偏好決定是否平滑捲動

#### Scenario: 點擊時間碼讓播放器 seek

- **WHEN** 學員點擊正規化為 90 秒的時間碼 control
- **THEN** provider adapter 必須收到 seek 90 秒指令，且目前播放／block active state 同步更新

##### Example: reduced-motion 不失去學習同步

- 使用者啟用 reduced motion
- player 進入對應時間碼範圍時 block 仍被標示為 active
- UI 不自動平滑捲動，也不奪走目前 keyboard focus
