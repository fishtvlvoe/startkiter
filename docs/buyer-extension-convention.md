# StartKiter 買家模組擴充慣例

本文件給買家自己的 AI 工具（Claude Code / Cursor）閱讀與執行。新增業務模組時，必須遵守以下規則，不得引入 runtime plugin 框架（如 cordis）。

關於 Core 邊界定義、直接修改 Core 的免責聲明與型別防護機制，請參閱 [`docs/core-boundary-and-extension-guide.md`](../docs/core-boundary-and-extension-guide.md)。

## 強制規則

1. **模組根目錄必須是 `packages/<name>/`**。不許放在 `apps/saas/` 裡，也不許放在倉庫根目錄。
2. **進入點檔案必須是 `packages/<name>/index.ts`**。所有公開 API 都從這裡重新匯出；不可把進入點放在 `src/index.ts`。
3. **必須建立 `packages/<name>/package.json`**，形狀參照 `packages/course/package.json`：
   - `"name"`: `"@startkiter/<name>"`
   - `"private"`: `true`
   - `"type"`: `"module"`
   - `"main"`: `"./index.ts"`
   - `"types"`: `"./**/*.ts"`
   - `"scripts"`: 至少有 `"test": "vitest run"`（若模組有自己的 Vitest 設定就加 `--config vitest.config.ts`）與 `"type-check": "tsc --noEmit"`
   - workspace 內部相依套件使用 `"workspace:*"`
   - 共用版本的套件使用 `"catalog:"`，不要在模組內重複寫死版本
4. **必須建立 `packages/<name>/tsconfig.json`**，extends 目標與 include/exclude 形狀參照目前的 `packages/course/tsconfig.json`：
   ~~~json
   {
     "extends": "@startkiter/tsconfig/base.json",
     "include": ["**/*.ts", "**/*.tsx"],
     "exclude": ["dist", "build", "node_modules"]
   }
   ~~~
5. **實作檔案可放在 `packages/<name>/src/`**。同目錄的測試檔名必須是 `<source>.test.ts`；模組對外入口固定留在模組根目錄的 `index.ts`。
6. **環境變數讀取規則**：
   - 模組內部函式必須把 `env` 當成可注入參數，預設值為 `process.env`，例如 `env: Record<string, string | undefined> = process.env`。
   - 讀取時必須先 `.trim()`，例如 `env.MY_VAR?.trim()`。
   - 可選變數缺值時必須優雅降級（回傳 `null` / `undefined` / 預設值），不可直接拋出錯誤。
   - 若變數是 URL，必須用 `new URL()` 解析並檢查 `protocol === "https:"`。
7. **對外匯出方式**：在根目錄 `index.ts` 裡用 `export { ... } from "./<file>"` 與 `export type { ... } from "./<file>"` 重新公開，不要讓外部直接 import 子路徑。
8. **新增模組後**，必須能在模組根目錄執行 `pnpm type-check` 與 `pnpm test` 且通過。

## 真實範例：packages/course

`packages/course` 是 StartKiter 倉庫內已存在的真實模組，必須直接參照它的結構與進入點內容。

