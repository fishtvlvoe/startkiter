## Why

課程系統目前是「demo 等級」，不是半成品：`MicroSandbox` 積木名為沙盒實際只是參數面板，不執行任何程式碼；Course Studio 後台編輯內容只有純文字輸入，沒有即時預覽；7 款互動積木寫死在 3 個檔案裡無法擴充。老闆親自玩過 AFC Loop（判斷→看後果→修正）驗證原型後確認「至少能知道自己是不是真的懂」，證實這個學習機制值得投資，現在要把積木架構升級成可擴充、把假沙盒換成真的程式執行環境。

## What Changes

- 新增 `packages/course/src/mdx/block-registry.ts`：用 Zod schema 驅動的積木註冊表，取代 `allowed-components.ts` 寫死的 `Set` 與 `LessonMdx.tsx` 寫死的 components map；新增積木改成註冊一筆 schema，不用再同時改 3 個檔案
- 新增 `WebContainerSandbox` 積木：學生在瀏覽器內用 WebContainer 執行真實 Node.js 代碼，點擊執行後跑自動測試（vitest）判定通過/失敗；通過會有 hit-stop 停頓＋視覺聽覺回饋，達成里程碑關卡另有慶祝畫面；失敗時把測試結果轉成敘事化提示，不直接顯示原始錯誤訊息
- 保留既有 `MicroSandbox`（輕量參數調整面板）原樣不動，`WebContainerSandbox` 是新增積木，不是替換或改名
- Course Studio 後台編輯器新增內容即時預覽：編輯 Lesson 的 MDX 內容時，同畫面用既有 `LessonMdx` renderer 即時渲染結果，不用切到學員視角才看到效果
- 落實既有 `course-module` spec「Course Studio 僅供 operator 管理且變更可持久化」這條需求裡已經寫明、但後台 UI 從未真正實作的章節/單元拖曳排序（後端 `reorder_lessons` mutation 與 transaction 保序邏輯已存在，純粹補齊前端拖曳互動，不是新需求）

## Non-Goals (optional)

- 不做 AI 動漫渲染管線（學員卡關自動生成動漫短片，需串 SeaArt／可靈 Kling AI）——成本會隨使用量滾動增加，且尚未驗證是否真的有效，記錄在 `AGENTS.md`「課程引擎（課神，暫稱）方向」段落，需求驗證後才排入範圍
- 不做課程地圖編輯器／MOD 創意工坊（費曼學習法 Mode，學生自製並分享課程結構）——是另一張 SR 量級的獨立產品範圍，同樣記錄在 `AGENTS.md`，本次不做
- 不做 Octalysis 八角驅動力儀表板、XP／技能樹、公會團隊副本等遊戲化外顯機制——這些是尚未驗證需求的長期構想，只驗證了 AFC Loop（判斷→後果→修正）這個最小核心機制，不代表整套遊戲化框架都值得投資
- 不修改 `inspect-mdx-source.ts` 已有的安全邊界原則（禁止 raw HTML、JS expression、event handler）——Zod Schema Registry 是把「哪些積木被允許」的宣告方式改成動態註冊，不是放寬安全檢查本身

## Capabilities

### New Capabilities

- `course-code-sandbox`: 瀏覽器內用 WebContainer 執行真實 Node.js 代碼的互動積木，含自動測試判定、打擊感回饋與里程碑慶祝

### Modified Capabilities

- `interactive-learning-blocks`: 積木註冊方式從「MDX renderer 只允許固定 7 款寫死積木」改成「Zod Schema Registry 動態註冊」，新增積木不再需要同時修改 `allowed-components.ts` 與 `LessonMdx.tsx` 兩處寫死清單
- `course-module`: Course Studio 新增「內容編輯即時預覽」需求；並把既有「章節與單元必須支援確定排序與跨章節移動」需求裡尚未被 UI 落實的拖曳互動補齊

## Impact

- Affected specs: `interactive-learning-blocks`（modified）、`course-module`（modified）、`course-code-sandbox`（new）
- Affected code:
  - New:
    - packages/course/src/mdx/block-registry.ts
    - packages/course/src/mdx/block-registry.test.ts
    - packages/course/src/components/interactive/WebContainerSandbox.tsx
    - packages/course/src/components/interactive/WebContainerSandbox.test.tsx
    - packages/course/src/webcontainer/sandbox-runtime.ts
    - packages/course/src/webcontainer/sandbox-runtime.test.ts
    - apps/saas/modules/shared/components/CourseStudioContentPreview.tsx
    - apps/saas/modules/shared/components/CourseStudioContentPreview.test.tsx
  - Modified:
    - packages/course/src/mdx/allowed-components.ts
    - packages/course/src/mdx/inspect-mdx-source.ts
    - packages/course/src/mdx/inspect-mdx-source.test.ts
    - packages/course/src/mdx/LessonMdx.tsx
    - packages/course/index.ts
    - packages/course/package.json
    - apps/saas/app/api/course/studio/route.ts
    - apps/saas/app/api/course/studio/route.test.ts
    - apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx
  - Dependencies 新增：
    - packages/course 新增 `zod`（workspace catalog 已存在，補進此套件）
    - packages/course 新增 `@webcontainer/api`
