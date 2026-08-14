## Context

repo-foundation 已建立獨立 git 與 Spectra，但 v1-scope-boundary 仍寫「不是賣課平台、主金流 SHOPLINE、不做 AI 對話」。2026-08-14 對齊結果：StartKiter 是課 + 終身代碼包；官網用這包自己賣；課程是模組；金流先統一金流；付款後自動邀請 GitHub；站內 agent 可叫網站功能。本 change 只改規格與治理文件，讓後續 extract 有單一真相。來源 repo 維持只讀。

## Goals / Non-Goals

**Goals:**

- 把 MVP 測試的商品、金流、課程模組、GitHub 交付、agent 工具邊界寫進 Spectra
- 改寫 v1-scope-boundary，使後續抽程式不再跟過期邊界走
- 更新 openspec/config.yaml、README.md、AGENTS.md 與 .docs/COMBINED.md 同一套句子

**Non-Goals:**

- 不抽應用程式碼、不安裝依賴、不部署
- 不通 Shopline／Stripe／Polar 收款
- 不開立電子發票
- 不實作 agent 寫入類工具
- 不從 libon.me 拷代碼
- 不建 SKOOL 類社群平台
- 不要求 LINE Messaging API 把學員塞進群（LINE 沒有這種能力）

## Decisions

### Decision: 結帳金額鎖 NT$8,800 不是區間

測試口語是 8,800 到 9,000。金流與訂單列必須是單一金額。MVP 結帳金額固定 8800 TWD。行銷文案寫「約九千」可以，API 與資料庫存 8800。

Alternatives Considered:

- 結帳用 9000：否決，老闆給的帶是 8,800–9,000，先取帶的下限做測試價，之後要改只改常數。
- 做成三階：否決，MVP 測試只要一價，三階會拆 SKU 與 GitHub 權益。

### Decision: 主金流只接通一金流（PAYUNi）

老闆能測 Shopline 與統一金流，指定統一金流先做因為熟。MVP 程式路徑只接通一金流一次買斷。Shopline 與 Stripe 程式介面預留位置但不接線、不上課、不出現在結帳。

Alternatives Considered:

- 先做 Shopline：否決，老闆指定統一金流。
- 用 Polar 收款再發 GitHub：否決，金流必須台灣通路，Polar 沒有「外部付款後發 GitHub benefit」的正路。
- MVP 同時接 Shopline 與 PAYUNi：否決，測試範圍加倍。

### Decision: 官網即產品實例，學員拿到的是另一個私人倉庫讀取權

對外站（銷售、上課、結帳、領取 GitHub）用這包部屬。學員買到的是 GitHub 組織私人倉庫的 pull 權限，不是 ZIP。領取頁做在課程站內，GitHub OAuth 後呼叫 GitHub API 邀請。學員仍須在 GitHub 按接受邀請。

Alternatives Considered:

- Polar 當邀請中間層：否決，與台灣金流斷開。
- 人手邀請：否決，老闆要求自動化。
- 獨立領取站：否決，已選課程平台內領取。

### Decision: 課程 UI 當模組留下，從舊售出包抽觀看與權限，不抽整套學院營運

來源對應：

- 網站殼：`/Users/fishtv/Development/supastarter-nextjs-main/apps/saas` → `apps/saas`（後續 extract）
- 認證殼：`/Users/fishtv/Development/supastarter-nextjs-main/packages/auth` → `packages/auth`
- AI SDK 殼：`/Users/fishtv/Development/supastarter-nextjs-main/packages/ai` → `packages/ai`
- 統一金流與訂單抽象：`/Users/fishtv/Development/THE-TU-Project/dev/thetu` 金流／訂單模組 → `packages/payments`
- 課程觀看與購買後解鎖：`/Users/fishtv/Development/THE-TU-Project/dev/thetu` 課程觀看／權限畫面 → `packages/course`（只抽模組，不抽電子報、優惠券、NextAuth、Apple）
- LINE Login 契約：`/Users/fishtv/Development/8-外掛/line-hub` 網頁 OAuth 決策（PHP／LIFF／Bot 不搬）