- 進入點真實路徑：`packages/course/index.ts`
- 真實檔案內容摘錄（目前實際公開匯出）：

  ~~~ts
  export { canAccessCourse, canAccessCourseId } from "./access";
  export type {
    BundleCourseAccessReader,
    CourseAccessOrderRow,
    CourseAccessReader,
  } from "./access";
  export {
    getLesson,
    listLessons,
    toPublicLessonMeta,
  } from "./catalog";
  export type { LessonDetail, LessonSummary } from "./catalog";
  export { decideLessonPlayback } from "./playback";
  export type { PlaybackDecision } from "./playback";
  export {
    getLineCommunityInvite,
    resolveLineCommunityInviteUrl,
  } from "./line-invite";
  export type { LineInviteAccessReader, LineInviteResult } from "./line-invite";
  export {
    ConceptCompare,
    DialogueWindow,
    InstantQuiz,
    MicroSandbox,
    TeacherAvatar,
    TimelineSync,
    WebContainerSandbox,
    WorkflowSorter,
    isWorkflowOrderCorrect,
    moveWorkflowItem,
  } from "./src/components/interactive";
  export type {
    ConceptCompareProps,
    ConceptCompareTab,
    DialoguePrompt,
    DialogueWindowProps,
    InstantQuizProps,
    InstantQuizResult,
    MicroSandboxProps,
    SandboxControl,
    SandboxOption,
    SandboxValue,
    SandboxValues,
    TeacherAvatarProps,
    TeacherMood,
    TimelineSyncProps,
    WebContainerSandboxProps,
    WorkflowItem,
    WorkflowSorterProps,
    WorkflowSortResult,
  } from "./src/components/interactive";
  export { isTimeActive, parseTimecode, useTimeSync } from "./src/hooks/use-time-sync";
  export type { Timecode, TimeSyncOptions, TimeSyncState } from "./src/hooks/use-time-sync";
  export { LessonMdx } from "./src/mdx/LessonMdx";
  export type { LessonMdxProps } from "./src/mdx/LessonMdx";
  export { inspectMdxSource } from "./src/mdx/inspect-mdx-source";
  export type { MdxInspectResult } from "./src/mdx/inspect-mdx-source";
  export { extractLessonBlockIds } from "./src/mdx/extract-lesson-block-ids";
  export { FluentPlayer } from "./src/player/FluentPlayer";
  export type { FluentPlayerSource } from "./src/player/FluentPlayer";
  export { courseModuleDescriptor } from "./src/config/modules";
  export type {
    ModuleDescriptor,
    ModuleMountPoints,
    ModuleNavigation,
  } from "./src/config/modules";
  ~~~

- 環境變數讀取真實範例（`packages/course/src/line-invite.ts`）：

  ~~~ts
  export function resolveLineCommunityInviteUrl(
    env: Record<string, string | undefined> = process.env,
  ): string | null {
    const raw = env.LINE_COMMUNITY_INVITE_URL?.trim();
    if (!raw) {
      return null;
    }
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }
  ~~~

- `packages/course/package.json` 真實形狀摘錄：

  ~~~json
  {
    "name": "@startkiter/course",
    "version": "0.0.0",
    "main": "./index.ts",
    "types": "./**/*.ts",
    "private": true,
    "scripts": {
      "clean": "git clean -xdf .cache .turbo dist node_modules",
      "test": "vitest run --config vitest.config.ts",
      "type-check": "tsc --noEmit"
    },
    "dependencies": {
      "@webcontainer/api": "1.6.4",
      "@mdx-js/mdx": "catalog:",
      "@startkiter/payments": "workspace:*",
      "mdast-util-from-markdown": "2.0.3",
      "mdast-util-mdx": "3.0.0",
      "micromark-extension-mdxjs": "3.0.0",
      "react": "catalog:",
      "react-dom": "catalog:",
      "unist-util-visit": "5.1.0",
      "zod": "catalog:"
    },
    "devDependencies": {
      "@startkiter/tsconfig": "workspace:*",
      "@types/node": "catalog:",
      "@types/react": "catalog:",
      "@types/react-dom": "catalog:",
      "typescript": "catalog:",
      "vitest": "catalog:"
    }
  }
  ~~~

- `packages/course/tsconfig.json` 真實內容：

  ~~~json
  {
    "extends": "@startkiter/tsconfig/base.json",
    "include": ["**/*.ts", "**/*.tsx"],
    "exclude": ["dist", "build", "node_modules"]
  }
  ~~~

## 新增模組的操作清單

新增 `packages/newsletter` 這類模組時，依序執行：

