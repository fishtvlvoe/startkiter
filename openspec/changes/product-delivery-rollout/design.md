## Context

StartKiter 底層 5 個 Core 模組（認證/課程引擎/後台外殼/通知系統，加上正在收尾的金流+發票）已完成或接近完成，但「把它變成可以賣給客戶的產品」這件事（官網能打開、行銷內容真實、買家有文件可查、買家最終拿到乾淨代碼包、訂閱生命週期通知齊全）完全是另一條尚未啟動的軌道，且分散在 4 張 parked change + 1 張未啟動的 in-progress change。Fish 要求：先有一張總表把全貌列清楚，再依序拆給 Codex 做，PM 負責驗收，且這個排序關係要進 Spectra 系統，不能只是一份 docs/discuss/ 筆記。

## Goals / Non-Goals

**Goals:**
- 提供 Spectra 系統內可查詢、可追蹤的排序清單，取代非正式筆記
- 每個排序步驟都對應到既有子 change 的 apply + 獨立 CR 驗收動作，本 change 的 task 完成定義＝子 change 完成定義
- 保留 Fish 手動決策點（archive 與否、UI/UX 調整方向）不被自動化跳過

**Non-Goals:**
- 不重新設計任何子 change 的技術方案，本 change 對子 change 的 design/specs 內容沒有修改權
- 不処理 `multi-gateway-checkout` 卡 Stripe 憑證的部分（獨立卡點，不在排序控制範圍）
- 不引入新的使用者可見行為或 API，純屬專案管理／執行順序控制，因此本 change 沒有新增或修改任何 capability，不產生 specs/ 目錄

## Decisions

### Decision: 用一張獨立的 Spectra change 做排序控制，而不是只寫 docs/discuss/ 筆記

一開始（2026-08-27）先寫了 `docs/discuss/2026-08-27-product-delivery-master-roadmap.md` 作為給 Fish 看的地圖，但 Fish 明確要求「這個排序關係要進 Spectra 系統」，理由：docs/discuss/ 筆記沒有 spectra list 可查、沒有 apply/archive 生命週期、容易在下一個 session 被忽略。改用 Spectra change 追蹤，docs/discuss/ 文件保留作為給 Fish 看的白話版本，兩者不衝突：本 change 的 tasks.md 是「機器可查的正式追蹤」，docs/discuss/ 文件是「人類可讀的地圖」。

Alternatives Considered:
- 只更新 docs/discuss/ 文件，不建 Spectra change → 否決：不符合 Fish 明確指示，且下一個 session 進來時 `spectra list` 看不到這個排序關係，容易被忽略
- 把 5 張子 change 直接合併成一張大 change → 否決：子 change 已經各自完成 propose 且部分已 apply（subscriptions-invoice），合併會破壞既有的 apply 進度與獨立驗收邊界，且違反「每張改動範圍要小到可獨立驗證」的 Spectra 精神

### Decision: 不建立新 capability／specs，本 change 純粹是 tasks 排序

本 change 的每個 task 都是「呼叫既有子 change 的 apply 流程 + 讀取其 CR 結果」，不是新寫程式行為，所以沒有可以用 SHALL/MUST 描述的新系統行為需要放進 specs/。若日後這類「排序控制」change 變成常見模式，可以另外考慮是否要在 openspec/config.yaml 定義一個不需要 specs 的 schema 變體，但這超出本次範圍。

Alternatives Considered:
- 硬寫一個「delivery-tracking」capability 湊 specs 需求 → 否決：會製造一個沒有實際系統行為對應的假 capability，違反 specs 應描述可驗證系統行為的原則

## Implementation Contract

本 change 不修改任何程式碼或系統行為，Implementation Contract 為「執行動作」而非「函式簽名」：

- 每個 task 的完成條件＝對應子 change 在 `spectra status --change <name> --json` 顯示 `isComplete: true` 且該子 change 最近一次獨立 CR（非同 session 自審）結論為 PASS（0 Critical）
- PM（Claude）負責讀取子 change 的 CR 報告全文與 e2e 證據，不接受僅憑子 change 自報「完成」就勾選本 change 對應 task
- 子 change 的 archive 動作永遠由 Fish 決定，本 change 的 task 完成不等於觸發子 change 的 archive
