## 1. Demo-first 驗證流程：先出 HTML demo 確認，再動真代碼

- [x] 1.1 用移植後的真實設計 token（見第 2 節）產出首頁靜態 HTML demo（淺色/深色雙模式），驗證方式：老闆在瀏覽器打開檔案人工確認，回覆「可以」才算完成
- [x] 1.2 產出登入/註冊頁靜態 HTML demo（淺色/深色雙模式），驗證方式：老闆人工確認回覆「可以」
- [x] 1.3 產出後台首頁（/app）靜態 HTML demo（淺色/深色雙模式），驗證方式：老闆人工確認回覆「可以」
- [x] 1.3b 老闆已對首頁／登入頁／後台首頁三頁 demo 明確回覆「可以」，驗證方式：對話紀錄留存確認
- [x] 1.5 產出後台課程觀看頁靜態 HTML demo（課程單元列表側欄＋播放區塊＋進度，淺色/深色雙模式），視覺與元件比照 1.3 後台首頁的設計語言，內容參考現有 apps/saas/app/course 頁面既有的課程單元/進度資訊結構，不照抄 THE-TU-Project 原本的視覺樣式，驗證方式：老闆在瀏覽器打開檔案人工確認，回覆「可以」才算完成。本 task 僅產出靜態 demo，不修改 apps/saas/app/course 底下的真實頁面（真實頁面改版留待後續 change，見 design.md Non-Goals）
- [x] 1.6 關卡：四頁 demo（首頁／登入頁／後台首頁／課程觀看頁）全部確認通過後才能進入第 2 節（元件庫移植與真代碼實作），驗證方式：確認 1.1-1.3、1.5 四個 demo checkbox 皆已勾選，且對話紀錄中老闆對四頁分別表示過同意

## 2. 元件庫移植方式：整包搬遷不是重新手刻

- [x] 2.1 [P] 比對 supastarter-nextjs-main 與 StartKiter 兩邊 package.json 的 Next.js／React／Tailwind／Radix UI 版本號，列出版本落差清單，驗證方式：產出一份版本比對表，每個套件標示「相同/StartKiter 較舊/StartKiter 較新」
- [x] 2.2 撰寫測試：驗證 Requirement「UI components come from the shared design system」——對 packages/ui 匯出的 Button、Card、Badge、Input、Form、ColorModeToggle 元件各寫一個渲染測試，斷言元件輸出的 DOM 帶有 `data-slot` 屬性，驗證方式：`pnpm --filter @startkiter/ui test` 目前為紅燈（元件尚未存在）
- [x] 2.3 將 supastarter-nextjs-main/packages/ui/components 底下的 Button、Card、Badge、Input、Form 元件原始檔複製進 packages/ui/src/components/，滿足 Requirement「UI components come from the shared design system」，驗證方式：`pnpm --filter @startkiter/ui test` 轉綠燈
- [x] 2.4 將 supastarter-nextjs-main/apps/saas/modules/shared/components/ColorModeToggle.tsx 複製進 packages/ui/src/components/color-mode-toggle.tsx 並調整 import 路徑，滿足 Requirement「Dark and light mode share the same component system」，驗證方式：元件測試綠燈且 `pnpm --filter @startkiter/ui type-check` 通過
- [x] 2.5 撰寫測試並實作 Requirement「Design tokens are ported, not approximated」——將 supastarter-nextjs-main/apps/saas/app/globals.css 的 CSS 自訂屬性 token 段落（含 `@variant dark` 宣告）複製進 apps/saas/app/globals.css，驗證方式：讀取兩份檔案的 `--radius`（或對應改名後 token）自訂屬性字串值，兩者逐字相同
- [x] 2.6 更新 packages/ui/src/index.tsx 匯出新元件，移除 stub Panel 元件，驗證方式：`grep -rn "Panel" packages/ui/src apps/saas/app` 確認 apps/saas 內無任何頁面仍 import Panel
- [x] 2.7 cross-impact 補強：保留 apps/saas/app/globals.css 現有的 `.hero`／`.button`／`.panel`／`.actions`／`.muted` class 不刪除、不改名（course、checkout、admin/settings、agent 等頁面仍在使用），且不在本 change 修改 apps/saas/app/course/、checkout/、admin/settings/、agent/ 底下任何頁面，驗證方式：`git diff --stat` 確認這些路徑下的檔案本次改動中皆為 0 異動，且用 ego-browser 開啟本機 /course、/checkout、/admin/settings、/agent 四個頁面，確認畫面樣式與改版前一致（未出現無樣式的裸版面）

## 3. 字體策略：DM Sans 接中文字體 fallback

