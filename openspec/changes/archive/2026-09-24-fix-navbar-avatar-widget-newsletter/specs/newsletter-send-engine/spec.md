## Purpose

電子報自動寄送引擎已經寫完（分支 `fishtvlvoe/newsletter-automation-integration`），但從未合併進 `main`，雲端正式站看不到。這份把它安全合併進來，遇到跟 main 既有邏輯衝突時要仔細核對，不能亂猜。

## ADDED Requirements

### Requirement: 自動寄送引擎可正式運作

合併後，`main` 要有完整可運作的電子報自動寄送能力（Wave 1B send engine + dispatch cron），且不破壞 main 現有的退訂/同意權限邏輯。

#### Scenario: 排程觸發自動寄送

- **GIVEN** 有一批已排程的電子報待寄送
- **WHEN** cron 觸發 dispatch
- **THEN** 系統依既有的使用者同意紀錄（consent）判斷可寄送對象，成功寄出並記錄寄送結果

### Requirement: 合併衝突時保留行為正確的一方

合併過程中，`packages/database/prisma/schema.prisma`、`packages/mail/provider/*` 這類技術實作衝突，採用 main 版本；但 `packages/newsletter/`、`unsubscribe`、`email-consent`、`SignupForm.tsx`、`checkout` 這類涉及使用者同意/退訂行為的衝突，必須先核對兩邊實際行為語意是否一致，才能決定，不可用「哪邊比較新」這種方式盲目二選一。

#### Scenario: 兩套退訂邏輯行為不一致時停下回報

- **GIVEN** newsletter 分支與 main 各自有一套退訂 token 驗證邏輯，行為細節（如 token 有效期）不一致
- **WHEN** 合併過程發現此不一致
- **THEN** 停止自動合併該部分，記錄兩邊差異，回報給人工決定，不自行選擇其中一套
