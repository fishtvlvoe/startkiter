## Context

`rebuild-design-system-from-source`（已封存合併）解決了元件庫（Radix UI → Base UI）、CSS/token 架構、配色（olive）、字體（Inter）這幾項技術選型層面的落差，但範圍規劃時只根據讀官方開發文件發現的技術選型問題去列任務，沒有重新核對「產品架構」本身：官方 `vendor/supastarter-nextjs` 是 `apps/marketing`（公開網站）+ `apps/saas`（產品 app + 驗證流程）兩個獨立 Next.js app，StartKiter 卻把首頁等公開頁面塞進 `apps/saas` 裡，繼續在這個錯的檔案結構上做技術替換。結果配色/字體/元件庫換對了，但版面骨架（Logo 只有純文字沒有 icon、首頁瀏覽器窗格展示區塊是空的灰色方塊、登入卡片有邊框陰影而官方無邊框飄浮）仍然是舊 change 時代憑印象詮釋的樣貌。

更根本的問題：StartKiter 從未建立任何 git 層級的 upstream 追蹤。`vendor/supastarter-nextjs/` 是唯讀 clone 下來「參考用」的快照，不是正式 remote，官方每天都在更新（`CHANGELOG.md` 顯示幾乎逐日有 commit），StartKiter 沒有機制感知這些更新，每次「對照官方」都要重新手動 clone 比對。這正是本輪之前多次 bug 的根因：本機舊快照抄到過時的 `--radius` 值（0.75rem vs 官方最新 0.625rem）、`apps/saas` 從未真正安裝 Tailwind CSS 建置鏈（缺 `postcss.config`、缺 `tailwindcss` 依賴）。

已查證 StartKiter 現有業務邏輯 package 化程度高：`packages/auth`、`packages/payments`（含 PAYUNi provider，`checkout.ts`/`refund.ts`/`order.ts` 皆有對應 `.test.ts`）、`packages/course`（`access.ts`/`catalog.ts`/`playback.ts`/`line-invite.ts` 皆有測試）、`packages/github-kit`（`claim.ts`/`revoke.ts`/`config.ts` 皆有測試）各自有獨立 `index.ts` 公開介面，核心邏輯不依賴 UI 或 route。`apps/saas` 的 route handler 僅是接線層，例如 `apps/saas/app/api/checkout/route.ts` 只 `import { auth } from "@startkiter/auth"` 與 `import { ... } from "@startkiter/payments"`，不含商業邏輯本身。`packages/database/prisma/schema.prisma` 僅 137 行。這代表遷移到官方底座是「整包搬遷 package 目錄 + 在新底座 route 層重新接線 + 用既有測試驗證邏輯未壞」，不是重寫。

## Goals / Non-Goals

**Goals:**

- 建立正式的 git upstream 追蹤機制，讓官方後續更新可透過標準 git 操作拉取，不再依賴手動 clone 快照比對
- 官方底座（`apps/marketing` + `apps/saas` 的殼與元件層）100% 對齊官方原始碼，不憑印象詮釋
- StartKiter 既有業務邏輯（auth/payments/course/github-kit/database）在新底座上功能與現有測試結果完全一致，`openspec/specs/` 底下已封存的行為契約全部重新驗證通過
- 中文語系在乾淨底座上疊加，不影響底座本身與官方的一致性

**Non-Goals:**

- 不做 WordPress 式 Core/Theme/Plugin 架構、課程外掛模組（排入後續 change）
- 不改變商業規則本身，只搬遷技術實作位置
- 不在遷移完成驗證前刪除或覆蓋現有 repo
- 不修改 `vendor/supastarter-nextjs/` 來源本身

## Decisions

### 建立官方 upstream 追蹤：git remote，不用 submodule

在 StartKiter repo 內執行 `git remote add upstream https://github.com/supastarter/supastarter-nextjs.git`，把官方 repo 設為正式追蹤來源。之後官方更新透過 `git fetch upstream && git merge upstream/main`（或視衝突量改用 `git rebase`）拉取。