禁止改任何來源 repo。禁止拷 `products/libon.me` 或客戶站原始碼。

Alternatives Considered:

- 拆掉課程 UI 只賣骨架：否決，課程是商品本體的模組。
- 整包拷 THE-TU 學院營運：否決，範圍不是做第二個 THE-TU。
- 從 libon.me 抽多功能架構：否決，代碼零耦合；libon.me 只當可看的案例網址。

### Decision: Agent 先做工具骨架，v1 只掛兩個唯讀工具

對話接 Gemini、OpenAI、Claude（後台填 key）。工具協定先做完。v1 只註冊 `get_my_orders` 與 `get_my_course_progress`。兩者只回傳呼叫者自己的資料，禁止寫入。未登入禁止呼叫工具。

Alternatives Considered:

- v1 做成可改訂單／解鎖課程：否決，權限面太大。
- v1 只做聊天室不接工具：否決，已選 agent 不是純聊天。
- v1 接三家模型加很多工具：否決，開賣日會被工具清單拖死。

### Decision: 學員社群用 LINE 邀請連結，不做 SKOOL，也不能靜默入群

LINE 群只給已付費學員互討要做什麼 SaaS。客服不進這個群。客服是寫信到設定好的客服信箱。付款後在課程畫面顯示加入按鈕，連結是後台設定的 LINE 社群／群組邀請 URL。未付款看不到連結。這是 StartKiter 的學員交流群，跟學員 SaaS 裡的 LINE Login 不是同一條線。

LINE 沒有「付完款後端直接把人拉進群」的 API。學員必須自己點加入。SKOOL 類平台之後再談，MVP 不做。

Alternatives Considered:

- 自建 SKOOL 類論壇：否決，框架太大，課程已經在自己的站上。
- 客服跟學員互討放同一個 LINE 群：否決，老闆指定客服走 email、群只做交流。
- 用 LINE Messaging API 在加好友後推播邀請：否決，MVP 多一條 OA 與 Bot 維護；後續可加，本張不鎖必須做。
- 付完款後端強制入群：否決，LINE 不提供此能力，寫進產品會騙人。

### Decision: 本 change 只落地規格，資料表由後續 extract 建立

本 change apply 之後，可觀察結果是文件與 spec，不是跑起來的網站。下列 DDL 是後續 extract 必須建立的最小表，本 change 不執行 migration。

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  amount_twd integer NOT NULL,
  currency text NOT NULL DEFAULT 'TWD',
  status text NOT NULL,
  payuni_trade_no text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX orders_payuni_trade_no_uidx ON orders (payuni_trade_no) WHERE payuni_trade_no IS NOT NULL;
CREATE INDEX orders_user_id_idx ON orders (user_id);

