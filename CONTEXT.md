updated: 2026-10-11
change: creator-operations-platform-blueprint

## 這個專案在幹嘛

StartKiter：課 + 終身代碼包，對外課名「開站包」。產品定位是「平台＋多個獨立 App」，不是單一固定功能的 SaaS——課程只是第一個接入的 App，之後可加入設計、社群等 App，每個 App 各自獨立管理內容、資料、選單、使用資格、文字、圖示與測試。

## 目前討論到哪

Fish 已確認：StartKiter 要擴成「台灣創作者完整營運平台」，並把 UI/UX 的容易操作列為硬條件；先完成完整藍圖，再進行開發。

第一個垂直切片已拍板：多門課程 → 公開前台銷售頁 → CourseOffer → PAYUNi → 課程權限與每門課的 LINE／歡迎信，再提供全平台唯一的 GitHub 代碼包資格。代碼包不包含課程教材；每位買家仍由同一份範本取得唯讀個人 repo，多買課程不會重複建立 repo。完整 CRM 與行銷電子報延後到交易交付閉環完成後。

已完成只讀盤點：Systeme.io Dashboard 主導覽與代表頁、StartKiter 正式站桌面／手機畫面、實際 route、`MOUNT_POINTS`、現有 package、資料模型、外部服務與 Spectra changes。

藍圖已建立於 `docs/blueprint/startkiter-creator-platform.md`，包含：產品定位、使用者、核心工作流、資訊架構、領域模型、事件流、台灣契約、技術棧、UI/UX 契約、開發順序與待拍板事項。

Spectra change：`creator-operations-platform-blueprint`，已建立 proposal、design 與 6 份 capability spec；尚未 apply、尚未修改 runtime。

### 歷史基線：2026-09-21 第二輪實際程式碼盤點證據

- `packages/platform/src/mount-points.ts` 與 `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`（呼叫 `SettingsMenu`）是兩套互不相干的選單真相來源；`/admin/course`、`/admin/users`、`/admin/orders`、`/admin/revenue`、`/admin/organizations`、`/admin/settings/checkout-gateway` 六個路由各自出現兩套不一致的中文標籤（例：`/admin/orders`「訂單管理」vs「訂單列表」）。
- `mount-points.ts` 的選單文字 100% 是硬編碼中文字串，沒有任何 `labelKey`／i18n key——這是「切換 English 後主內容變英文、側欄仍中文」的根因，已寫入 SR-01 新增的「Menu labels resolve through the active locale catalog」requirement。
- `SettingsMenu.tsx` 用不換行的水平 flex 排列，在 390px 手機寬度造成約 730px 的水平溢出；預期移除平行選單即可一併解決。
- `NavBar.tsx` 多處寫死 `bg-[#1d2327]`、`bg-[#2271b1] text-white`、`text-[#c3c4c7]` 等色碼，管理頂列與側欄不隨 color mode 切換——已寫入 SR-03。
- 既有 106 個測試檔、430 個測試通過，但仍以 `isOperator`／`course-admin-menu` 舊模型為主，尚未驗證新的「平台／App／角色」規則；SR-01 新增 task 0.1／5.1 要求遷移時逐一改寫這批測試，不得新舊斷言並存、不得沿用舊的「430 通過」當作本次驗證證據。
- 非管理員（app-user）真實登入視角尚未經人工或 ego-browser 驗證；SR-01 spec／design／tasks 已明確標記這項為「未驗證」，禁止用型別正確推定畫面正確。

## 未解問題

- 第一個主要創作者族群：課程講師、顧問／教練、服務型創作者或代理商。
- 公開銷售頁第一版編輯方式：課程卡片清單、單一 Offer 銷售頁，或兩者同時支援。
- 第一版網站能力是否延伸到多步驟漏斗；本輪先確定公開銷售頁。
- SMS provider、Creator Workspace 團隊計費、電子發票 provider、分析資料保存期限。

## 下一步

下一步把「多課程前台銷售 → PAYUNi → 交付」拆成第一張施工 SR；頁面編輯方式與主要創作者族群仍需先拍板。未經 SR 核准不進入 `spectra apply`，不改正式產品程式碼。
