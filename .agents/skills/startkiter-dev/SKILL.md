---
name: startkiter-dev
description: 引導 StartKiter 買家依照模組慣例，用 AI 新增一個功能。當使用者說「照 StartKiter 慣例加一個 X 功能」或描述要在買家代碼包中新增模組時觸發。
---

# StartKiter 買家開發引導

當使用者說「照 StartKiter 慣例加一個 X 功能」時，啟用本 Skill。把 X 當成一個候選業務模組，先查現有 `packages/`，再產出可驗證的最小變更。這份 Skill 合併了：

- `docs/startkiter-development-sop.md`：團隊五階段流程與買家簡化四步驟
- `docs/buyer-extension-convention.md`：模組目錄、入口、套件與環境變數硬規則
- `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`：小白情境、可直接貼給 AI 的提問方式與預期結果

## 白話步驟：給買家看

把 AI 當成一起工作的工程師。你不用先懂整個專案，只要把「想做什麼」講清楚，並要求它照下面四步走。

### 1. 先查有沒有現成的

先翻 `packages/`，找功能相近的模組。能沿用就沿用，不要先複製一份新代碼。AI 必須先回報找到的相關檔案、可重用的部分，以及為什麼需要新增或修改模組。

### 2. 照擴充慣例新增模組

新功能放在獨立的 `packages/<name>/`。模組根目錄有 `index.ts`、`package.json`、`tsconfig.json`；內部實作與測試可放在 `src/`。對外只從根目錄 `index.ts` 匯出。

### 3. 寫清楚功能要做什麼

請 AI 先寫一小段行為說明：使用者會做什麼、畫面或 API 會出現什麼結果、怎麼知道做對了。小功能不需要先寫完整規格，但不能只說「把電子報做出來」而沒有可觀察的結果。

### 4. 驗證

在模組目錄跑 `pnpm type-check` 與 `pnpm test`，再回到倉庫根目錄跑整體測試。AI 必須貼出實際結果；只說「應該可以」不算完成。若是 UI，再用真實瀏覽器把相關頁面、表單、跳轉點過一次。

## 情境範例：我想加一個電子報訂閱功能

你可以直接對 AI 說：

> 照 StartKiter 慣例加一個電子報訂閱功能。先查 `packages/` 有沒有可重用的通知或會員資料模組，再提出最小變更；新增模組時遵守 `packages/<name>/index.ts` 入口、`main`／`types`／`catalog:` 套件版本、`@startkiter/tsconfig/base.json` 與可注入 `env` 的規則。先寫會失敗的測試，跑到紅燈後再實作，最後貼出 type-check、test 與行為驗證結果。

AI 應先回報查找結果，再規劃最小的 `packages/newsletter/`，形狀至少如下：

~~~text
packages/newsletter/
├── index.ts
├── package.json
├── tsconfig.json
└── src/
    ├── subscribe.ts
    └── subscribe.test.ts
~~~

入口應是 `packages/newsletter/index.ts`，不是 `packages/newsletter/src/index.ts`。`package.json` 與 `tsconfig.json` 的形狀應跟實際 `packages/course` 一致：

~~~json
// package.json（相關欄位）
{
  "name": "@startkiter/newsletter",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./**/*.ts",
  "scripts": {
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@startkiter/<existing-package>": "workspace:*"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
~~~

~~~json
// tsconfig.json
{
  "extends": "@startkiter/tsconfig/base.json",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["dist", "build", "node_modules"]
}
~~~

這個例子只示範模組形狀，不代表已經決定電子報的供應商、資料模型或寄信流程。那些需求要先查現有代碼並寫成可驗證的行為；不要自行接外部帳號或把未裁決的商業功能塞進模組。

## 技術規則：給 AI 工具看

### 模組邊界與入口

- 模組根目錄固定為 `packages/<name>/`，不可直接把新業務寫進 `apps/saas/app/`。
- 對外入口固定為 `packages/<name>/index.ts`。所有公開 API 在這裡重新匯出；外部不可 import 子路徑。
- 內部實作可放在 `packages/<name>/src/`，測試放在同目錄並命名為 `<source>.test.ts`。
- 若 `apps/saas` 使用該模組，才在 `apps/saas/package.json` 加入 `"@startkiter/<name>": "workspace:*"`，並從套件名稱 import。
- 禁止 cordis、unplugin、runtime plugin loader 等框架；StartKiter 的模組是明確匯入的 package，不是執行期掃描載入。

### `package.json` 與 `tsconfig.json`

新 package 必須有：

~~~json
{
  "name": "@startkiter/<name>",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./**/*.ts",
  "scripts": {
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  }
}
~~~

workspace 內部相依套件用 `"workspace:*"`；共用 catalog 版本用 `"catalog:"`。不要改用 `exports: { ".": "./src/index.ts" }`，也不要寫死本來應由 catalog 管理的版本。

`tsconfig.json` 使用：

~~~json
{
  "extends": "@startkiter/tsconfig/base.json",
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["dist", "build", "node_modules"]
}
~~~

### 環境變數

函式把環境當成可注入參數，預設才使用 `process.env`：

~~~ts
export function resolveExampleUrl(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const raw = env.EXAMPLE_URL?.trim();
  if (!raw) {
    return null;
  }
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
~~~

讀取規則固定是：先 `.trim()`；可選值缺少時優雅降級；URL 用 `new URL()` 解析並只接受 `https:`；不可把 secret 寫進文件、測試輸出或版控；不可因缺少可選變數直接拋出 `process.env.X is undefined`。

### StartKiter 五階段流程

團隊與 AI 工具處理非單行 hotfix 的功能變更時，走：

~~~text
discuss（可省）→ propose → apply → review → archive
~~~

- `discuss`：需求不清楚時收斂，先掃現有代碼並採 reuse-first。
- `propose`：產出 proposal、design、specs、tasks；先過 `spectra analyze`，再過 `spectra validate`。
- `apply`：先寫會失敗的測試，確認紅燈後才寫實作；UI 變更先做可確認的 demo。
- `review`：檢查 correctness、security、performance；Critical 必須為零。功能完成後用真實瀏覽器點過相關頁面與互動。
- `archive`：測試、type-check、build 與 Spectra 驗證全過，所有 task 勾選後才封存。

如果需求已經清楚，`discuss` 可省略；其餘階段不可跳過。每個結論都要有實際測試或行為證據，不用「應該可以」代替。

## 參照來源

本 Skill 的規則來源是：

- `docs/startkiter-development-sop.md`
- `docs/buyer-extension-convention.md`
- `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`

若本 Skill 與目前代碼不一致，先讀 `packages/course/index.ts`、`packages/course/package.json`、`packages/course/tsconfig.json` 和上述慣例文件，再提出修正；不要自行發明另一套 package 形狀。
