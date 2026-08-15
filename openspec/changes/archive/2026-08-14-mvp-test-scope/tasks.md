## 1. 對齊治理文件

- [x] 1.1 讓 openspec/config.yaml 的產品定位改成課 + 終身代碼包、主金流 PAYUNi、結帳 8800 TWD，滿足 Decision: 結帳金額鎖 NT$8,800 不是區間、Decision: 主金流只接通一金流（PAYUNi）、Single MVP SKU price 與 PAYUNi is the only MVP gateway。驗證：`rg -n "8800|PAYUNi|終身" openspec/config.yaml` 命中，且 `rg -n "主金流 SHOPLINE|不是賣課平台|四堂課" openspec/config.yaml` 不再把這些當現行規則。 [Tool: sonnet]

- [x] 1.2 [P] 讓 README.md 寫出 MVP 是自己的站賣課、課程是模組、付款後站內領 GitHub、課程內有 LINE 社群加入連結，滿足 Course is a module on the sellable site、In-site GitHub claim after payment、Paid learners see a LINE community join control、Decision: 官網即產品實例，學員拿到的是另一個私人倉庫讀取權。驗證：`rg -n "領取代碼|課程模組|PAYUNi|8800|LINE" README.md` 命中。 [Tool: sonnet]

- [x] 1.3 [P] 讓 AGENTS.md 寫死 Allowed extract sources 與 Forbidden extract targets（含不准拷 libon.me、THE-TU 只抽觀看／金流、Decision: 課程 UI 當模組留下，從舊售出包抽觀看與權限，不抽整套學院營運）。驗證：`rg -n "libon.me|PAYUNi|packages/course|supastarter-nextjs-main" AGENTS.md` 命中，且寫明不准抽應用程式碼直到下一張 extract change。 [Tool: sonnet]

## 2. 對齊討論 SSOT

- [x] 2.1 讓 .docs/COMBINED.md 含 MVP 定價 8800、PAYUNi 先做、Course and kit are the same purchase、Refund revokes kit eligibility、客服走 email、LINE 只做學員交流。驗證：`rg -n "8,800|統一金流|終身代碼包|客服信箱|交流群" .docs/COMBINED.md` 命中。 [Tool: sonnet]

- [x] 2.2 讓 docs/discuss/ 既有 v1-boundary 開頭加上「已被 mvp-test-scope 取代」並指向新邊界，滿足 Four-lesson SHOPLINE path is not MVP。驗證：該檔前 20 行出現 mvp-test-scope，且 `rg "SHOPLINE 測一筆付款" docs/discuss/v1-boundary.md` 若仍存在必須標成過期。 [Tool: sonnet]

## 3. 規格契約可被後續 extract 執行

- [x] 3.1 確認 payuni-checkout spec 仍要求 POST /api/checkout 未設定回 503、POST /api/payuni/notify 冪等，滿足 Webhook marks a single order paid 與 Payments and invoice policy。驗證：`rg -n "POST /api/checkout|POST /api/payuni/notify|503" openspec/changes/mvp-test-scope/specs/payuni-checkout/spec.md openspec/changes/mvp-test-scope/specs/v1-scope-boundary/spec.md`。 [Tool: haiku]

- [x] 3.2 確認 github-kit-fulfillment spec 要求 POST /api/github/claim 401/403/200/502（GET 只查狀態、無副作用）、Invite is read-only on an organization repository、Learner still accepts the GitHub invitation、Refund revokes existing collaborator access。驗證：`rg -n "POST /api/github/claim|GET /api/github/claim-status|permission pull|pending-accept|Refund revokes existing collaborator" openspec/changes/mvp-test-scope/specs/github-kit-fulfillment/spec.md`。 [Tool: haiku]

- [x] 3.3 確認 site-agent spec 仍要求 Conversation can use configured model providers 與 V1 tools are read-only self-scoped（僅 get_my_orders、get_my_course_progress），對齊 Decision: Agent 先做工具骨架，v1 只掛兩個唯讀工具。驗證：`rg -n "get_my_orders|get_my_course_progress|POST /api/agent/chat" openspec/changes/mvp-test-scope/specs/site-agent/spec.md`。 [Tool: haiku]

- [x] 3.4 確認 course-module spec 仍要求 Lesson list is bounded（未知 id 404、空 id 400）與 v1 take-home capabilities 含站內看課。驗證：`rg -n "GET /api/course/lessons|HTTP 404|HTTP 400" openspec/changes/mvp-test-scope/specs/course-module/spec.md`。 [Tool: haiku]

- [x] 3.5 確認 design 的 Decision: 本 change 只落地規格，資料表由後續 extract 建立：工作樹仍無 apps/ 與 package.json。驗證：`test ! -f package.json && test ! -d apps && test ! -d packages`。 [Tool: sonnet]

- [x] 3.6 確認 line-learner-community spec 仍要求 GET /api/community/line-invite 已付款 200、未付款 403、未登入 401、未設定 503，並滿足 Membership requires the learner to tap join、SKOOL-like community platform is out of MVP、LINE community is peer discussion only、Support contact is email，對齊 Decision: 學員社群用 LINE 邀請連結，不做 SKOOL，也不能靜默入群。驗證：`rg -n "GET /api/community/line-invite|GET /api/support/email|inviteUrl|SKOOL|mailto" openspec/changes/mvp-test-scope/specs/line-learner-community/spec.md`。 [Tool: haiku]

## 4. Review

- [x] 4.1 對照 proposal Capabilities 與 specs/ 目錄名稱完全一致，跑 `spectra analyze mvp-test-scope --json` 與 `spectra validate mvp-test-scope`，Critical/Warning 為 0。 [Tool: kimi]

- [x] 4.2 確認來源 repo 未因本 change 變髒。三個真正來源逐一核對正確 git root，不能拿父目錄的 status 充數：
  - supastarter-nextjs-main 沒有自己的 `.git`，是 `/Users/fishtv/Development` 這個大 repo 的子目錄，該父 repo 本身混雜大量無關 untracked 檔案、`status --porcelain` 無鑑別力，改用 `find /Users/fishtv/Development/supastarter-nextjs-main -newer openspec/changes/mvp-test-scope/proposal.md -type f`，本次執行結果為空，通過。
  - thetu 真正來源是巢狀獨立 repo `THE-TU-Project/dev/thetu`（不是外層 THE-TU-Project，外層 status 只會顯示 `?? dev/` 一行、看不到內部異動），改用 `git -C /Users/fishtv/Development/THE-TU-Project/dev/thetu status --porcelain`。本次執行有 `M AGENTS.md` 及三個 untracked 項，經 `git log -1 -- AGENTS.md` 核對其 mtime 為 2026-08-03（早於本 change proposal.md 建立時間 2026-08-14），屬施工前既存的未提交異動，與本 change 無關。
  - LINE Hub（`/Users/fishtv/Development/8-外掛/line-hub`）先前未被列入檢查，補上：同樣沒有自己的 `.git`，改用 `find /Users/fishtv/Development/8-外掛/line-hub -newer openspec/changes/mvp-test-scope/proposal.md -type f`，本次執行結果為空，通過。 [Tool: kimi]

- [x] 4.3 確認 payuni-checkout 與 github-kit-fulfillment 兩份 spec 對「退款後既有 GitHub collaborator 權限」的處理一致（主動撤銷，不只鎖未來領取）。驗證：`rg -n "Refund revokes existing collaborator access|actively revoked" openspec/changes/mvp-test-scope/specs/github-kit-fulfillment/spec.md openspec/changes/mvp-test-scope/specs/payuni-checkout/spec.md` 兩檔皆命中。 [Tool: haiku]
