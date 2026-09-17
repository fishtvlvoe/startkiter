▋ 側邊欄 email 深色模式看不見 — 根因筆記

• 排查方式：用 ego-browser 開一份等比還原頁（側邊欄背景寫死 `#1d2327`，UserMenu trigger 是原生 `<button>`，email `<span>` 只有 `text-xs block opacity-70`、沒有顏色 class），對 email / button / body 跑 `getComputedStyle`，並算對比。

• 實際量到的顏色（html 有 `class="dark"`，但沒設 `color-scheme: dark`，scheme=`normal`）：

• sidebar 背景：`rgb(29, 35, 39)` = `#1d2327`（對應 `NavBar.tsx` 的 `bg-[#1d2327]`）

• body 文字：`rgb(244, 246, 240)`（`--foreground` / `text-foreground`，淺色，理論上可讀）

• `<button id="trigger">` 文字：`rgb(0, 0, 0)`（瀏覽器 UA stylesheet 的 `color: buttontext`，沒被任何 Tailwind 顏色 class 蓋掉）

• email span：`rgb(0, 0, 0)`、`opacity: 0.7`（從 button 繼承，再乘 0.7）

• 對比（email vs sidebar）：約 `1.32:1`（遠低於 WCAG AA 的 4.5:1，幾乎看不見）

• 對照：同一頁加上 `color: var(--muted-foreground)` 的 span，顏色 `rgb(163, 173, 148)`，對比約 `6.78:1`，清楚可讀

• 繼承鏈（email → … → html）：email / 包住它的 span / button 都是黑；sidebar 與 body 才是淺色 foreground。斷點就在原生 `<button>`：UA 的 `buttontext` 截斷了從 body 下來的 `color` 繼承。

• 為什麼深色模式特別糟：側邊欄本來就寫死深底（跟 theme 無關）。theme 切到 dark 時，`--foreground` 變淺，但 email 根本吃不到它，仍卡在 UA 黑色；再加上 `opacity-70`，對比更差。專案 `tooling/tailwind/theme.css` 的 `.dark` 也沒設 `color-scheme: dark`，所以 ButtonText 不會自動改成淺色。

• 根因結論：

• 結構來源：`apps/saas/modules/shared/components/NavBar.tsx` 側邊欄 `bg-[#1d2327]`（約 L950）

• 缺陷來源：`apps/saas/modules/shared/components/UserMenu.tsx` email `<span className="text-xs block opacity-70">`（trigger 與 dropdown 各一處）沒有語意化文字色 class

• 機制：原生 button UA `color: buttontext` → 黑字壓在深底上

• 建議修法：email span 加上 `text-muted-foreground`（或等效語意 token），不要寫死 hex；讓顏色走設計系統，避開 UA buttontext。

• 證據截圖：`openspec/changes/startkiter-ui-polish-bugs/sidebar-email-before.png`

• 修復後深色 theme：email `rgb(163,173,148)` 對比約 6.78:1（截圖 sidebar-email-after.png）。
• 修復後淺色 theme（側邊欄仍為 #1d2327）：email 走 light `--muted-foreground`，對比見 sidebar-email-after-light.png。

• 修法取捨：先試 `text-muted-foreground`。深色 theme 對比約 6.78（可），但淺色 theme 的 muted（olive-600 ≈ rgb(107,115,95)）對永遠深底 `#1d2327` 只剩約 3.21，低於小字 AA。側邊欄選單既有 inactive 色是 `text-[#c3c4c7]`（見 NavBar.tsx），對 `#1d2327` 在深／淺 theme 都穩定，因此 email 改跟這個 shell token 對齊，而不是跟會隨 theme 翻轉的 muted token。

