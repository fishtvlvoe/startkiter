## 1. Core package and tools

- [x] 1.1 建立 packages/site-agent：tool registry 僅 get_my_orders／get_my_course_progress；未知工具拒絕；未帶 userId 拒絕查詢；get_my_course_progress 回傳 lesson 清單＋courseAccess 狀態，無獨立 progress 表時每筆 status=not_tracked。對應 Requirement: V1 tools are read-only self-scoped；Decision: packages/site-agent 純邏輯 + saas route 接 session；Decision: get_my_course_progress 本刀回 lesson 清單＋courseAccess 狀態（無獨立 progress 表則 status=not_tracked）。驗證：vitest 隔離 user A/B；get_my_course_progress 回傳結構含 lessonId 與 status（含 not_tracked 情境）。 [Tool: sonnet]
- [x] 1.2 chat 編排：空訊息 400；無 provider 503；有 mock／真 provider 回 assistantMessage。對應 Requirement: Conversation can use configured model providers；Decision: Provider 優先序 OpenAI → Gemini → Anthropic（誰有 key 用誰）；皆無 503。驗證：vitest mock provider。 [Tool: sonnet]

## 2. SaaS route and UI

- [x] 2.1 POST /api/agent/chat 接 Better Auth session＋site-agent；Cache-Control private,no-store。對應 Requirement: Conversation can use configured model providers（Unauthenticated chat is rejected）；Decision: packages/site-agent 純邏輯 + saas route 接 session。驗證：未登入 401。 [Tool: sonnet]
- [x] 2.2 /agent 最小聊天 UI。對應 Decision: 最小 UI 掛 /agent。驗證：頁面存在可送訊息（mock 或真 key）。 [Tool: sonnet]
- [x] 2.3 更新 AGENTS.md／config.yaml 現行施工為 extract-site-agent 白名單。驗證：rg 命中。 [Tool: sonnet]

## 3. Close-out

- [x] 3.1 pnpm test／type-check 綠。驗證：exit 0。 [Tool: sonnet]
- [x] 3.2 Claude OK＋Codex 無 Critical 後 archive。驗證：代理結論。 [Tool: sonnet]