- **Alternatives Considered**：
  1. 用 git submodule 引用官方 repo（Fish 在 `fishtvlvoe/supastarter-platform` 專案採用的方式）— 否決，submodule 適合「官方程式碼作為唯讀子目錄嵌入」的情境，但 StartKiter 需要的是「以官方版本為基礎持續合併演進」，remote + merge 才能讓 StartKiter 自己的 commit 歷史與官方版本歷史交織在一起，衝突解決與後續追蹤更直接
  2. 繼續手動 clone 到 `vendor/` 定期比對（維持現況）— 否決，這正是本輪反覆出 bug 的根因，沒有 git 層級追蹤就無法保證比對的完整性，人工比對必然遺漏

### 官方底座建立方式：舊內容搬進 legacy/，新底座直接佔用正式路徑

現有 `apps/`、`packages/` 整個資料夾搬到 `legacy/apps/`、`legacy/packages/`（純檔案系統搬移，`git mv`，保留完整 git 歷史）。新底座用 `npx supastarter new` 或手動 clone 官方 repo，直接在正式路徑 `apps/`、`packages/` 建立一份完全乾淨的底座。這樣新舊內容不會在同一路徑下混雜，業務邏輯遷移階段是從 `legacy/packages/*` 複製到新建的 `packages/*`，不需要事後再把新底座從獨立目錄搬到正式路徑，少一道工序。底座建好、業務邏輯遷移完成、所有驗證通過後，`legacy/` 保留作為回滾參考與遺漏排查依據，確認穩定運作一段時間後才整個移除。

- **Alternatives Considered**：
  1. 在獨立目錄（例如 `_rebuild/`）建立新底座，驗證通過後再整個搬到正式路徑取代舊內容 — 否決：多一道「事後搬遷」工序，且這段期間正式路徑（`apps/`、`packages/`）仍是舊內容，容易讓人誤以為在改的是新底座、實際上改到舊路徑；`legacy/` 方案讓正式路徑從一開始就是新底座，心智負擔更低
  2. 直接在現有 `apps/saas` 目錄結構上繼續增修，逐步把官方缺的部分補齊（新增 `apps/marketing`、修正 i18n 等）— 否決，這正是前兩輪失敗的模式：在已知有問題的地基上局部修補，無法保證修補完整，且無法建立乾淨的 upstream 合併基礎（現有 repo 的 commit 歷史與官方版本歷史完全不同源，事後接 upstream 依然會全部衝突）
  3. 直接刪除現有 `apps/saas`、`apps/marketing`（尚不存在）重新來過，不保留回滾點 — 否決，違反「不可逆操作前先確認、保留回滾路徑」的原則，遷移驗證過程可能發現業務邏輯遺漏，需要能對照舊內容排查

### 業務邏輯遷移：整包搬遷 + 重新接線，不重寫

把 `packages/auth`、`packages/payments`、`packages/course`、`packages/github-kit`、`packages/database` 五個目錄完整複製到新底座對應位置，套件內部程式碼與測試檔案不修改。新底座的 route handler（`apps/saas/app/api/checkout/route.ts` 等）改為呼叫這些套件，取代官方預設的 Stripe/LemonSqueezy 等 provider 呼叫。

- **Alternatives Considered**：
  1. 參考官方 payments provider 介面重新設計 StartKiter 的 PAYUNi provider，讓它更貼近官方的 provider 抽象層 — 否決，本次 Non-Goals 明確排除重新設計商業邏輯；現有 PAYUNi provider 已有完整測試覆蓋且穩定運作，重新設計會引入不必要的行為變更風險，若未來要對齊官方 provider 抽象層，應該是獨立的、有明確理由的後續 change
  2. 只搬遷部分套件，其餘用官方原生功能取代（例如用官方 payments 抽象層接 PAYUNi）— 否決，官方 payments 抽象層預設支援的是 Stripe/LemonSqueezy/Creem/Polar/DodoPayments，沒有 PAYUNi，勉強套用官方抽象層去接 PAYUNi 是重新設計而非搬遷，違反本次「不重寫」的核心原則

### 資料庫 schema：合併官方預設 model 與 StartKiter 既有 model

新底座的 `packages/database/prisma/schema.prisma` 以官方預設 schema（User/Session/Account/Verification 等 Better Auth 標準 model）為基礎，把 StartKiter 既有 schema 裡 Order、Course 相關 model 併入，欄位命名衝突時保留 StartKiter 既有命名（因為業務邏輯程式碼已經依賴這些欄位名稱），migration history 在新底座重新產生（不延續舊 migration 檔案序列）。

