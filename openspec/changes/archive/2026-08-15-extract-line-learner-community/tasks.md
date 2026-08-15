## 1. API and entitlement

- [x] 1.1 實作 GET /api/community/line-invite：session 401；無 courseAccess（sku startkiter-mvp）403 且無 inviteUrl；URL 缺／非 https 503；成功 200+https inviteUrl。對應 Requirement: Paid learners see a LINE community join control；Decision: entitlement 用 Order.courseAccess + sku startkiter-mvp。驗證：vitest 覆蓋四態。 [Tool: sonnet]
- [x] 1.2 讀 env LINE_COMMUNITY_INVITE_URL（trim＋https 校驗），寫入 .env.example。對應 Decision: URL 只讀 env LINE_COMMUNITY_INVITE_URL（本刀）。驗證：缺設定回 503；.env.example 有鍵。 [Tool: sonnet]
- [x] 1.3 更新 AGENTS.md 與 openspec/config.yaml：把殘留的 extract-github-kit-fulfillment「本刀白名單」「本刀範圍」陳述改標為已封存，換成 extract-line-learner-community 現行範圍（line-invite API、courseAccess entitlement、/course UI 加入控制、LINE_COMMUNITY_INVITE_URL env；不做 Messaging／LIFF／Bot／靜默入群／site-agent）。對應 proposal What Changes 第 4 點。驗證：rg -n "本刀" AGENTS.md openspec/config.yaml 命中處皆指向 extract-line-learner-community，不再指向已封存的 extract-github-kit-fulfillment。 [Tool: sonnet]

## 2. Course UI

- [x] 2.1 在 /course 付費區塊掛最小加入控制（外連 inviteUrl），文案標明學員交流、非客服；無權者不顯示邀請 URL。對應 Decision: UI 掛在 /course 付費區塊。驗證：本機或元件 smoke 看得到文案。 [Tool: sonnet]

## 3. Close-out

- [x] 3.1 pnpm test 與 type-check 全綠。驗證：exit 0。 [Tool: sonnet]
- [x] 3.2 spectra validate／analyze 無 Critical；Claude OK；Codex 無 Critical 後 archive。驗證：CLI＋代理結論。 [Tool: sonnet]
