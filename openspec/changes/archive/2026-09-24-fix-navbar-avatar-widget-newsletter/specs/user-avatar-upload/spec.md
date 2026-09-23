## Purpose

現在頭像上傳失敗時，使用者什麼都看不到，只是卡住轉圈後恢復原狀。這份要讓失敗有原因可查，並修掉最可能的根因（S3 環境變數缺漏）。

## ADDED Requirements

### Requirement: 上傳失敗要顯示原因

`UserAvatarUpload.tsx` 的 `onCrop` 失敗時，不能只是靜默呼叫 `onError()`，要能讓使用者或工程排查看到失敗原因。

#### Scenario: 取得簽名上傳網址失敗

- **GIVEN** 後端 S3 設定缺漏，`avatarUploadUrl` 呼叫失敗
- **WHEN** 使��者裁切完頭像送出
- **THEN** 畫面顯示具體錯誤提示（例如「上傳失敗，請稍後再試或聯絡客服」），且錯誤內容有被記錄（console 或 log），不是完全靜默

### Requirement: 上傳流程在環境齊全時要能成功

#### Scenario: 環境變數齊全時上傳成功

- **GIVEN** S3 環境變數（`S3_ENDPOINT`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`）已正確設定
- **WHEN** 使用者選圖、裁切、送出
- **THEN** 頭像成功更新，`reloadSession()` 後畫面顯示新頭像
