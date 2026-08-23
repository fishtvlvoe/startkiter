<!--
These tasks are intentionally unchecked: this change is left in propose state
per request. Each task states the observable contract and its verification
target for the later apply/review pass.
-->

## 1. Code-first inventory

- [ ] 1.1 確認 `WELCOME`、`APP_UPDATE`、`IN_APP`、`EMAIL` 在 Prisma、Drizzle、generated Zod、notifications package constants 與 API validation 間保持一致；驗證目標是 enum／schema grep 與 focused type-check 結果一致。
- [ ] 1.2 確認所有觸發點與 consumer：Better Auth user-create after hook 是唯一現有自動 trigger，`APP_UPDATE` 沒有 repository 內建 publisher，API router 與兩個 UI consumer 的呼叫路徑完整；驗證目標是對 `createNotification`、`createWelcomeNotification`、`notificationsRouter` 的 caller grep。
- [ ] 1.3 對照 requirement **Notification types and delivery targets are fixed by the database contract**；同時驗證設計決策「以資料庫 enum 為型別 SSOT，package constants 為 mirror」沒有產生第二套型別來源。

## 2. Notification lifecycle contract

- [ ] 2.1 保留 `createNotification` 的雙通道獨立停用、預設值、in-app row、email title/message/link context 與缺 email fallback；驗證目標是 focused tests 覆蓋 enabled／disabled channel、title precedence 與 missing email。
- [ ] 2.2 保留 welcome hook 的固定 payload、root link 與 error isolation，並保留 `APP_UPDATE` 僅為 generic supported type；驗證目標是 auth hook test 與無 APP_UPDATE caller 的 code review。
- [ ] 2.3 保留 link normalization、user-scoped ordering/count/read mutation 與 `(userId, type, target)` preference uniqueness；驗證目標是 resolver、database query／schema parity tests。
- [ ] 2.4 對照 requirement **Notification creation independently fans out to in-app and email channels** 與設計決策「建立通知採雙通道獨立分流」；驗證目標是 channel preference isolation、in-app return value 與 email context focused tests。
- [ ] 2.5 對照 requirement **Welcome notifications have one authenticated user-creation trigger** 與設計決策「觸發點只記錄 code-first 證據」；驗證目標是 auth hook test、logger assertion 與 APP_UPDATE 無 caller 的 code review。
- [ ] 2.6 對照 requirement **Notification links are normalized for storage and API output** 與設計決策「連結在建立與 API list response 都做 normalization」；驗證目標是 null、relative、absolute、parse-failure link tests。
- [ ] 2.7 對照 requirement **Notification persistence is user-scoped and supports ordered reads**；驗證目標是兩個資料庫 provider 的 user scope、ordering、count、read mutation 與 preference uniqueness parity tests。

## 3. Authenticated API contract

- [ ] 3.1 保留六個 protected procedures 的 route、input/output、預設 take、mutation count 與 current-user scope；驗證目標是 API tests 對六個 route、invalid input 與 unauthenticated request。
- [ ] 3.2 保留 settings catalog 目前只展示 `APP_UPDATE`、notification center 讀取／自動 mark-read／mark-all-read 的現有消費行為；驗證目標是 component tests 或等價的 UI behavior checks。
- [ ] 3.3 對照 requirement **Authenticated notification API exposes list, read, count, and preferences** 與設計決策「API 永遠由 protected procedure 取得 current user」；驗證目標是六個 route 的 schema、current-user scope 與 unauthenticated rejection tests。

## 4. Spec backfill review gate

- [ ] 4.1 將上述行為寫入 `notifications` capability spec，並讓 proposal、design、spec、tasks 的 scope、trace 與 non-goals 一致；同時核對 design 的 **Interface / data shape** 與 **Scope boundaries**；驗證目標是 `spectra analyze notifications-spec-backfill` 無 Critical／Warning。
- [ ] 4.2 核對 design 的 **Failure modes** 與 **Acceptance criteria**，並確認本 change 不進入 apply、archive 或 runtime code modification；驗證目標是 `spectra validate notifications-spec-backfill` 0 warnings。