- [x] 3.1 撰寫測試：驗證 Requirement「Chinese text renders with a CJK font fallback」——斷言 apps/saas/app/globals.css 內每個包含 DM Sans 的 `font-family` 宣告，緊接在 DM Sans 後面的下一個字體名稱為 Noto Sans TC，驗證方式：新增一支 CSS 解析測試，目前為紅燈
- [x] 3.2 在 globals.css 的 font-family 宣告加入 Noto Sans TC fallback 並設定字體來源（Google Fonts 或自架），滿足 Requirement「Chinese text renders with a CJK font fallback」，驗證方式：3.1 測試轉綠燈
- [x] 3.3 用 ego-browser 開啟本機 apps/saas 首頁，截圖比對「取得開站包 NT$8,800」這類中英混排文字，人工確認字重/基線一致，驗證方式：截圖存檔並附上人工確認結論

## 4. 多語系架構：沿用 supastarter 的 next-intl，不用其他 i18n 套件

- [x] 4.1 撰寫測試：驗證 Requirement「At least three locales are supported at launch」——對 GET /zh-tw、GET /zh-cn、GET /en 三個路由各斷言回應 200，驗證方式：`pnpm --filter @startkiter/saas test` 新增 locale 路由測試，目前為紅燈
- [x] 4.2 撰寫測試：驗證 Requirement「Missing translation keys fall back to zh-TW」——對一個刻意在 en catalog 缺漏但 zh-TW catalog 存在的 key，斷言渲染結果為 zh-TW 文字而非原始 key 字串，驗證方式：新增 fallback 測試，目前為紅燈
- [x] 4.3 將 supastarter-nextjs-main/packages/i18n 的 next-intl 架構移植進 StartKiter packages/i18n，取代現有自製 messages 物件，滿足 Requirement「At least three locales are supported at launch」與「Missing translation keys fall back to zh-TW」，驗證方式：4.1、4.2 測試轉綠燈
- [x] 4.4 建立 zh-TW、zh-CN、en 三份訊息目錄檔案，內容為現有 StartKiter 首頁/登入/後台文案的對應翻譯，滿足 Requirement「Locale is zh-TW only」（現行為多語系起跳，zh-TW 維持 fallback 語系），驗證方式：`pnpm --filter @startkiter/i18n type-check` 通過且三語系路由皆可渲染對應語言文字
- [x] 4.5 驗證 Requirement「Locale list is extensible without component changes」——新增一份第四語系（例如 ja）作為擴充性驗證，只新增訊息檔與語言清單項目，不改任何元件檔案，驗證方式：`git diff --stat` 顯示變更僅涉及 i18n 訊息檔與語言清單常數，未觸及 apps/saas/app 或 packages/ui 下任何檔案，驗證完後移除這份測試用語系檔案
- [x] 4.6 cross-impact 補強：撰寫測試涵蓋 apps/saas/app/components/site-nav.tsx（被 page.tsx／course/page.tsx／course/[lessonId]/page.tsx／signup/page.tsx／app/page.tsx／agent/page.tsx／admin/settings/page.tsx／checkout/page.tsx／login/page.tsx 共 9 個頁面共用）在三語系下正確渲染，並同步改寫 site-nav.tsx 與 apps/saas/app/app/page.tsx 對 packages/i18n 的呼叫方式，配合 4.3 的新 next-intl 介面，驗證方式：新增 SiteNav 渲染測試（斷言三語系下皆能正確渲染、無執行期錯誤）並轉綠燈，且 `pnpm --filter @startkiter/saas type-check` 通過

## 5. 登入/註冊 UI 重做

- [x] 5.1 撰寫測試：驗證 Requirement「Login and signup forms use the shared design system」——斷言 GET /login 渲染出的 email input、password input、submit button 帶有 design-system 元件的 `data-slot` 屬性，驗證方式：新增元件屬性測試，目前為紅燈
- [x] 5.2 用第 2 節移植好的 Input／Button／Form 元件重寫 apps/saas/app/login/login-form.tsx 與 signup/page.tsx，滿足 Requirement「Login and signup forms use the shared design system」，驗證方式：5.1 測試轉綠燈
- [x] 5.3 驗證 Requirement「Auth provider list is structurally extensible」——把 Google、LINE 登入按鈕改為從一份 provider 清單陣列渲染，而非各自寫死的 JSX 區塊，驗證方式：新增一個測試 provider 項目到清單陣列，斷言登入頁渲染出對應按鈕且未修改頁面版面程式碼其他部分

## 6. 前後台版面骨架

