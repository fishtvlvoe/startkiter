## Context

現有課程系統（`packages/course/`）是 2026-08-21 封存的 `interactive-learning-system` change 做出來的成果，43/43 任務標記完成，但實測發現三個落差：(1) `MicroSandbox` 積木名為沙盒實際是參數面板，不執行任何程式碼；(2) Course Studio 後台編輯 Lesson 內容只有純 Textarea，沒有即時預覽；(3) 7 款積木（TimelineSync、ConceptCompare、MicroSandbox、WorkflowSorter、InstantQuiz、TeacherAvatar、DialogueWindow）刻意寫死在 `allowed-components.ts` 的 `Set` 與 `LessonMdx.tsx` 的 components map 兩處，新增積木要同時改 3 個檔案。這個寫死設計是刻意的安全邊界（`inspect-mdx-source.ts` 禁止 raw HTML、JS expression、event handler、未註冊 component），不是半成品疏漏。

老闆親自玩過 AFC Loop（Action-Feedback-Consequence，判斷→看後果→修正）驗證原型後回饋「至少可以知道我是不是真的懂」，確認這個學習機制對學員有價值，決定投資把積木架構升級成可擴充、把假沙盒換成真的程式執行環境。長期的「課程引擎」願景（AI 動漫渲染管線、MOD 地圖編輯器、Octalysis 遊戲化儀表板、費曼學習法 Mode）已記錄在 `AGENTS.md`，明確排除在這次範圍外。

## Goals / Non-Goals

**Goals:**

- 積木註冊方式從「寫死在 2 個檔案的固定清單」改成「Zod Schema Registry 動態註冊」，新增積木只改 1 個註冊點
- 新增 `WebContainerSandbox` 積木：學生在瀏覽器內用 WebContainer 執行真實 Node.js 代碼，自動測試判定過關，過關有打擊感回饋
- Course Studio 後台編輯器補即時預覽（複用既有 `LessonMdx` renderer）
- 落實既有 `course-module` spec 已寫明但 UI 從未實作的章節/單元拖曳排序

**Non-Goals:**

- 不做 AI 動漫渲染管線、MOD 地圖編輯器／UGC 工坊、Octalysis 八角儀表板／XP／技能樹、費曼學習法 Mode——記錄在 `AGENTS.md`，需求未驗證前不排入
- 不放寬 `inspect-mdx-source.ts` 既有的安全檢查（raw HTML、JS expression、event handler 仍全部禁止）——Registry 只改變「合法積木清單」的宣告方式，不改變安全模型
- 不支援 Node.js／JavaScript 以外的程式語言沙盒（Python、PHP 等）——WebContainer 技術限制，超出範圍另開 change

## Decisions

### 積木註冊改成 Zod Schema Registry，而非全動態 runtime 外掛系統

新增 `packages/course/src/mdx/block-registry.ts`，用一個 TypeScript 陣列＋Zod schema 靜態註冊每款積木的名稱與 props schema，`allowed-components.ts` 的 `LESSON_MDX_COMPONENT_SET` 改成由 registry 動態算出（`new Set(registry.map(b => b.name))`），`LessonMdx.tsx` 的 components map 同樣改成 `Object.fromEntries(registry.map(b => [b.name, b.component]))`。

**Alternatives Considered:**
- 維持現狀（3 檔案手動同步）：被否決，這正是要解決的問題，新增積木成本隨積木數量線性增加且容易漏改其中一處造成 client/server 判定不一致
- 全動態 runtime 外掛系統（積木定義存資料庫，operator 可上傳新積木不用改程式碼）：被否決，這等於重新打開 `interactive-learning-system` 刻意關閉的 XSS 攻擊面（任意 operator 或未來的第三方都能定義任意 React component 渲染邏輯），且目前只有一個 operator（老闆本人），沒有多租戶擴充積木的真實需求

### WebContainerSandbox 用瀏覽器端 WebContainer，不用伺服器端 Docker 沙盒

新增積木在瀏覽器內啟動 WebContainer（`@webcontainer/api`），掛載虛擬檔案系統，執行 `npm install` 後跑測試指令，零伺服器運算成本。