- **Alternatives Considered**：
  1. 延續現有 migration 檔案序列，只新增官方需要的欄位 — 否決，新底座的 Prisma 版本、Better Auth 版本可能與現有 schema 產生時不同，延續舊 migration 序列容易在新環境套用時出現版本不相容錯誤，重新產生一次性 migration 更可控
  2. 完全採用官方 schema 命名慣例，修改 StartKiter 業務邏輯程式碼去配合 — 否決，這會擴大改動範圍到業務邏輯程式碼本身，違反本次「業務邏輯不重寫」的原則

### i18n：換成官方 next-intl，只多一個 zh-tw locale

`packages/i18n` 從 StartKiter 自製的訊息物件系統換成官方採用的 next-intl 架構，訊息內容包含既有的 zh-tw/zh-cn/en 三語系內容原樣搬遷，只是底層套件與呼叫方式改變。

- **Alternatives Considered**：
  1. 保留自製 i18n 系統，只是把它接到新底座上 — 否決，自製系統與官方元件（尤其 `HeroWireframe` 這類直接呼叫 `useTranslations`/`useFormatter` 的官方元件）介面不相容，繼續維持自製系統會讓每個從官方搬過來的元件都要额外做一層轉接，增加维护负担且偏離「底座 100% 對齊官方」的目標

## Implementation Contract

**Behavior**：

- 新底座的 `apps/marketing` 服務首頁、Blog、Changelog、Contact、Legal 等公開頁面；`apps/saas` 服務 login/signup 與已驗證使用者的後台功能（課程、結帳、GitHub kit 領取、帳號設定）
- 結帳流程（PAYUNi）、課程存取權限、GitHub kit 領取流程的可觀察行為與遷移前完全一致（金額 8800 TWD、fail-closed 未設定金流回 503、退款後資格取消等）
- 中文（zh-tw）為預設語系，zh-cn/en 為可切換語系，缺 key 時 fallback 到 zh-tw
- 首頁瀏覽器窗格、Logo、登入卡片等版面骨架與官方 `demo.supastarter.dev` 呈現的版面結構一致（度量標準：並排截圖比對，非僅色票/字體一致）

**Interface / data shape**：

- `packages/auth`、`packages/payments`、`packages/course`、`packages/github-kit` 對外的 `index.ts` 匯出簽名維持不變，新底座的呼叫端程式碼可以直接 import 使用
- `schema.prisma` 的 Order、Course 相關 model 欄位名稱維持不變；新增的官方標準 model（Session/Account/Verification 等）採官方預設命名
- `git remote -v` 必須顯示 `upstream` 指向 `https://github.com/supastarter/supastarter-nextjs.git`

**Failure modes**：

- Schema 合併若欄位型別衝突（例如官方與 StartKiter 對同名概念用不同型別），遷移必須中止並記錄衝突細節，不得靜默選邊，需要人工決策
- 任一已封存 Spectra spec 的行為契約在新底座上驗證失敗，視為阻斷性問題，不得跳過或標記為已知技術債繼續往下走
- 遷移過程中，現有 repo（舊底座）持續可用作為生產環境，不因為新底座在建置中而中斷服務

**Acceptance criteria**：

- `git remote -v` 顯示 `upstream` 已設定
- 新底座 `pnpm build`、`pnpm test` 皆 exit code 0
- `packages/auth`、`packages/payments`、`packages/course`、`packages/github-kit` 既有測試套件在新底座上原樣執行且全數通過
- `openspec/specs/payuni-checkout/`、`course-module/`、`github-kit-fulfillment/`、`auth-login/` 等已封存 capability 定義的每個 Scenario，在新底座上手動或自動驗證一次，結果與 spec 描述一致
- 用 ego-browser 對首頁、登入頁、後台首頁與 `demo.supastarter.dev` 對應頁面並排截圖，確認版面骨架（Logo icon、瀏覽器窗格內容、卡片邊框樣式）一致，不僅比對色票/字體
- 中文語系為預設，語系切換與 fallback 行為符合 `i18n-multilingual` capability 定義

**Scope boundaries**：In scope：upstream 追蹤設定、`apps/marketing`+`apps/saas` 官方底座安裝、五個業務邏輯 package 遷移、schema 合併、i18n 換成 next-intl。Out of scope：WordPress 式 Core/Theme/Plugin 架構、課程外掛模組、商業規則變更、生產環境正式切換的部署細節（另有 Migration Plan 但實際切換時機由 Fish 拍板）。

