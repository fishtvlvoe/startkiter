## 1. 儲存與解析層

- [x] 1.1 建立設定讀寫模組（`packages/api/modules/ai/lib/provider-settings.ts` 或同等位置），交付：讀函式回傳 `{ provider, model, hasGeminiKey }`（絕不回傳解密後的 key 本身），寫函式接受 provider/model/可選新 key，未提供新 key 時保留原本已存的 key。驗證：單元測試涵蓋「沒存過設定時讀到預設值」「存 OpenAI 設定後讀回一致」「存 Gemini 設定＋key 後 hasGeminiKey 為 true 但讀不到明文 key」「更新設定但不提供新 key 時舊 key 不被清除」四個案例。
- [x] 1.2 [after: 1.1] `packages/ai/index.ts` 的 `textModel` 改成執行期解析的 async 函式，交付：呼叫此函式在沒有設定時回傳現行預設 `openai("gpt-4o-mini")`；Gemini 設定的 key 解密失敗時同樣安全回退到這個預設值，不拋出例外。驗證：單元測試涵蓋「無設定→預設值」「Gemini key 解密失敗（模擬 SETTINGS_ENCRYPTION_KEY 不符）→回退預設值，不拋例外」兩案例。
- [x] 1.3 [after: 1.2] 把 `textModel` 目前已知的 3 個呼叫方——`packages/api/modules/ai/procedures/stream-message.ts`、`packages/support/src/generate-diagnosis.ts`、`apps/saas/app/api/course/ai/route.ts`——從「匯入常數」改成「呼叫函式」，並重新 grep 一次確認沒有第 4 個呼叫方在寫這個任務之後才新增，交付：所有呼叫方改完後功能不中斷。驗證：`pnpm --filter @startkiter/ai test`、`pnpm --filter @startkiter/api test`、`pnpm --filter @startkiter/support test`、`pnpm --filter saas test` 全綠，且 `grep -rn "textModel" packages apps --include="*.ts" --include="*.tsx"` 結果裡沒有殘留舊的常數匯入寫法（只留函式定義與函式呼叫）。

## 2. 新增 Gemini SDK 依賴

- [x] 2.1 新增 `@ai-sdk/google` 依賴到 `packages/ai/package.json` 與 `pnpm-workspace.yaml` catalog，交付：確認版本跟現有 `packages/ai/package.json` 的 `ai` 主版本相容（實作前查 `packages/ai/package.json` 現有 `ai` 版本號，選對應相容的 `@ai-sdk/google` 版本，不猜版號）。驗證：`pnpm install` 成功，`pnpm --filter @startkiter/ai type-check` 通過。

## 3. 後台設定頁

- [x] 3.1 [after: 1.1] 建立後台設定頁（路徑依 `admin/settings/*` 既有命名慣例），權限比照 `admin/settings/checkout-gateway`（僅 operator/admin 可存取），交付：頁面能選 provider（OpenAI／Gemini）、選對應模型、Gemini 情境下能輸入 API Key（欄位留空代表保留原設定），儲存後頁面反映目前狀態（只顯示「已設定／未設定」，不顯示明文 key）。驗證：手動在 dev server 走一次選 OpenAI 儲存、選 Gemini 存 key 儲存兩種情境，並附 `page.test.tsx` 涵蓋「非 operator 使用者被擋下」（比照 checkout-gateway 頁面既有的授權測試寫法）一個案例。
- [x] 3.2 [after: 3.1] 確認 OpenAI 模型選項清單是實際查 `@ai-sdk/openai@^4.0.42` 支援的模型名稱得出，不是憑空列的型號，交付：頁面下拉選單裡的每個 OpenAI 模型字串都是該版本 SDK 實際接受的合法模型名稱。驗證：在該模型字串上實際呼叫一次 `streamText`（或至少建立一次 model 物件）不拋出「不支援的模型」錯誤。

## 4. 整合驗證

- [ ] 4.1 [after: 1.3, 2.1, 3.2] 跑一次 `pnpm test`（全域）確認全綠，交付：無失敗案例。驗證：測試輸出顯示 0 failed。
- [ ] 4.2 [after: 4.1] 另一個 CLI（非實作方）做獨立 code review，聚焦「fallback 邏輯是否真的在解密失敗時不拋例外」「Gemini API Key 是否真的從未以明文形式出現在任何 response/log/頁面渲染」「site-wide 設定是否真的沒有意外被寫成 per-user」「generate-diagnosis.ts 與課程 AI 筆記路由是否真的只做了機械式的呼叫方式更新，沒有意外改動它們自己的邏輯」，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆給 PM。
