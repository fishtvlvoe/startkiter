# Code Review 報告：extract-supastarter-design-system (tasks.md 10.1)

- **審查目標**：`fishtvlvoe/apply-extract-supastarter-design-system`（相對於 `feature/extract-supastarter-design-system`）
- **審查範圍**：tasks.md 第 2-6 節對應的程式碼變更（`packages/ui`、`packages/i18n`、`apps/saas/app` 下的頁面與元件、`globals.css`、`design-system.css` 等）
- **審查維度**：正確性 (Correctness)、安全性 (Security)、效能 (Performance)

---

## ▋ 審查結果摘要

| 等級 | 數量 | 說明 |
| :--- | :---: | :--- |
| **Critical** | **0** | 無阻塞性崩潰、安全漏洞或資料損毀問題 |
| **Warning** | **2** | 測試包含本機寫死絕對路徑、AppShell 側欄選單權限與導向問題 |
| **Info** | **2** | 課程觀看進度假資料佔位、英文語系 catalog 缺 key（依設計 fallback） |

---

## ▋ 詳細發現清單

### 1. [Warning] 單元測試硬編碼本機絕對路徑 `SOURCE_ROOT` (Correctness / CI 可移植性)

- **檔案與行號**：
  - [`packages/ui/src/version-gap.test.ts:9`](../packages/ui/src/version-gap.test.ts#L9)
  - [`apps/saas/lib/design-tokens.test.ts:9`](../apps/saas/lib/design-tokens.test.ts#L9)
- **問題描述**：
  測試程式碼中寫死了本地開發目錄路徑：
  ```typescript
  const SOURCE_ROOT = process.env.SUPASTARTER_SOURCE_PATH;
  ```
當在 CI/CD 環境（如 GitHub Actions、Vercel 預覽建置、Docker 容器）或其他協作者的電腦上執行 `pnpm test` 時，若沒有設定該環境變數，測試會拋出 `ENOENT` 或 `expect(existsSync(SOURCE_ROOT)).toBe(true)` 斷言失敗。
- **改善建議**：
  建議改為讀取環境變數（如 `process.env.SUPASTARTER_SOURCE_PATH`），或在路徑不存在時使用 `it.skipIf(!existsSync(SOURCE_ROOT))` 優雅略過該比對測試。

---

### 2. [Warning] `AppShell` 側欄選單未判斷管理員權限且連結至 `/admin/settings` (Correctness / UX)

- **檔案與行號**：
  - [`apps/saas/app/components/app-shell.tsx:78-83`](../apps/saas/app/components/app-shell.tsx#L78-L83)
- **問題描述**：
  `AppShell` 側邊欄將所有使用者都顯示「⚙ 帳號設定」，但其 `href` 指向 `/admin/settings`（營運者金流設定）：
  ```tsx
  <Link href="/admin/settings" aria-current={current === "settings" ? "page" : undefined} aria-label="帳號設定">
      <span className="nav-icon" aria-hidden="true">⚙</span>
      <span className="nav-label">帳號設定</span>
  </Link>
  ```
  雖然 `/admin/settings` 頁面伺服器端有 `isOperator` 防護（非管理員會被重導向回 `/app`），但普通學員點擊後會發現無效跳轉，造成困惑，且「營運者金流設定」與「帳號設定」名稱不符。
- **改善建議**：
  比照 `SiteNav` 的做法，透過 `showSettings` prop 控制僅對管理者顯示該項目，或將連結改為未來的個人帳號頁。

---

### 3. [Info] 課程進度文案為靜態假資料佔位 (Correctness / Scope Boundary)

- **檔案與行號**：
  - [`apps/saas/app/course/page.tsx:52`](../apps/saas/app/course/page.tsx#L52)
  - [`apps/saas/app/course/[lessonId]/page.tsx:85`](../apps/saas/app/course/[lessonId]/page.tsx#L85)
  - [`apps/saas/app/course/course-workspace.tsx:51-56`](../apps/saas/app/course/course-workspace.tsx#L51-L56)
- **說明**：
  目前頁面中的「進度 1 / 3」、「1 / 3 已看完」為硬編碼字串，符合本次 change 作為 UI 骨架與 Demo-first 移植的階段性目標，後續 change 接上真實進度 API 時需替換。

---

### 4. [Info] 英文語系 catalog 缺少 `home.hero.title`（依設計 fallback） (Correctness)

- **檔案與行號**：
  - [`packages/i18n/src/translations/en/marketing.json`](../packages/i18n/src/translations/en/marketing.json)
- **說明**：
  `en/marketing.json` 刻意缺漏 `home.hero.title` 用於驗證 fallback 機制（成功 fallback 至 `zh-tw` 繁中）。若未來需支援純英文完整首頁，需補齊該 key。

---

## ▋ 安全性查核項目 (Security Checklist)

- [x] **動態 import 注入防護**：`packages/i18n/src/lib/get-messages.ts` 透過 `isLocale` 白名單限制輸入語系，動態 import 無路徑遍歷（Path Traversal）風險。
- [x] **開放重導向 (Open Redirect) 防護**：`apps/saas/app/login/login-form.tsx` 的 `safeNextPath` 經過協議、斜線、特殊字元、Origin 多重過濾，防護嚴密。
- [x] **XSS & HTML 注入防護**：無 `dangerouslySetInnerHTML`，所有 i18n 訊息與使用者資料均經 React 轉義輸出。
- [x] **敏感機密外洩防護**：無硬編碼 API Key 或 Secret。

---

## ▋ 效能與架構查核項目 (Performance & Architecture)

- [x] **Hydration 穩定性**：`ColorModeToggle` 與 `AppShell` 在 `useEffect` 內載入 localStorage/theme 狀態，`layout.tsx` 加上 `suppressHydrationWarning`，無 SSR/Client 不匹配問題。
- [x] **樣式打包**：`design-system.css` 透過 `globals.css` 單一入口引入，CSS Token 分層清晰。
- [x] **組件相依**：僅依賴 `lucide-react`、`radix-ui`、`next-themes`、`class-variance-authority`，未引進肥大相依套件。
