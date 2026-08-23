## 1. Block Schema Registry 紅燈測試

- [x] 1.1 [P] 寫 `packages/course/src/mdx/block-registry.test.ts` 紅燈測試：驗證 registry 匯出的名稱集合含全部 8 款積木（TimelineSync、ConceptCompare、MicroSandbox、WorkflowSorter、InstantQuiz、TeacherAvatar、DialogueWindow、WebContainerSandbox），對應 spec「MDX 課程內容只允許固定互動積木」與 design 決策「積木註冊改成 Zod Schema Registry」；跑 `pnpm --filter @startkiter/course test block-registry` 確認測試因 registry 檔案不存在而失敗
- [x] 1.2 [P] 延伸 `packages/course/src/mdx/inspect-mdx-source.test.ts` 紅燈測試：驗證含 registry 未收錄名稱的 MDX 被拒絕（對應 spec「未在 registry 中的 component 被拒絕」scenario）；跑 `pnpm --filter @startkiter/course test inspect-mdx-source` 確認新增案例失敗

## 2. Block Schema Registry 實作

- [x] 2.1 建立 `packages/course/src/mdx/block-registry.ts`，把現有 7 款積木改寫成 `{ name, propsSchema, component }` 項目（實作 design 決策「積木註冊改成 Zod Schema Registry，而非全動態 runtime 外掛系統」）；跑 `pnpm --filter @startkiter/course test block-registry` 轉綠燈
- [x] 2.2 改寫 `packages/course/src/mdx/allowed-components.ts`，讓 `LESSON_MDX_COMPONENT_SET` 從 `block-registry.ts` 動態衍生而非手動列舉；跑 `pnpm --filter @startkiter/course test allowed-components` 或既有相關測試確認無回歸
- [x] 2.3 改寫 `packages/course/src/mdx/LessonMdx.tsx` 的 components map，從 registry 動態衍生（`Object.fromEntries`）；跑既有 `pnpm --filter @startkiter/course test LessonMdx` 確認 7 款既有積木渲染行為不變
- [x] 2.4 改寫 `packages/course/src/mdx/inspect-mdx-source.ts`，改用 registry 判斷合法 component 名稱而非寫死 `Set`；跑 `pnpm --filter @startkiter/course test inspect-mdx-source` 確認 1.2 的紅燈測試轉綠燈，且既有測試全部維持通過

## 3. WebContainerSandbox 積木紅燈測試

- [x] 3.1 [P] 寫 `packages/course/src/components/interactive/WebContainerSandbox.test.tsx` 紅燈測試（mock `@webcontainer/api`）：測試指令 exit code 0 時，元件必須先停頓 150ms（hit-stop）再渲染獎勵回饋，對應 course-code-sandbox spec「Student runs code and the test suite passes」scenario；跑 `pnpm --filter @startkiter/course test WebContainerSandbox` 確認因元件不存在而失敗
- [x] 3.2 [P] 同檔案追加紅燈測試：測試指令非 0 exit code 時，元件必須渲染敘事化提示文字而非原始 stack trace，對應「Student runs code and the test suite fails」scenario
- [x] 3.3 [P] 同檔案追加紅燈測試：`window.crossOriginIsolated` 為 false 時，元件必須顯示「此瀏覽器不支援程式碼沙盒」訊息且不呼叫 WebContainer boot API，對應「Browser does not support WebContainer」scenario

## 4. WebContainerSandbox 積木實作

- [x] 4.1 在 `packages/course/package.json` 加入 `@webcontainer/api` 依賴並釘選版本；跑 `pnpm install` 確認安裝成功且 lockfile 更新
- [x] 4.2 實作 `packages/course/src/components/interactive/WebContainerSandbox.tsx`（落實「Students execute real Node.js code inside a browser-based WebContainer sandbox」requirement）：boot WebContainer、掛載 `files` 虛擬檔案系統、執行 `testCommand`（預設 `npm test`）、依 exit code 分流 pass/fail 渲染邏輯與敘事化提示模板（語法錯誤／斷言失敗／執行逾時三類＋fallback）；跑 `pnpm --filter @startkiter/course test WebContainerSandbox` 讓 3.1-3.3 全數轉綠燈
- [x] 4.3 在 `block-registry.ts` 註冊 `WebContainerSandbox` 與其 Zod props schema（`blockId`、`files`、`testCommand`、`hints`、`milestone`），對應 course-code-sandbox spec「WebContainerSandbox props are validated as JSON-literal MDX attributes」requirement；跑 1.1 的 registry 測試確認 8 款積木名單更新後仍綠燈
- [x] 4.4 在 `apps/saas` 的 Next.js 設定加上 COOP/COEP HTTP headers（實作 design 決策「WebContainerSandbox 用瀏覽器端 WebContainer，不用伺服器端 Docker 沙盒」的 Migration Plan 第 1 步）；啟動 `pnpm --filter saas dev` 後用 `curl -I http://localhost:3001` 確認回應含 `Cross-Origin-Opener-Policy: same-origin` 與 `Cross-Origin-Embedder-Policy: require-corp`

## 5. Studio 存檔驗證改吃動態 registry 紅燈測試

