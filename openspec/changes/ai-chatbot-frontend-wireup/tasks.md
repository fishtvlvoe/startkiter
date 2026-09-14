## 1. Frontend chat component

- [x] 1.1 建立 `apps/saas/modules/ai/components/AiChat.tsx`：用 `@ai-sdk/react` 的 `useChat` 串接既有 `/ai/stream` procedure，交付：使用者輸入訊息送出後，助手回覆以串流方式逐段出現在訊息列表。驗證：手動在 dev server 實測一次對話，並附 `AiChat.test.tsx` 涵蓋「送出觸發呼叫 stream 端點」與「收到串流片段更新畫面」兩個案例。
- [x] 1.2 [after: 1.1] Stream 錯誤時在畫面顯示可見的錯誤狀態（不是靜默失敗或未處理例外），交付：模擬 stream 失敗情境時，畫面出現明確錯誤訊息。驗證：`AiChat.test.tsx` 補一個 mock stream 失敗的案例，斷言錯誤狀態有渲染出來。

## 2. 路由與導覽

- [x] 2.1 [after: 1.1] 在 `apps/saas/app/(authenticated)/(main)/` 底下新增頁面路由渲染 `AiChat.tsx`，交付：已登入使用者造訪該路由能看到聊天介面。驗證：對應 `page.test.tsx` 確認頁面渲染 `AiChat` 元件。
- [x] 2.2 [after: 2.1] 在 `packages/platform/src/mount-points.ts` 新增一筆導覽入口（label「AI 助手」），不設定 `requiresOperator`，交付：一般登入使用者（非 admin）在導覽選單看得到並能點擊進入。驗證：mount-points 對應測試確認新條目存在、`route.path` 正確、且沒有 `requiresOperator: true`。

## 3. 既有後端行為驗證

- [x] 3.1 確認 `packages/api/modules/ai/procedures/stream-message.test.ts` 涵蓋「未登入呼叫 `/ai/stream` 被拒絕」，交付：若已涵蓋則不動，若缺漏則補上一個測試案例（不修改 procedure 本身的權限邏輯）。驗證：該測試檔執行結果顯示此案例存在且通過。

## 4. 整合驗證

- [x] 4.1 [after: 1.2, 2.2, 3.1] 跑一次 `pnpm --filter saas test` 確認全綠，交付：無失敗案例。驗證：測試輸出顯示 0 failed。
- [ ] 4.2 [after: 4.1] 另一個 CLI（非實作方）做獨立 code review，聚焦「useChat 串接方式是否符合 apps/saas/modules/ 既有 API 呼叫慣例」「mount-points 新條目是否正確排除 requiresOperator」「錯誤狀態是否真的可見，不是吞掉例外」，交付：審查報告列出發現或明講「審查通過，無發現」。驗證：審查報告存在且已回覆給 PM。