**Alternatives Considered:**
- 伺服器端 Docker 沙盒：被否決，需要顧慮任意程式碼執行的隔離安全（rm -rf、fork bomb、網路存取），且現有 Coolify VPS 只有 2 vCPU/3.3GB，扛不住多學員同時觸發容器
- Godot／通用遊戲引擎沙盒：被否決，教學內容是「寫程式碼」不是「玩遊戲」，Godot 沙盒無法執行真實 Node.js 專案，跟教學目標不對齊

### 拖曳排序用原生 HTML5 drag-and-drop，不裝 dnd-kit

Course Studio 的章節/單元拖曳排序沿用 `platform-shell-plugin-architecture` change（NavBar 側邊欄分組拖曳）已經用過的原生 `draggable`／`onDragStart`／`onDragOver`／`onDrop` 模式，呼叫既有 `apps/saas/app/api/course/studio/route.ts` 的 `reorder_lessons` action（transaction 保序邏輯已存在，只是前端從未接上）。

**Alternatives Considered:**
- 參考 `woomin` repo 的 `dnd-kit`：被否決，dnd-kit 是新依賴，且專案內已有原生 drag-and-drop 的成功先例（NavBar 側邊欄分組），沿用同一套模式降低維護負擔（ponytail 原則：能用現有依賴就不加新依賴）
- 純按鈕上移/下移：被否決，多單元排序時操作次數太多，且無法一次跨章節搬移，體驗劣於既有 spec 要求的「跨章節拖曳」

### Course Studio 即時預覽直接複用 LessonMdx，不建第二套渲染邏輯

編輯 Lesson 內容的 Textarea 旁新增一個預覽面板，debounce 300ms 後把目前輸入值餵給既有 `LessonMdx` component 渲染，跟學員實際看到的畫面共用同一套渲染邏輯與 allowlist 檢查（`inspectMdxSource`），確保「預覽看到的」跟「存檔後學員看到的」一致。

**Alternatives Considered:**
- 另外寫一套 Studio 專用的簡化 MDX 預覽渲染器：被否決，會造成「預覽正常但實際渲染失敗」或反過來的不一致，且重複維護兩套渲染邏輯

## Implementation Contract

**Behavior:**
- 新增積木時，工程師只需要在 `block-registry.ts` 加一筆 `{ name, propsSchema, component }`，不用再手動同步 `allowed-components.ts` 與 `LessonMdx.tsx`
- 學生在含 `WebContainerSandbox` 積木的單元裡看到程式碼編輯區與「執行」按鈕；點擊執行後畫面先顯示載入狀態，測試通過後有 150ms 停頓（hit-stop）再顯示過關動畫與音效，測試失敗則顯示敘事化提示文字（不是原始 stack trace）
- operator 在 Course Studio 編輯 Lesson 內容時，Textarea 旁的預覽面板即時顯示渲染結果，包含目前輸入內容若含未授權積木時顯示的錯誤訊息（跟存檔時會出現的錯誤一致）
- operator 可以把單元從一個章節拖到另一個章節的任意位置，重新載入 Studio、公開課綱、學員教室後順序都一致（沿用 `course-module` spec 既有 Example 的驗收標準）

**Interface / data shape:**
- `BlockDefinition<T>`: `{ name: string; propsSchema: ZodSchema<T>; component: ComponentType<T> }`，`block-registry.ts` export `BLOCK_REGISTRY: BlockDefinition<any>[]`
- `WebContainerSandboxProps`: `{ blockId: string; files: Record<string, string>; testCommand?: string; hints: string[]; milestone?: boolean }`，所有欄位透過 MDX JSX attribute 以 JSON literal 傳入（沿用既有 `isSafeAttributeExpression` 限制，不允許 JS expression）
- WebContainer 執行結果內部事件：`{ status: "pass" | "fail"; testOutput: string }`，`pass` 觸發 hit-stop 動畫，`fail` 依 `testOutput` 內容比對已知錯誤類型模板產出敘事化文字，無比對到模板則顯示通用鼓勵文字

