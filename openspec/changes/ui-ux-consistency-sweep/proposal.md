# Proposal: ui-ux-consistency-sweep

## 問題

全站整改總表 10+ 個項目全部是後端邏輯／安全性／資料庫，沒有一項是 UI/UX 一致性檢查。多支不同 CLI（Codex／cursor-agent／Grok）各自寫了自己負責的頁面（Mission 前後台、site-agent 聊天介面、CoursePack 管理），沒有人統一看過整體視覺、配色、排版風格是否一致。

已知確認的問題（Fish + PM 用 ego-browser 實測發現，非猜測）：
1. 課程教室播放頁（`/course/[lessonId]`）完全不跟隨淺色/深色主題設定，強制深色
2. 側邊欄選單「後台管理」項目跟「一般使用者」項目混在同一個未分組清單，沒有視覺分區
3. **課程模組後台選單完全扁平化，沒有一級選單整合**（2026-08-31 Fish 追加，參考 `fluent-cart`／`fluent-cart-pro` WP 外掛的選單結構）：目前側邊欄把「課程管理」「測驗管理」「評價與留言管理」「作業管理」「課程綁定包」「新生問卷」「媒體庫」「CoursePack 任務」全部列成獨立的一級選單項目，應該收攏成**一個「課程」一級選單，底下用子選單／分頁切換**。參考結構（`fluent-cart` `MenuHandler.php` 的 `addAdminMenu()`）：一個 `add_menu_page`（頂層入口）+ 多個 `$submenu['fluent-cart'][...]`（子項目：Dashboard／Orders／Customers／Products／Subscriptions／Reports／Settings／Coupons／Taxes／Logs），子項目依權限個別顯示或隱藏。這是為什麼要打造「像 WP 後台」的原因——不是每個功能各自散落在管理層 UI 上，而是同模組的功能全部收在同一個一級入口底下。

這兩個很可能只是冰山一角，不是唯一問題。

## 修法：三階段流程（審查優先，不是先猜要改什麼）

### Phase 1：系統性截圖盤點（agy + ego-browser）
把新增/修改過的頁面全部走一遍並截圖，含：
- 學員端：課程列表、教室播放頁（含淺色/深色兩種模式）、CoursePack 任務頁、site-agent 聊天頁
- 後台：admin/course-pack 列表+詳情、admin 各設定頁
- 通用：側邊欄（一般使用者身分 vs operator 身分兩種視角）、user menu dropdown、通知面板

### Phase 2：一致性審查（網頁設計師 subagent）
把 Phase 1 的截圖交給「網頁設計師」子代理審查，比對：
- 配色是否使用 `packages/ui` 既有 design token（不是頁面各自硬寫顏色 class）
- 深色/淺色模式是否每個新頁面都正確跟隨
- 間距、字級、元件風格是否跟既有頁面一致（不要求跟現有風格不同，只求「像同一個系統做的」）
- 產出具體問題清單：每個問題附頁面路徑、截圖、判定（Critical視覺壞掉 / Medium不一致 / Low可忽略）

### Phase 3：修復（Codex 或 cursor-agent，看誰有額度）
依 Phase 2 清單逐項修復，修完再截圖給網頁設計師二次確認

## 不做什麼

- 不重新設計整站視覺風格，只求「一致」，不是「重做」
- 不做響應式/行動版全面覆查（除非截圖過程順手發現明顯壞掉的才記錄，不主動擴大範圍）
- 課程模組選單整合這次只處理「課程」這一個模組，不同時把其他模組（金流訂單、使用者管理、頁面管理）也做成巢狀選單——先驗證這個模式在課程模組行得通，之後才考慮推廣到其他模組

## 課程模組選單整合（新增，範圍具體化）

**現況**：`apps/saas/modules/shared/components/NavBar.tsx` 的 `getMountMenuItems` 把課程相關功能全部列成側邊欄一級項目：課程管理、測驗管理、評價與留言管理、作業管理、課程綁定包、新生問卷、媒體庫、CoursePack 任務（新補的）。

**目標結構**：收攏成一個「課程」一級選單項目，點開後在同一個頁面內用子導覽（tab 或側邊子選單）切換上述 8 個子功能，比照 `fluent-cart` 的 `add_menu_page` + `$submenu[...]` 模式（一個入口、多個子頁面，各自依權限顯示/隱藏）。

**技術落地方式**（Next.js App Router，非 WP，需要找對應模式）：
- 可以是 `/admin/course` 底下用 Tabs 元件切換（`測驗`／`評價留言`／`作業`／`綁定包`／`新生問卷`／`媒體庫`／`CoursePack`），側邊欄只留一個「課程」入口
- 或側邊欄本身支援巢狀展開（點「課程」展開子選單，不用跳頁面）
- 兩種都可以，網頁設計師審查時一併判斷哪種更適合現有的 `AppWrapper`／`NavBar` 架構

## 影響範圍

Phase 1/2 零風險（只看不改）。Phase 3 修復範圍依審查結果決定，多是 CSS/className 調整，風險低，但要跑完整回歸測試確認沒有動到邏輯。