- [x] 5.1 延伸 `apps/saas/app/api/course/studio/route.test.ts` 紅燈測試：存入含 `<WebContainerSandbox>` 積木的合法 MDX 內容應該成功寫入資料庫，對應 course-module spec 既有安全驗證行為套用到新積木的情境；跑 `pnpm --filter saas test course/studio` 確認因目前寫死 Set 不認得新積木而失敗

## 6. Studio 存檔驗證實作

- [x] 6.1 確認 `apps/saas/app/api/course/studio/route.ts` 呼叫的 `inspectMdxSource` 已透過第 2.4 項改吃 registry；跑 `pnpm --filter saas test course/studio` 確認 5.1 轉綠燈，並重跑既有「rejects content with an unauthorized MDX component」與「rejects content containing raw script tags」測試確認仍通過

## 7. Studio 拖曳排序紅燈測試

- [x] 7.1 寫 `admin/course/page.test.tsx`（或對應元件測試檔）紅燈測試：模擬把某單元從所屬章節拖放到另一章節後，必須呼叫 `reorder_lessons` action 並帶正確的 `chapterId`／`order`，對應 course-module spec「Studio UI 提供跨章節拖曳排序的互動控制」scenario；跑對應測試指令確認因目前無拖曳互動而失敗

## 8. Studio 拖曳排序實作

- [x] 8.1 在 `apps/saas/app/(authenticated)/(main)/(account)/admin/course/page.tsx` 加上原生 HTML5 `draggable`／`onDragStart`／`onDragOver`／`onDrop` 互動（沿用 design 決策「拖曳排序用原生 HTML5 drag-and-drop，不裝 dnd-kit」，落實「Course Studio 僅供 operator 管理且變更可持久化」requirement 裡「Studio UI 必須提供可直接拖曳的排序控制」的規定），呼叫既有 `reorder_lessons` action；跑 7.1 測試轉綠燈
- [x] 8.2 手動驗證：啟動 `pnpm --filter saas dev`，以 operator 帳號登入 Studio，實際把一個單元從一個章節拖到另一章節的指定位置，重新整理頁面確認順序保留在新位置（對應 course-module spec Example「operator 跨章節拖曳後重新載入仍一致」） # PM 已用 ego-browser 實測：把測試單元從章節一拖到章節二，重新整理頁面後仍在章節二，reorder_lessons API 確認送出正確 payload

## 9. Studio 即時預覽紅燈測試

- [x] 9.1 [P] 寫 `apps/saas/modules/shared/components/CourseStudioContentPreview.test.tsx` 紅燈測試：輸入合法 MDX 內容後，短暫延遲內必須顯示與學員端一致的渲染結果，對應 course-module spec「Course Studio 內容編輯提供即時預覽」的合法內容 scenario；跑對應測試指令確認因元件不存在而失敗
- [x] 9.2 [P] 同檔案追加紅燈測試：輸入含未授權積木名稱的內容時，預覽面板必須顯示跟存檔時相同的驗證錯誤訊息，對應同 requirement 的錯誤 scenario

## 10. Studio 即時預覽實作

- [x] 10.1 建立 `apps/saas/modules/shared/components/CourseStudioContentPreview.tsx`：對輸入內容做 300ms debounce，透過 `LessonMdx` 渲染並套用 `inspectMdxSource` 驗證，錯誤時顯示對應訊息而非空白（實作 design 決策「Course Studio 即時預覽直接複用 LessonMdx，不建第二套渲染邏輯」）；跑 `pnpm --filter saas test CourseStudioContentPreview` 讓 9.1-9.2 轉綠燈
- [x] 10.2 把 `CourseStudioContentPreview` 接進 `admin/course/page.tsx` 的內容編輯欄位旁邊；手動驗證輸入合法內容與未授權積木內容時預覽面板分別正確反應 # PM 已用 ego-browser 實測：輸入 `<UnregisteredWidget />` 後預覽面板即時顯示「講義內容含有未授權元件：UnregisteredWidget」，截圖存證

## 11. Review 與整體驗證

- [x] 11.1 跑 `pnpm --filter @startkiter/course test` 與 `pnpm --filter saas test` 全部測試套件，確認無回歸，附測試通過數字 # course 12 files／62 tests；saas 26 files／131 tests
- [x] 11.2 跑 `pnpm --filter saas build`（或 `tsc --noEmit`）確認無 TypeScript 型別錯誤 # PM 已用真實 DATABASE_URL 重跑 build 成功（非 mock 值）
- [x] 11.3 手動端到端驗證：啟動 dev server，以學員帳號進入一個含 `WebContainerSandbox` 積木的單元，實際觸發一次測試通過與一次測試失敗，確認 hit-stop 停頓、獎勵回饋、敘事化提示分別正確顯示，截圖存證 # PM 已用 ego-browser 實測 pass 路徑：真實開瀏覽器登入、點擊執行、~8-10 秒後顯示「挑戰完成！」，截圖存證。fail 路徑僅靠自動化元件測試覆蓋，未另外手動實測
- [x] 11.4 Code Review：確認 `block-registry.ts` 仍為程式碼層靜態陣列、未接受資料庫或使用者輸入註冊新積木（對應 design 決策「積木註冊改成 Zod Schema Registry」的風險緩解措施），並確認 `inspect-mdx-source.ts` 既有安全檢查（raw HTML／JS expression／event handler 全部禁止）未被放寬 # 靜態檢查完成
