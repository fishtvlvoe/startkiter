# StartKiter 派工看板

> 派工師讀這份決定要派誰做什麼。每次任務狀態改變，派工師／PM 都要更新這份檔案（勾選、改狀態、填 E2E 結果），再重新產生 `docs/dispatch-board.html`。
> 進度數字一律用 `grep -c '^\- \[x\]' openspec/changes/<name>/tasks.md` 實跑算出來，不用 `spectra list` 的快取數字（2026-08-21 發現對不上）。

## 圖例

- 狀態：🟢 可收尾／✅ 已完成／🔵 進行中／⏸️ 排隊中／📝 待規劃／🔴 卡關
- E2E：⬜ 未跑／🟡 跑過有失敗／✅ 全過

---

## 工作項目

### 1. interactive-learning-system
- 狀態：🟢 可封存
- Task 進度：43/43（100%）
- 指派對象：—（等 PM 執行 `spectra archive`）
- E2E：⬜ 未跑（封存前建議跑一次 `pnpm e2e` 留存證據）
- 備註：老闆點頭即可封存

### 2. unified-support-desk
- 狀態：🔵 進行中
- Task 進度：19/49（39%）
- 指派對象：Sonnet 子代理，或外部 CLI（`codex`／`cursor-agent`／`kimi`／`agy` 任一，經派工師開 Orca Worktree 派工）
- E2E：⬜ 未跑
- 備註：範圍獨立、可平行推進、風險低（不碰金流/資料完整性），適合外部 CLI 交叉驗證

### 3. platform-shell-plugin-architecture
- 狀態：🔵 進行中
- Task 進度：50/120（42%）
- 指派對象：拆 Phase 分派，見下方子項
- E2E：⬜ 未跑
- 子項：
  - Phase 4（Marketplace 展示+模版選擇，task 15-23）→ Sonnet 子代理，或外部 CLI（`codex`／`cursor-agent`）
  - Phase 6（Core 邊界文件，task 28-30）→ Sonnet 子代理，或外部 CLI（純文件+型別檢查，`kimi`／`agy` 皆可）
  - Phase 7（既有測試更新+全面驗收，task 31-32）→ PM 親自（涉及既有測試全面確認，不外派）
  - Phase 9（側邊欄 WordPress 視覺+拖曳分組持久化，task 43-48）→ Sonnet 子代理或外部 CLI（前端互動邏輯）+ 網頁設計師（Demo-first HTML）

### 4. core-module-bundles-coupons（已 park）
- 狀態：⏸️ 排隊中，隨時可 apply
- Task 進度：0/55
- 指派對象：
  - Phase 1-2（資料表＋Bundle CRUD）→ PM 親自或 Sonnet 子代理（碰 schema，出錯要重來，外部 CLI 需 PM 逐項驗收）
  - Phase 3（Coupon 驗證＋結帳整合）→ **PM 親自**（金流計算邏輯，風險最高，不外派、不交給子代理或外部 CLI）
  - Phase 4（商品目錄改造，BREAKING）→ **PM 親自**（改既有結帳行為，不外派）
  - Demo-first HTML（bundle 管理頁/銷售頁）→ 網頁設計師 agent，或外部 CLI（純視覺、風險低）
- E2E：⬜ 未跑
- 備註：Phase 3/4 禁止派給子代理或外部 CLI，money-related 一律 PM 親自；Phase 1-2 若派外部 CLI，PM 必須逐項 diff 驗收，不接受代理自報「做完了」

### 5. plan-clean-install-package-repo（已 park）
- 狀態：⏸️ 排隊中，優先序未定
- Task 進度：0/10
- 指派對象：待老闆排優先序，內容若非金流/資料庫相關可考慮外部 CLI
- E2E：⬜ 未跑

### 6-9. 待 propose 的 4 張 change
- payuni-recurring-billing（PAYUNi 定期扣款地基）→ 📝 待 discuss/propose，PM 親自（金流，不外派）
- core-module-subscriptions-invoice → 📝 待 propose，依賴 #6，金流相關 PM 親自
- core-module-newsletter → 📝 待 propose，非金流，apply 階段可考慮外部 CLI（`kimi`／`agy`）
- core-module-assignment-course-invites → 📝 待 propose，非金流，apply 階段可考慮外部 CLI

---

## 外部 CLI 派工規則（引用 routing.md，不重複展開）

- 可用 CLI：`codex`、`cursor-agent`、`kimi`、`agy`（Antigravity）
- **優先序（2026-08-21 老闆定案）：優先派 `agy`，其他三個（`codex`／`cursor-agent`／`kimi`）少派**，除非 `agy` 明顯不適合這類任務才退回用其他 CLI
- 派法：`orca worktree create` 開隔離 worktree → `orca terminal create --worktree path:<path> --command "<cli>"`，**禁止** `--command "claude"`（等於自己分身，不算交叉驗證）
- **禁止** `codex exec "..."` / `kimi -p "..."` 這類背景一次性 headless 呼叫冒充派工，要開真正互動 terminal session
- 派工師負責：開 worktree、送指令、盯完成度、`git diff` 驗證實際改了什麼——不相信代理自報「做完了」
- **money-related（金流計算、結帳、退款、資料庫 schema 遷移）一律不外派**，只能 PM 親自或至少 PM 逐行 review 後才能算數

---

## 更新方式

1. 完成/開始一項工作 → 改這份檔案的狀態欄與進度數字（進度數字用 grep 實跑，不用記憶）
2. E2E 跑完 → 填 ⬜/🟡/✅，🟡 或有失敗時附一行失敗原因
3. 改完這份 → 同步更新 `docs/dispatch-board.html`（把這份的內容渲染進去，不要讓兩份內容分岔）
