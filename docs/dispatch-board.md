# StartKiter 派工看板

> 派工師讀這份決定要派誰做什麼。每次任務狀態改變，派工師／PM 都要更新這份檔案（勾選、改狀態、填 E2E 結果），再重新產生 `docs/dispatch-board.html`。
> 進度數字一律用 `grep -c '^\- \[x\]' openspec/changes/<name>/tasks.md` 實跑算出來，不用 `spectra list` 的快取數字（2026-08-21 發現對不上）。

## 派工分級原則（2026-08-21 老闆定案）

不是「PM 寫計畫、其他都能外包」這條線，是**任務能不能被獨立、可靠地驗證**：

| 特徵 | 派給誰 |
|---|---|
| 有明確規格照抄、機械性、輸出容易肉眼核對（讀檔摘要、照 design.md 抄的型別/CRUD、照現有格式翻譯、純文件） | **Haiku 子代理** |
| 需要抓根因、跨檔案除錯、架構判斷、驗收別人做的東西（含驗收 Haiku/外部 CLI 自報）、UI 視覺 demo（會踩到平台限制，如 CSP/元件庫，需要有經驗判斷） | **Sonnet 子代理**（我自己或 Sonnet 等級） |
| money-related（金流計算、結帳、退款、資料庫 schema 遷移）、git/worktree 等高風險基礎設施操作 | **PM 親自**，不外派 |

依據：2026-08-21 這個 session 踩的坑（子代理漏寫測試、tasks.md 假完成沒 commit、icon bug 只有真人點才抓到、worktree 分支衝突）全部發生在「除錯/驗證/判斷」類工作，不是規劃——Haiku 弱在這塊，派下去只會讓漏洞更難被抓到。

## 圖例

- 狀態：🟢 可收尾／✅ 已完成／🔵 進行中／⏸️ 排隊中／📝 待規劃／🔴 卡關
- E2E：⬜ 未跑／🟡 跑過有失敗／✅ 全過

---

## 工作項目

### 1. interactive-learning-system
- 狀態：✅ 已封存（2026-08-21）
- Task 進度：43/43（100%）
- E2E：⬜ 未跑正式 e2e（archive 前已用行為驗證代替）

### 2. unified-support-desk
- 狀態：🔵 進行中
- Task 進度：19/49（39%）
- 指派對象：
  - 純資料模型/API 照既有 spec 補齊的部分 → **Haiku 子代理**，PM 抽查 diff
  - 涉及跟既有客服流程整合、判斷邊界案例的部分 → **Sonnet 子代理**，或外部 CLI（優先 `agy`）
- E2E：⬜ 未跑
- 備註：範圍獨立、可平行推進、風險低（不碰金流/資料完整性）

### 3. platform-shell-plugin-architecture
- 狀態：🔵 進行中
- Task 進度：50/120（42%，2026-08-21 補 commit 了原本卡住沒存檔的 Phase 2 側欄動態渲染）
- 子項：
  - Phase 4（Marketplace 展示+模版選擇，task 15-23）→ 純展示頁面照 spec 抄 → **Haiku 子代理**；模版套用邏輯跟 Mount Points 接合 → **Sonnet 子代理**
  - Phase 6（Core 邊界文件，task 28-30）→ 純文件 → **Haiku 子代理**
  - Phase 7（既有測試更新+全面驗收，task 31-32）→ **PM 親自**（涉及既有測試全面確認，需要判斷哪些是本次改動造成、哪些是既有 baseline，不外派）
  - Phase 9（側邊欄 WordPress 視覺+拖曳分組持久化，task 43-48）→ **PM 親自或 Sonnet 子代理**（2026-08-21 發現這塊有半成品 bug：icon fallback 字重疊、拖曳把手定位跑掉，需要抓根因，不適合 Haiku）+ 網頁設計師 agent（Demo-first HTML）
- E2E：⬜ 未跑
- 待處理清單（2026-08-21 老闆點出，先列清單再修，不當場亂改）：
  1. NavBar `iconMap`（`apps/saas/modules/shared/components/NavBar.tsx`）缺多個圖示 key，fallback 會把字串印出來蓋到選單文字（已修一例：bundles 選單改用 `settings` key 頂著，其他未知 key 可能還有同樣問題）
  2. 側邊欄拖曳調整寬度的把手（sidebar edge resize handle）定位邏輯沒做完，會不正常持續顯示
  3. task 6.2（`sidebar-context.tsx` 狀態涵蓋 /app, /course, /agent, /admin/settings 全部路由）未確認/未擴充
  4. task 5.1/5.2/9.3 紅燈測試未補寫
  5. task 11.1-11.3（Review、Chrome MCP 截圖、build+test 全綠）未做

### 4. core-module-bundles-coupons
- 狀態：🔵 進行中
- Task 進度：42/56（75%）
- 指派對象：
  - Phase 1-2（資料表＋Bundle CRUD）→ 已完成，PM 親自+Sonnet 子代理混合，PM 全數驗證
  - Phase 3（Coupon 驗證＋結帳整合）→ ✅ 已完成，**PM 親自**（金流計算邏輯，風險最高，不外派）。順帶修正 `packages/payments` 既有的 `order.ts`／`notify.ts` 硬寫死 MVP_AMOUNT_TWD 的問題，改為信任伺服器端算出的折扣金額並守住上限
  - Phase 4（商品目錄改造，BREAKING）→ **PM 親自**（改既有結帳行為，不外派）
  - Demo-first HTML → 已完成兩輪（一次 CSP bug 需 Sonnet 抓根因重做），純視覺重製部分可用 Haiku，但要 Sonnet/PM 覆核是否真的用了專案既有色票/元件規格
- E2E：⬜ 未跑
- 備註：Phase 3/4 禁止外派，money-related 一律 PM 親自

### 5. plan-clean-install-package-repo（已 park）
- 狀態：⏸️ 排隊中，優先序未定
- Task 進度：0/10
- 指派對象：待老闆排優先序，內容若非金流/資料庫相關，機械性部分可用 Haiku

### 6-9. 待 propose 的 4 張 change
- payuni-recurring-billing（PAYUNi 定期扣款地基）→ 📝 待 discuss/propose，PM 親自（金流，不外派）
- core-module-subscriptions-invoice → 📝 待 propose，依賴 #6，金流相關 PM 親自
- core-module-newsletter → 📝 待 propose，非金流，apply 階段機械性部分可用 Haiku，整合判斷部分 Sonnet/外部 CLI（優先 `agy`）
- core-module-assignment-course-invites → 📝 待 propose，非金流，同上

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
