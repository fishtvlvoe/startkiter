## Why

`packages/ai/index.ts` 目前把 AI 助手用的文字模型寫死成一個常數：`export const textModel = openai("gpt-4o-mini")`。這是 supastarter 官方範本的預設寫法（官方文件明講「要換模型，直接改這行程式碼」），技術上完全可以在執行期依設定動態決定要用哪個供應商/模型，只是範本沒有內建這個機制。要換模型或換供應商，目前唯一的路是改程式碼、重新部署，管理員自己沒有任何後台介面能調整。

## What Changes

- 新增一個後台設定頁（比照既有 `admin/settings/checkout-gateway` 的權限層級與「一次只啟用一個」的選擇邏輯），讓 admin 選擇 AI 助手的供應商：OpenAI 或 Google Gemini。
- 選 OpenAI 時，可選文字模型（選項清單由實作時查 `@ai-sdk/openai`（目前鎖定 `^4.0.42`）實際支援哪些模型名稱決定，不憑空列型號）。
- 選 Gemini 時，可輸入/更新 Gemini API Key（沿用既有 `packages/api/modules/course/lib/gemini-settings.ts` 的加密邏輯，不重造一套），並選 Gemini 文字模型；新增 `@ai-sdk/google` 依賴。
- `packages/ai/index.ts` 的 `textModel` 從模組載入時的固定常數，改成一個在請求時讀取這份設定並回傳對應模型物件的函式；讀不到設定、設定損毀，或 Gemini Key 解密失敗時，安全回退到現行預設值 `openai("gpt-4o-mini")`，不讓聊天功能整個掛掉。

## Non-Goals

- 不做「同時啟用多個供應商」或「依使用者/講師各自選擇」，全站只有一組現行設定（跟 checkout-gateway 的單選邏輯一致，不是 Gemini 課程筆記那種按 instructorId 分開存的模式）。
- 不新增 Anthropic 或其他供應商，這次只做 OpenAI／Gemini 兩家。
- 不修改 `imageModel`／`audioModel`，範圍只限文字對話模型 `textModel`。
- 不改動既有 `admin/settings/gemini`（課程筆記用的 Gemini Key 設定頁）本身的邏輯，這是全新、獨立的一份全站設定，即使底層加密工具重用同一套。

## Capabilities

### New Capabilities

- `ai-provider-config`: admin 可以在後台選擇 AI 助手要用的供應商與模型（OpenAI 或 Gemini），設定值執行時生效，不需要重新部署程式碼。

### Modified Capabilities

(none)

## Impact

- Affected specs: `ai-provider-config`（新增）
- Affected code:
  - New: 後台設定頁（路徑依實作時 `apps/saas/app/(authenticated)/(main)/(account)/admin/settings/` 底下既有慣例命名，例如 `ai-provider/page.tsx`）、對應的 server action、`packages/api/modules/ai/` 底下讀寫這份設定的邏輯（可放在新檔案，例如 `provider-settings.ts`）
  - Modified: `packages/ai/index.ts`（`textModel` 改為執行期讀設定的函式）、`packages/api/modules/ai/procedures/stream-message.ts`（若呼叫方式需要從匯入常數改成呼叫函式）、`packages/ai/package.json`／`pnpm-workspace.yaml`（新增 `@ai-sdk/google` 依賴）
  - Reused (not modified): `packages/api/modules/course/lib/settings-crypto.ts`（加密/解密工具函式直接重用）