- [x] 6.1 撰寫測試：驗證 Requirement「Shell pages use the shared design system」——斷言 GET / 的 DOM 不包含僅靠 `.hero`／`.button` 這類頁面自製 class 提供樣式的元素，驗證方式：新增 DOM class 檢查測試，目前為紅燈
- [x] 6.2 依 1.1 確認過的首頁 demo，重寫 apps/saas/app/page.tsx，比照 supastarter.dev 版面語言（置中 Hero、徽章、打勾清單、雙 CTA、社會認同、功能深潛區塊），滿足 Requirement「Shell pages use the shared design system」，驗證方式：6.1 測試轉綠燈，且立即用 ego-browser 截圖真實頁面與 1.1 demo 並排比對，逐項記錄有無落差（不等到第 10 節才比對）；若有落差立即修正，不得留到後續才處理
- [ ] 6.3 依 1.3 確認過的後台 demo，重寫 apps/saas/app/app/page.tsx，比照 demo.supastarter.dev 版面語言，驗證方式：`pnpm --filter @startkiter/saas test` 新增後台首頁渲染測試通過，且立即用 ego-browser 截圖真實頁面與 1.3 demo 並排比對，逐項記錄有無落差；若有落差立即修正
- [ ] 6.5 依 1.5 確認過的課程觀看頁 demo，重寫 apps/saas/app/course/page.tsx 與 course/[lessonId]/page.tsx，比照 1.5 demo 的版面語言，驗證方式：新增課程頁渲染測試通過，且立即用 ego-browser 截圖真實頁面與 1.5 demo 並排比對，逐項記錄有無落差；若有落差立即修正。本 task 與 tasks 2.7「本次不修改 course 頁面」的排除範圍不衝突——2.7 排除的是「不主動重做」，本 task 是因為 1.5 demo 已經走過老闆確認流程，才把課程頁納入本次真代碼範圍
- [x] 6.4 撰寫測試：驗證 Requirement「Marketing surface and app surface are not required to share identical layout」——比對 GET / 與 GET /app 兩者的色彩 CSS 自訂屬性計算值，斷言逐一相同，驗證方式：新增 token 一致性測試，確認前後台共用同一份設計 token

## 7. 買家擴充機制：輕量慣例文件，不採用 runtime plugin 框架（如 cordis）

- [x] 7.1 撰寫 docs/buyer-extension-convention.md，滿足 Requirement「A written module convention document exists」——以 packages/course（或另一個現有真實模組）的實際資料夾結構與 index 檔內容當範例，列出新模組的資料夾/進入點/env 宣告規則，驗證方式：文件內容包含至少一個真實 packages/ 路徑與該路徑實際檔案內容摘錄
- [x] 7.2 驗證 Requirement「Convention is written for an AI coding tool audience, not a human tutorial」——依文件內容手動走一次「新增一個假模組」流程，驗證方式：照文件步驟建立一個 packages/demo-module 測試模組，確認能成功產生符合慣例的資料夾結構後刪除該測試模組

## 8. 一鍵部署設定

- [x] 8.1 建立 Zeabur 部署設定檔（deploy/zeabur.yaml 或等價 manifest），滿足 Requirement「Repository provides a one-click deploy path」——宣告 PostgreSQL 相依與 BETTER_AUTH_URL、DATABASE_URL 必要環境變數，驗證方式：設定檔內容經 YAML/JSON 格式驗證且包含上述宣告
- [x] 8.2 在 README.md 加入一鍵部署按鈕與說明，滿足 Requirement「Repository provides a one-click deploy path」，驗證方式：README 內含指向部署設定的連結或按鈕圖片
- [ ] 8.3 驗證 Requirement「One-click deploy succeeds without payment or OAuth keys configured」——用該部署設定在 Zeabur 建立一次全新測試部署，只設定 DATABASE_URL 與 BETTER_AUTH_SECRET，驗證方式：對部署後的網址發送 GET / 請求，回應 200 且不是 500，完成驗證後可視情況保留或關閉該測試部署

## 9. v1-scope-boundary 文件更新

- [ ] 9.1 更新 openspec/config.yaml 的 context 段落，滿足 Requirement「v1 take-home capabilities」——移除「i18n 只留 zh-TW」的舊規則描述，改為反映多語系起跳的現行狀態，驗證方式：`spectra validate extract-supastarter-design-system` 通過且無 Critical 發現
- [ ] 9.2 驗證 Requirement「Feature scope expansion beyond this change requires an explicit decision record」——在 proposal 或既有溝通紀錄中，明確請老闆對 Open Questions（Organization 多租戶、電子發票範圍、已封存 changes 與本次方向的關係）逐項給裁決，驗證方式：三項 Open Questions 都取得老闆明確回覆，並記錄於後續 change 或本 change 的補充註記中

## 10. Review

- [ ] 10.1 對第 2-6 節的程式碼變更跑一輪 correctness／security／performance 三角度 code review，由 agy 在自己的 worktree 獨立審查（不是 Cursor 自審自己的 diff，避免球員兼裁判），審查對象為合併後 Cursor 分支的完整 diff（`git diff --stat feature/extract-supastarter-design-system...HEAD`），須等分支合併、Cursor 完成 6.2/6.3/6.5、Codex 完成 i18n 補完後才進行，CR 報告存成 `docs/cr-report-extract-supastarter-design-system.md` 並 commit，驗證方式：Review 報告列出的 Critical 發現數為零，或所有 Critical 發現皆已修正（若時間內修不完，明確列進最終報告不可含糊帶過）
- [ ] 10.2 執行 `pnpm build` 與 `pnpm test` 全專案跑一次，驗證方式：兩個指令皆以 exit code 0 結束
- [ ] 10.3 用 ego-browser 對本機 apps/saas 首頁、登入頁、後台首頁三頁分別截圖，逐頁比對是否與 1.1-1.3 確認過的 demo 視覺一致，驗證方式：三張截圖存檔並附上與 demo 的比對結論
