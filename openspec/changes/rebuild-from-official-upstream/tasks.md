## 1. 舊內容封存與 upstream 追蹤

- [x] 1.1 執行 `git mv apps legacy/apps && git mv packages legacy/packages` 並 commit，滿足 Decision「官方底座建立方式：舊內容搬進 legacy/，新底座直接佔用正式路徑」，驗證方式：`ls apps packages` 回報空或不存在，`diff -rq legacy/apps <搬移前備份>` 與 `diff -rq legacy/packages <搬移前備份>` 皆無差異
- [x] 1.2 執行 `git remote add upstream https://github.com/supastarter/supastarter-nextjs.git` 並 `git fetch upstream`，滿足 Decision「建立官方 upstream 追蹤：git remote，不用 submodule」，驗證方式：`git remote -v` 顯示 upstream 指向該網址，`git log upstream/main -1` 正常顯示官方最新 commit 訊息

## 2. 官方底座安裝：apps/marketing

- [x] 2.1 依 `docs/reference/supastarter-nextjs-docs/setup.mdx` 在正式路徑 `apps/marketing` 建立官方首頁（Hero/Features/Pricing/FAQ/Testimonials/CTA/Newsletter 全部區塊，含 `HeroWireframe` 瀏覽器窗格展示元件），滿足 Requirement「Monorepo shell boots locally」的 apps/marketing 服務公開頁面場景，驗證方式：`pnpm dev` 啟動後 GET / 回應 200，用 ego-browser 對首頁與 `demo.supastarter.dev` 首頁並排截圖，確認 Logo icon、瀏覽器窗格內容、CTA 按鈕樣式等版面骨架一致（非僅色票/字體比對）
- [x] 2.2 在 `apps/marketing` 建立 Blog、Changelog、Contact、Legal 頁面，驗證方式：GET /blog、/changelog、/contact、/legal 皆回應 200，畫面版面與官方對應頁面一致

## 3. 官方底座安裝：apps/saas 殼

- [x] 3.1 依開發文件在正式路徑 `apps/saas` 建立官方 login/signup 頁面（無邊框飄浮登入卡片，非白卡片+邊框陰影），滿足 Requirement「Monorepo shell boots locally」的 apps/saas 服務驗證流程場景，驗證方式：GET /login、/signup 回應 200，用 ego-browser 與 `demo.supastarter.dev` 對應頁面並排截圖確認卡片樣式一致
- [x] 3.2 建立官方後台殼（`apps/saas/app` 下的側欄導覽、`packages/ui`、`packages/tooling` Tailwind 主題），驗證方式：`pnpm build` exit code 0，`pnpm --filter @startkiter/ui test` 全數通過

## 4. 業務邏輯遷移：auth

- [x] 4.1 從 `legacy/packages/auth` 複製到新建的 `packages/auth`，在新底座 `apps/saas` 重新接線 Better Auth provider（email/password + Google + LINE socialProviders.line），滿足 Decision「業務邏輯遷移：整包搬遷 + 重新接線，不重寫」，驗證方式：`legacy/packages/auth/src/auth.test.ts` 對應測試在新底座執行全部通過
- [x] 4.2 用 `admin@startkiter.local` / `StartKiter2026!` 測試帳密在新底座實際登入一次，滿足 Migration Plan 第 4 步的登入驗收判準，驗證方式：用 ego-browser 完成登入操作並截圖確認導向已驗證後台頁面

## 5. 業務邏輯遷移：payments

- [x] 5.1 從 `legacy/packages/payments` 複製到新建的 `packages/payments`，在新底座 `apps/saas/app/api/checkout/route.ts` 等 route 重新接線 PAYUNi provider，驗證方式：`legacy/packages/payments/src/*.test.ts`（checkout/refund/order/credentials/crypto/factory/notify/session-failclosed）對應測試在新底座執行全部通過
- [x] 5.2 對照 `openspec/specs/payuni-checkout/spec.md` 逐一驗證每個 Scenario 在新底座上成立，驗證方式：產出驗證記錄（每個 Scenario 對應的測試結果或手動驗證結論），全部標記通過

## 6. 業務邏輯遷移：course

- [x] 6.1 從 `legacy/packages/course` 複製到新建的 `packages/course`，在新底座重新接線課程相關頁面與 route，驗證方式：`legacy/packages/course/src/*.test.ts`（access/catalog/playback/line-invite）對應測試在新底座執行全部通過
- [x] 6.2 對照 `openspec/specs/course-module/spec.md`、`course-media-playback/spec.md` 逐一驗證每個 Scenario，驗證方式：產出驗證記錄，全部標記通過

## 7. 業務邏輯遷移：github-kit

- [x] 7.1 從 `legacy/packages/github-kit` 複製到新建的 `packages/github-kit`，在新底座重新接線 claim/revoke route，驗證方式：`legacy/packages/github-kit/src/*.test.ts`（claim/revoke/config）對應測試在新底座執行全部通過
- [x] 7.2 對照 `openspec/specs/github-kit-fulfillment/spec.md` 逐一驗證每個 Scenario，驗證方式：產出驗證記錄，全部標記通過

## 8. 業務邏輯遷移：database

- [x] 8.1 把 `legacy/packages/database/prisma/schema.prisma` 的 Order、Course 相關 model 併入新底座 schema（官方 User/Session/Account/Verification 等標準 model 為底，欄位命名衝突時保留 StartKiter 既有命名），滿足 Decision「資料庫 schema：合併官方預設 model 與 StartKiter 既有 model」，驗證方式：`pnpm --filter database generate` 成功執行，`pnpm --filter @startkiter/saas type-check` 通過
- [x] 8.2 在新底座重新產生 migration history，驗證方式：`pnpm --filter database push` 成功套用到測試資料庫，不報 schema 衝突錯誤

## 9. 中文語系

- [ ] 9.1 依 Decision「i18n：換成官方 next-intl，只多一個 zh-tw locale」，把 `packages/i18n` 換成 next-intl 架構，把既有 zh-tw/zh-cn/en 三語系訊息內容原樣搬遷，滿足 `i18n-multilingual` capability「At least three locales are supported at launch」要求的 next-intl 架構，驗證方式：GET /zh-tw、/zh-cn、/en 皆回應 200 且頁面文字為對應語言
- [ ] 9.2 驗證缺 key 時 fallback 到 zh-tw 的行為，滿足 Requirement「Missing translation keys fall back to zh-TW」，驗證方式：對一個刻意在 en catalog 缺漏但 zh-TW catalog 存在的 key，斷言渲染結果為 zh-TW 文字而非原始 key 字串

## 10. Review 與最終驗收

- [ ] 10.1 對第 1-9 節的變更跑一輪 correctness／security／performance 三角度 code review，涵蓋 schema 合併是否有欄位型別衝突、route 接線是否有遺漏、業務邏輯搬遷過程是否引入行為變更，驗證方式：Review 報告列出的 Critical 發現數為零，報告存成 `docs/cr-report-rebuild-from-official-upstream.md` 並 commit
- [ ] 10.2 執行 `pnpm build` 與 `pnpm test` 全專案，驗證方式：兩個指令皆以 exit code 0 結束
- [ ] 10.3 用 ego-browser 對首頁、登入頁、後台首頁、課程頁、checkout 頁分別與 `demo.supastarter.dev` 對應頁面並排截圖，確認版面骨架（Logo icon、瀏覽器窗格內容、卡片邊框樣式）與官方一致，驗證方式：截圖存於 `docs/verification/rebuild-from-official-upstream/` 並附比對結論