1. 建立 `packages/newsletter/package.json`，`name` 設為 `"@startkiter/newsletter"`，使用 `main`、`types`、`scripts` 與 `catalog:`／`workspace:*` 版本慣例。
2. 建立 `packages/newsletter/tsconfig.json`，extends `@startkiter/tsconfig/base.json`，include `**/*.ts`／`**/*.tsx`。
3. 建立 `packages/newsletter/index.ts`，重新匯出模組對外 API；內部實作可放在 `packages/newsletter/src/`。
4. 在 `packages/newsletter/src/` 實作業務邏輯，每個 `.ts` 對應一個 `.test.ts`。
5. 若需要讀取環境變數，遵守本文件第 6 條規則：注入 `env`、`.trim()`、缺值優雅降級、URL 檢查 `https:`。
6. 執行驗證：
   - 在模組目錄執行 `pnpm type-check` 必須通過。
   - 在倉庫根目錄執行 `pnpm test` 必須通過（根目錄 Vitest 設定會自動發現新模組測試）。
7. 若 `apps/saas` 要使用此模組，在 `apps/saas/package.json` 的 `dependencies` 加入 `"@startkiter/newsletter": "workspace:*"`，然後 import `@startkiter/newsletter`。

▋ 側邊欄選單掛載（MOUNT_POINTS）

StartKiter 的側邊欄選單由 `packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 陣列驅動，NavBar 透過 `apps/saas/modules/shared/lib/nav-menu-items.ts` 的 `getMountMenuItems()` 自動渲染，禁止在 `NavBar.tsx` 硬編碼業務選單項目。

• 一級入口：在 `MOUNT_POINTS` 新增一筆 `PluginManifest`，設定 `mount.route.path`（頁面 URL）與 `mount.menu`（`label`、`icon`、`order`）。範例見同檔案的 `id: "chatbot"`。

• 子功能收攏：在 `mount.menu` 加上 `groupId`（例如 `"course-admin"`），`nav-menu-items.ts` 的 `MENU_GROUP_CONFIG` 會把同組項目合成一個帶 `subItems` 的父項，路由 URL 不變。課程模組現行子項：`course-admin`（課程管理）、`quiz`、`review`、`assignment`、`bundles`、`onboarding-surveys`、`media-library`、`course-pack-admin`。

• 父項權限：父項在 `MENU_GROUP_CONFIG` 標 `requiresOperator: true`；各子項 manifest 也各自保留 `requiresOperator: true`，頁面內 `isOperator` redirect 邏輯不動。

• 權限過濾：`getMountMenuItems({ isOperator, canAccessPagesCms })` 會隱藏 `requiresOperator: true` 的項目（學員看不到），`pages-cms` 另依 `canAccessPagesCms` 判斷。

• 高亮比對：用 `isMenuActive(pathname, href, allHrefs)`，以最長路徑前缀為準，避免 `/admin/course` 誤亮 `/admin/course-pack`。

真實範例（課程子功能 manifest，摘自 `packages/platform/src/mount-points.ts`）：

~~~ts
{
  id: "media-library",
  mount: {
    route: { path: "/admin/media" },
    menu: {
      label: "媒體庫",
      icon: "image",
      order: 11,
      requiresOperator: true,
      groupId: "course-admin",
    },
  },
}
~~~

分組邏輯真實路徑：`apps/saas/modules/shared/lib/nav-menu-items.ts`（`groupMountMenuItems`、`MENU_GROUP_CONFIG`）。巢狀展開 UI 複用 `apps/saas/modules/shared/components/NavBar.tsx` 的 `NavMenuList` `subItems` pattern（與 organization-settings 相同）。

## 禁止事項

- 禁止引入 cordis、unplugin、runtime plugin 載入器等框架。
- 禁止把模組進入點設成 `src/index.ts`、`src/index.tsx` 或其他非根目錄 `index.ts` 名稱。
- 禁止在模組內部直接拋出 `process.env.MY_VAR is undefined` 這類錯誤；本文件要求 fail-closed / graceful fallback。
- 禁止把新模組直接寫進 `apps/saas/app/` 而不先建立 `packages/<name>/`。