## Risks / Trade-offs

- [Risk] Schema 合併可能發生欄位衝突或型別不相容，若未在遷移早期發現，會在後續業務邏輯測試階段才爆出來，增加除錯成本 → Mitigation：Decisions 段落已明訂遷移策略（官方 model 為底、StartKiter 既有欄位命名優先），schema 合併完成後立即先跑 `pnpm --filter database generate` 與型別檢查，不等到完整測試套件才發現問題
- [Risk] 五個業務邏輯 package 遷移後，新底座 route handler 重新接線過程可能遺漏某個 route 或某個呼叫點，導致該功能在新底座上悄悄壞掉但沒有測試涵蓋到 → Mitigation：逐一核對現有 `apps/saas/app/api/**/route.ts` 與 `apps/saas/app/**/page.tsx` 清單，確保每個現存 route/page 在新底座都有對應項目，不是只搬套件不搬呼叫點
- [Risk] i18n 從自製系統換成 next-intl，訊息 key 結構可能不同，既有翻譯內容搬遷過程可能遺漏某些 key 導致頁面顯示原始 key 字串而非翻譯文字 → Mitigation：`i18n-multilingual` capability 的「Missing translation keys fall back to zh-TW」Requirement 已定義 fallback 行為，遷移後對每個既有頁面走一遍三語系人工核對，不只依賴自動化測試
- [Risk] 這是大範圍架構遷移，如果新底座建置與驗證的過程拖得很長，會有「新舊兩份 repo 同時要維護」的過渡期成本 → Mitigation：Migration Plan 明訂新底座在獨立目錄建置、不影響現有生產環境運作，過渡期只需觀察不需要雙向同步；且明訂驗收標準通過才切換，沒有「差不多就換」的模糊地帶

## Migration Plan

嚴格依照六個步驟推進，每步完成才進下一步，每步有獨立的完成判準：

1. **舊內容封存**：`git mv apps legacy/apps && git mv packages legacy/packages`（保留 git 歷史），commit。完成判準：正式路徑 `apps/`、`packages/` 已清空，`legacy/apps`、`legacy/packages` 內容與搬移前逐檔一致
2. **建立 upstream 追蹤**：在現有 repo 執行 `git remote add upstream`，驗證 `git fetch upstream` 成功抓到官方最新 commit。完成判準：`git remote -v` 顯示 upstream，`git log upstream/main -1` 可正常顯示官方最新 commit
3. **官方底座安裝**：在正式路徑 `apps/`、`packages/` 用官方安裝流程建立乾淨 monorepo，不夾帶 StartKiter 客製化。完成判準：`pnpm dev` 可正常啟動 `apps/marketing` 與 `apps/saas`，畫面與 `demo.supastarter.dev` 一致
4. **業務邏輯遷移**：五個 package 從 `legacy/packages/*` 整包複製到新建的 `packages/*` + route 層接線 + schema 合併。完成判準：既有測試套件在新底座全數通過，已封存 spec 逐一驗證通過，且用 `admin@startkiter.local` 測試帳密在新底座實際登入一次成功（不只是測試套件轉綠燈，是真的打開瀏覽器登入）
5. **中文語系**：換 next-intl，加 zh-tw locale。完成判準：三語系切換與 fallback 行為符合 `i18n-multilingual` capability
6. **驗收與切換時機**：全部驗證通過後，由 Fish 拍板正式上線的時機；`legacy/` 保留作為回滾參考與遺漏排查依據，確認新底座穩定運作一段時間後才整個移除

回滾策略：`legacy/apps`、`legacy/packages` 在切換後仍完整保留於同一 repo，若發現新底座有遺漏，可直接對照 `legacy/` 內容排查，不需要额外的備份步驟；确认稳定後才整個刪除 `legacy/`。

## Open Questions

- 新底座要放在同一個 repo 的獨立目錄/分支，還是另開一個全新 GitHub repo 再事後合併？兩種都能達成「不影響現有生產環境」的效果，但長期維護方式不同，需要 Fish 裁決
- Prisma migration history 重新產生後，正式切換時既有生產資料庫的資料要如何遷移到新的 migration 序列（是否需要資料匯出/匯入腳本）？這屬於正式切換階段的細節，本次不預先假設答案，留待切換時機明確後再規劃