**Failure modes:**
- 瀏覽器不支援 `crossOriginIsolated`（WebContainer 前提）時，`WebContainerSandbox` 顯示明確的「此瀏覽器不支援程式碼沙盒」訊息，不嘗試靜默降級或顯示空白
- `block-registry.ts` 註冊時 `propsSchema` 型別錯誤，由單元測試在 CI 階段擋下，不是 runtime 才發現
- Studio 存檔時內容含未授權積木，沿用既有 `inspectMdxSource` 擋在 API 層（`apps/saas/app/api/course/studio/route.ts` 已在本輪之前的安全修復中補上此檢查），本次改動讓這個檢查改吃動態 registry 而非寫死 Set

**Acceptance criteria:**
- `packages/course/src/mdx/block-registry.test.ts`：驗證 registry 能查到全部 7 款既有積木＋新的 `WebContainerSandbox`，且 `allowed-components.ts` 導出的 Set 與 registry 內容一致
- `packages/course/src/components/interactive/WebContainerSandbox.test.tsx`：mock `@webcontainer/api`，驗證 pass/fail 兩種結果各自渲染正確的回饋內容
- `apps/saas/app/api/course/studio/route.test.ts`：延伸既有測試，驗證存檔時對動態 registry 而非寫死清單做驗證，新積木入庫後存檔不再被擋
- Course Studio 手動驗證：啟動 dev server，實際拖曳一個單元跨章節，重新整理頁面確認順序保留；編輯內容輸入未授權積木字串確認預覽面板即時顯示錯誤

**Scope boundaries:**
- 範圍內：block registry 重構、`WebContainerSandbox` 新積木、Studio 即時預覽、Studio 拖曳排序 UI
- 範圍外：AI 動漫渲染管線、MOD 地圖編輯器、Octalysis 儀表板／XP／技能樹、費曼學習法 Mode、非 Node.js 語言沙盒

## Risks / Trade-offs

- [Risk] WebContainer 需要 Cross-Origin-Isolation（COOP/COEP）HTTP headers 才能啟動 → Mitigation: 在 `apps/saas` 的 Next.js 設定加上對應 headers，先在本機瀏覽器驗證相容性清單，記錄哪些瀏覽器/版本不支援
- [Risk] 把積木註冊改成動態 Registry，若未來誤植為接受資料庫或使用者上傳的 schema，等於重新打開已關閉的 XSS 攻擊面 → Mitigation: Registry 明確定義為程式碼層靜態陣列（TypeScript 檔案），本次設計不接受任何 runtime 外部輸入註冊新積木，新增積木仍要走 code review
- [Risk] `@webcontainer/api` 是新依賴，增加 bundle 大小與維護面 → Mitigation: 動態 import 僅在 `WebContainerSandbox` 元件內載入，不影響其他頁面 bundle；釘選版本號
- [Risk] 學生裝置效能不足或使用不支援 WebContainer 的瀏覽器 → Mitigation: 明確偵測並顯示不支援訊息，不做無聲降級

## Migration Plan

1. 部署 COOP/COEP headers 設定，先確認既有頁面（尤其含 iframe 或第三方 script 的頁面）不受影響
2. 部署 block-registry 重構（7 款既有積木改寫成 registry 項目，行為不變，純重構，可獨立部署與驗證）
3. 部署 `WebContainerSandbox` 新積木（新增功能，預設沒有任何既有課程單元使用它，不影響現有學員）
4. 部署 Studio 即時預覽與拖曳排序 UI（純前端功能，無 schema migration）

回滾策略：全部改動都是程式碼層（無新 DB 欄位、無 migration），任何一步出問題可直接 `git revert` 對應 commit；`WebContainerSandbox` 因為預設沒有課程使用，回滾風險最低。

## Open Questions

- WebContainer 是否要跨 session 快取已下載的 npm 依賴以加速二次進入沙盒——留給實作階段依實測載入時間決定
- 敘事化錯誤提示文案庫的覆蓋範圍——先做語法錯誤／測試斷言失敗／執行逾時三種常見類型，其餘 fallback 通用鼓勵文字，之後依實際學員卡關資料擴充
