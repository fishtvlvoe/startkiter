## Why

supastarter 底層架構原生內建一套完整的 AI 聊天功能（Vercel AI SDK 串 ChatGPT，含多組對話、串流回應），我們的程式碼已經抽了後端這部分過來：`packages/ai` 用 `@ai-sdk/openai` 連接 ChatGPT、`packages/api/modules/ai` 的 `/ai/stream` procedure 已經是完整可動的串流端點、`.env` 的 `OPENAI_API_KEY` 也已經設定。但前端完全沒有串起來：官方文件（`docs/reference/supastarter-nextjs-docs/ai/chatbot.mdx`）寫的 `apps/saas/modules/ai/components/AiChat.tsx` 元件不存在，導覽選單（`packages/platform/src/mount-points.ts`）沒有任何 AI 聊天入口，也沒有對應的頁面路由。使用者完全看不到、用不到這個已經寫好一半的功能。

## What Changes

- 新增 `apps/saas/modules/ai/components/AiChat.tsx`：用 `@ai-sdk/react` 的 `useChat` hook 串接既有的 `/ai/stream` procedure，提供一個單一視窗的即時串流對話介面（輸入框、訊息列表、送出按鈕、串流中狀態）。
- 新增對應頁面路由，讓已登入使用者能直接開啟這個聊天介面。
- 在 `packages/platform/src/mount-points.ts` 新增一個導覽入口（例如「AI 助手」），一般登入使用者都看得到，不需要 admin 權限（跟現有 `requiresOperator: true` 的後台項目不同）。
- 補測試：未登入使用者呼叫 `/ai/stream` 應該被擋下（驗證既有 `protectedProcedure` 權限仍生效）；前端元件基本互動（輸入、送出、顯示串流訊息）有測試覆蓋。

## Non-Goals

- 不做多組對話 session（一個使用者同時開多個聊天視窗、可切換）。
- 不做對話歷史持久化：現有 `stream-message.ts` 的 procedure 註解明確寫「without storing the chat」，這次維持這個既有行為不擴大範圍，不存資料庫。未來要加歷史紀錄留待另一張 SR。
- 不修改 `/ai/stream` procedure 本身的權限層級（已經是 `protectedProcedure`，這次只驗證現況，不變更）。
- 不新增或更換 AI 供應商（沿用現有 `@ai-sdk/openai` 串 ChatGPT 的架構）。

## Capabilities

### New Capabilities

- `ai-chatbot-ui`: 已登入使用者可以在前台開啟一個 AI 聊天視窗，即時串流跟 ChatGPT 對話，不涉及歷史紀錄持久化。

### Modified Capabilities

(none)

## Impact

- Affected specs: `ai-chatbot-ui`（新增）
- Affected code:
  - New: `apps/saas/modules/ai/components/AiChat.tsx`, `apps/saas/modules/ai/components/AiChat.test.tsx`, 對應頁面路由檔案（實作時依 `apps/saas/app/(authenticated)/(main)/` 既有結構決定確切路徑）
  - Modified: `packages/platform/src/mount-points.ts`（新增導覽入口）
  - Modified/Verified: `packages/api/modules/ai/procedures/stream-message.test.ts`（補未登入情境測試，若尚未涵蓋）