CREATE TABLE course_progress (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX course_progress_user_id_idx ON course_progress (user_id);

CREATE TABLE github_kit_grants (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  github_user_id text NOT NULL,
  github_login text NOT NULL,
  repo_full_name text NOT NULL,
  permission text NOT NULL DEFAULT 'pull',
  status text NOT NULL DEFAULT 'invited',
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX github_kit_grants_github_user_id_idx ON github_kit_grants (github_user_id);
```

orders.amount_twd 必須為 8800。orders.status 至少含 pending、paid、failed、refunded。

github_kit_grants.status 至少含 invited、accepted、revoked。邀請已送未接受是 invited（accepted_at 為 null）；學員接受後是 accepted；退款撤銷後是 revoked。

## Implementation Contract

Behavior: apply 本 change 之後，讀 README.md、AGENTS.md、openspec/config.yaml、openspec/changes/mvp-test-scope/ 的人，得到的產品定義是「NT$8,800 課 + 終身代碼包、PAYUNi、站內上課、GitHub 自動邀請、agent 兩支唯讀工具、課程內 LINE 社群加入連結」。不再出現「主金流 SHOPLINE」「不是賣課平台」「四堂課對 SHOPLINE」作為現行 v1。

Interface / data shape:

- 商品常數：price_twd = 8800, currency = TWD, sku = startkiter-mvp
- 結帳（後續實作）：POST /api/checkout 未設定 PAYUNi 時 503 且不 500；webhook POST /api/payuni/notify 成功後訂單 status=paid
- 領取（後續實作）：POST /api/github/claim 執行邀請（未登入 401；未付款 403；成功 200 並建立 github_kit_grants）；GET /api/github/claim-status 只查狀態、無副作用
- 退款（後續實作）：訂單 refunded 後 POST /api/github/claim 回 403；已接受的 collaborator 與尚未接受的 pending invite 都要主動撤銷
- Agent 工具（後續實作）：get_my_orders、get_my_course_progress 只讀；寫入工具不存在
- LINE 社群（後續實作）：GET /api/community/line-invite 已付款 200 回 inviteUrl；未登入 401；未付款 403
- 客服（後續實作）：站上顯示客服信箱；GET /api/support/email 未設定 503；LINE 群不當客服通道

Failure modes:

- 金流未設定：結帳 fail-closed，明確錯誤，不是空白 500
- GitHub 邀請 API 失敗：頁面顯示可重試，不標記已領取
- GitHub 撤銷 API 失敗：退款本身仍完成，失敗寫進待人工複核
- Agent 未登入或查他人資料：拒絕工具呼叫

Acceptance criteria:

- `rg "8800|PAYUNi|終身" README.md AGENTS.md openspec/config.yaml` 命中
- `rg "不是賣課平台|四堂課" README.md AGENTS.md openspec/config.yaml` 不再把這些當現行規則
- `spectra validate mvp-test-scope` 通過
- `openspec/changes/mvp-test-scope/specs/` 含七個 capability 目錄

Scope boundaries:

- In scope: 規格、治理文件、COMBINED.md 對齊
- Out of scope: Next.js 應用、PAYUNi 金鑰、GitHub App、真實邀請、部署

## Risks / Trade-offs

[Risk] 結帳鎖 8800，老闆心理價是到 9000 → Mitigation：金額是單一常數，改價只改一處；本 change 不寫死行銷文案必須印 8800。

[Risk] 舊 v1-scope-boundary 與新規格並存，extract agent 讀錯 → Mitigation：config.yaml 與 README 開頭寫「以 mvp-test-scope 為準」；後續 archive repo-foundation 時帶新邊界。

[Risk] THE-TU 課程畫面耦合 NextAuth／優惠券 → Mitigation：extract 白名單只抽觀看與權限；其餘列為禁止項。

[Risk] GitHub 付費組織把學員當座位計費 → Mitigation：使用 GitHub 免費組織方案；設計寫明 outside collaborator pull。

[Risk] 本 change 不產可跑網站，看起來像沒做完 → Mitigation：Implementation Contract 寫明 apply 驗收是文件；抽程式是下一張 change。

## Migration Plan

部署步驟：

1. 在 products/startkiter 套用本 change 的文件與 spec
2. 跑 `spectra validate mvp-test-scope`
3. 確認來源 repo 工作樹未因本 change 變髒

回滾策略：

1. `git checkout` 還原 README.md、AGENTS.md、openspec/config.yaml
2. 刪除 openspec/changes/mvp-test-scope（若尚未 merge）
3. 產品定義回到 repo-foundation 的 v1-scope-boundary

## Open Questions

- GitHub 組織名稱與私人倉庫全名（extract 前必須填進環境設定規格）
- 課程影片檔存放位置（站內物件儲存或外嵌）；本 change 只要求站內能看課，不指定儲存供應商
- 8800 若測試後要改成 9000，另開 change 改常數，不在本張偷偷改
- LINE 社群邀請 URL 的實際值（extract 前寫進後台設定；本 change 只鎖「付費才看得到連結」）
