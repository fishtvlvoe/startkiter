# StartKiter UI/UX 實體程式碼結構深度分析報告（供 BNI-AI 參考）

> **審計日期**：2026-09-08  
> **目標對象**：老魚 (Fish)  
> **目的**：深入解構 StartKiter 現有 UI/UX 程式碼真實架構，為新產品 **BNI-AI**（LINE 個人訂閱 SaaS）後台 Dashboard 提供最真實、不被過期官方文件誤導的技術選型與重用依據。  
> **審查原則**：**代碼真實性優先（Code-First Truth）**。以實際 `package.json`、import、元件實作為唯一標準，無視官方過期文件。

---

## 1. 元件庫與樣式系統真相

### 1.1 UI 原語不是 Radix UI，是 MUI 最新 `@base-ui/react`
- **依賴證據**：
  - `pnpm-workspace.yaml` (L30): `"@base-ui/react": ^1.7.0`
  - `packages/ui/package.json` (L12): `"@base-ui/react": "catalog:"`
  - 全專案搜尋 `@radix-ui`：**0 筆相符**。Radix UI 已被徹底抽換乾淨。
- **封裝模式**：
  - **外殼與 API 沿用 shadcn/ui 規範**：`packages/ui/components.json` 指向 shadcn schema，目錄結構保持 `components/*.tsx`。
  - **底層無頭原語（Headless Primitive）全面改用 `@base-ui/react`**：
    - `packages/ui/components/dialog.tsx`: `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";`
    - `packages/ui/components/dropdown-menu.tsx`: `import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";`
    - `packages/ui/components/select.tsx`: `import { Select as SelectPrimitive } from "@base-ui/react/select";`
    - `packages/ui/components/sheet.tsx`: `import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";`
    - `packages/ui/components/popover.tsx`: `import { Popover as PopoverPrimitive } from "@base-ui/react/popover";`
    - `packages/ui/components/tooltip.tsx`: `import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";`
    - `packages/ui/components/tabs.tsx`: `import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";`
    - `packages/ui/components/switch.tsx`: `import { Switch as SwitchPrimitive } from "@base-ui/react/switch";`
    - `packages/ui/components/accordion.tsx`: `import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";`
    - `packages/ui/components/alert-dialog.tsx`: `import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";`
  - **純展示/樣式元件**：
    - `Button`, `Table`, `Card`, `Badge`, `Input`, `Label`, `Skeleton` 等採用原生 HTML + `class-variance-authority` (cva) + `tailwind-merge`。
    - 特別注意：`packages/ui/components/button.tsx` 支援 Base UI 風格的 `render` prop，替代了傳統 Radix 的 `asChild`。

### 1.2 Tailwind 主題設定實際檔案位置與內容
- **檔案路徑**：`tooling/tailwind/theme.css`（官方文件說的 `packages/tooling/tailwind/theme.css` 在實際結構中是根目錄下的 `tooling/tailwind/theme.css`）。
- **架構機制**：採用 **Tailwind CSS v4** 原生語法（`@theme`、`@layer base`），由 `apps/saas/app/globals.css` 直接 `@import "@startkiter/tailwind-config/theme.css";` 引入。
- **色彩真相**：**明確使用 Olive（橄欖綠）** 色系，並帶有一組高飽和綠色點綴色：
  ```css
  /* tooling/tailwind/theme.css */
  :root {
    --border: var(--color-olive-200);
    --input: var(--color-olive-200);
    --ring: var(--color-olive-400);
    --background: var(--color-olive-50);
    --foreground: var(--color-olive-950);
    --primary: var(--color-olive-950);
    --primary-foreground: var(--color-olive-50);
    --secondary: var(--color-olive-100);
    --secondary-foreground: var(--color-olive-900);
    --muted: var(--color-olive-100);
    --muted-foreground: var(--color-olive-600);
    --touch: oklch(0.51 0.12 128); /* 品牌亮綠點綴色 */
  }
  ```
  同時 `packages/ui/components.json` 亦標註 `"baseColor": "olive"`。

### 1.3 暗色模式 (Dark Mode) 支援機制
- **實作架構**：
  - 由 `next-themes` 驅動，在 `apps/saas/app/layout.tsx` (L40-L46) 中以 `<ThemeProvider attribute="class" defaultTheme={config.defaultTheme} themes={["light", "dark"]}>` 包裹全域。
  - 切換時在 `<html>` 標籤添加 `class="dark"`。
  - 主題色變數在 `tooling/tailwind/theme.css` (L31-L57) 的 `.dark { ... }` 區塊覆蓋：
    - `--background: var(--color-olive-950);`
    - `--foreground: var(--color-olive-50);`
    - `--card: var(--color-olive-900);`
  - 切換 UI：提供 `packages/ui/components/color-mode-toggle.tsx`，支援 Light / Dark / System 三態滑動動畫切換。
- **後台外殼特例**：
  - 現有後台外殼（NavBar 與 Sidebar）採取 WordPress 式固定深色配置（`#1d2327`）。
  - 主內容區主背景在 `apps/saas/modules/shared/components/AppWrapper.tsx` (L21) 寫為 `bg-[#f0f0f1] dark:bg-background`（淺色是 WordPress 灰，深色切回 Tailwind dark 變數）。

---

## 2. Dashboard／後台頁面現有結構

### 2.1 頁面版型與外殼檔案路徑
- **登入後根佈局**：
  - `apps/saas/app/(authenticated)/layout.tsx`：提供 SessionProvider、ActiveOrganizationProvider、PermixProvider、PagesCmsAccessProvider 等全域 Context。
- **個人主控台主入口**：
  - 佈局：`apps/saas/app/(authenticated)/(main)/(account)/layout.tsx`
  - 核心外殼容器：`apps/saas/modules/shared/components/AppWrapper.tsx`
  - 整合導覽列（頂部列 + 側邊欄 + 響應式底欄）：`apps/saas/modules/shared/components/NavBar.tsx` (1165 行大元件)
  - 頁面標題列：`apps/saas/modules/shared/components/PageHeader.tsx`
  - 設定頁選單列：`apps/saas/modules/settings/components/SettingsMenu.tsx`

### 2.2 Sidebar 導覽組成方式（動態掛載 + 權限過濾 + 拖曳排序）
StartKiter 的 Sidebar **不是寫死陣列，而是基於 Mount Points 的動態可擴充系統**：
1. **SSOT 掛載點宣告**：`packages/platform/src/mount-points.ts` 的 `MOUNT_POINTS` 陣列定義所有系統與外掛模組的掛載入口。
2. **動態權限過濾**：`apps/saas/modules/shared/lib/nav-menu-items.ts` 的 `getMountMenuItems()`：
   - 根據 `isOperator`（`permix.hasPermission("admin")`）過濾管理員專屬項目（如課程管理、測驗管理、用戶列表）。
   - 根據 `canAccessPagesCmsAdmin` 過濾 CMS 模組。
   - 動態群組折疊（例如 `groupId: "course-admin"` 自動收攏在課程選單下）。
3. **後台拖曳自訂分組 (Dnd Groups)**：
   - `NavBar.tsx` 實作了 `SidebarGroupedNav`，在管理員模式下支援新增自訂群組、拖曳調整選單順序，並透過 `/api/sidebar-layout` (`useSaveSidebarLayout`) 將排版持久化儲存。
4. **外觀特色**：預設為 WordPress 經典灰黑樣式（頂部 32px Bar、側邊欄寬 280px、活動項目為 `#2271b1` 藍色高亮；支援拖曳邊緣或點擊按鈕折疊為 56px 圖示迷你側邊欄）。

### 2.3 現成「表格列表頁」元件模式（可 100% 複製）
專案已有極為成熟的 DataTable 實作範例：`apps/saas/modules/admin/component/users/UserList.tsx`。

**技術棧與元件組合架構**：
- **表格核心**：`@tanstack/react-table`（`useTable`, `flexRender`, `ColumnDef`, `manualPaginationTableFeatures`）。
- **URL 狀態同步（搜尋與分頁）**：`nuqs`（`useQueryState`, `parseAsInteger`, `parseAsString`），搜尋詞與頁數直接反映在網址上，重整頁面不丟失。
- **搜尋防抖**：`usehooks-ts` 的 `useDebounceValue`。
- **UI 元件配合**：
  - `@startkiter/ui/components/table`（`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`）
  - `@startkiter/ui/components/input`（搜尋框）
  - `@startkiter/ui/components/badge`（狀態標籤：success / warning / error / info）
  - `@startkiter/ui/components/dropdown-menu`（每一列尾端的「...」Actions 操作選單）
  - `apps/saas/modules/shared/components/Pagination.tsx`（頁碼、上下頁按鈕）
  - 骨架屏載入：`Skeleton`。

### 2.4 現成「設定頁／表單頁」版型模式
專案採用統一的四層式佈局模式：
1. **頂部標題**：`<PageHeader title="..." subtitle="..." />`。
2. **導覽切換**：`<SettingsMenu menuItems={...} />`（水平底線 Tab，自動對應當前 pathname）。
3. **列表容器**：`<SettingsList>`（縱向 `flex flex-col gap-6`）。
4. **雙欄卡片**：`apps/saas/modules/shared/components/SettingsItem.tsx`：
   - 響應式雙欄佈局：左側 1/3 寬度放置標題與說明文字，右側 2/3 放置包含表單的 `<Card>`。
- **表單驗證標準**：全面使用 `react-hook-form` + `zod` (`@hookform/resolvers/zod`)，搭配 `@startkiter/ui/components/form`（自動處理 Label、Error message 與 Accessibility）。
- **現成範例**：
  - `ChangeNameForm.tsx`（基本文字輸入 + 提交狀態）
  - `ChangePassword.tsx`（密碼強度驗證）
  - `NotificationPreferencesForm.tsx`（多個 Switch 開關群組）

---

## 3. Organizations（多租戶）相關 UI 現狀與個人訂閱 (BNI-AI) 取捨

### 3.1 組織多租戶現狀：代碼保留但已「全域軟停用 (Soft-disabled)」
雖然在目錄下依然能找到組織相關代碼（`apps/saas/modules/organizations/components/` 留有 16 個元件，且保留 `[organizationSlug]` 路由），但在系統設定與執行期**已被徹底關閉**：
1. **認證配置**：`packages/auth/config.ts` (L14-L18)：
   ```ts
   organizations: {
     enable: true,
     hideOrganization: true,        // 關鍵：全站 UI 隱藏組織切換器
     enableUsersToCreateOrganizations: true,
     requireOrganization: false,    // 關鍵：用戶登入不強制關聯組織
   }
   ```
2. **帳單配置**：`packages/payments/config.ts` (L4)：
   ```ts
   billingAttachedTo: "user",        // 關鍵：金流與訂閱直接綁定在個人 user 上
   ```
3. **NavBar 與頁面隱藏**：`NavBar.tsx` (L994) 與 `(account)/page.tsx` (L45) 均加上了 `!authConfig.organizations.hideOrganization` 判斷，因此在介面上完全看不到組織切換下拉框或組織列表卡片。

### 3.2 針對「個人訂閱制 (BNI-AI)」的沿用與切除清單

| 模組 / 元件 | BNI-AI 適用性 | 處理方式 |
|---|---|---|
| **個人帳單與訂閱管理**<br>`settings/billing/page.tsx` | **100% 沿用** | 包含 `<ActivePlan>`、`<ChangePlan>`、取消訂閱清單。原本就是直接查 `userId: session.user.id`，完全不依賴 Organization。 |
| **個人帳戶設定**<br>(`/settings/general`) | **100% 沿用** | 姓名、Email、大頭貼圖片裁剪上傳、介面語言設定、刪除帳號。 |
| **個人安全設定**<br>(`/settings/security`) | **100% 沿用** | 密碼變更、Passkeys 登入、2FA 雙重驗證開關、活動中的登入裝置 Session 管理。 |
| **通知偏好設定**<br>(`/settings/notifications`) | **100% 沿用** | 各類 Email/LINE 系統通知觸發開關。 |
| **主控台版型外殼**<br>(`AppWrapper` + `(account)/page.tsx`) | **100% 沿用** | 個人 Dashboard 根版型。 |
| **組織切換下拉 (`OrganizationSelect`)** | **完全用不上** | 保持隱藏（`hideOrganization: true`）。 |
| **成員邀請與權限管理**<br>(`InviteMemberForm`, `OrganizationMembersList`) | **完全用不上** | 略過不用，不需要建置邀請流程。 |
| **組織級路由與設定**<br>(`[organizationSlug]/*`, `new-organization`) | **完全用不上** | 路由略過不訪問，不需要建立此路徑。 |

---

## 4. 跟三個外部參考網站的比對（拼裝能力與缺口審查）

### 4.1 參考對照基準
- **hyperagent.com**：左側固定 Sidebar（可折疊 Agents 與 Resources 清單）+ 主內容區（聊天/對話框 + Featured 卡片牆）。
- **console.x.ai**：左側 Sidebar 分兩組（General vs API）+ 主內容區「搜尋列 + 建立按鈕 + Table 列表（帶 Updated / Actions）+ 底部快速範本卡片列」。
- **app-demo.supastarter.dev**：多標籤登入頁（Password / Magic link）、OAuth 第三方登入、右上角主題切換。

### 4.2 StartKiter 現有元件庫能否直接組出「console.x.ai」型態？
**答案：可以，約 85% 現成元件可直接組裝，架構無縫相容。**

具體拼裝路徑：
1. **Sidebar 分組導覽**：
   - 使用現有 `NavBar.tsx` 中的 `SidebarGroupedNav` 機制。
   - 已經支援群組分類標題（如 "GENERAL"、"API"）、圖示、可收折、活動高亮。
   - **需調整點**：拔除 WordPress 的硬編碼深黑底色（`#1d2327`）與選中藍色（`#2271b1`），改為純 Tailwind 變數（如 `bg-card`、`border-r`），即可瞬間呈現現代簡潔 AI Console 質感。
2. **頂部搜尋列 + 建立按鈕**：
   - 組合 `@startkiter/ui/components/input` (`type="search"`) + `button` (`variant="primary"`) + `@startkiter/ui/components/dialog`。
3. **Table 列表（Agent / Updated / Actions / Badge）**：
   - 直接套用 `UserList.tsx` 的成熟模式：
     - `@tanstack/react-table` 定義欄位與排序。
     - `@startkiter/ui/components/table` 渲染表格。
     - `@startkiter/ui/components/badge` 渲染狀態（如 Active/Inactive/Failed）。
     - `@startkiter/ui/components/dropdown-menu` 渲染右側三點選單（Edit, Delete, Copy ID, Test）。
     - `nuqs` 同步搜尋與分頁狀態至網址。
4. **底部快速範本按鈕列 (Quick Templates)**：
   - 組合 `@startkiter/ui/components/card` + `@startkiter/ui/components/button`。
   - 搭配 Tailwind Grid：`grid grid-cols-1 md:grid-cols-3 gap-4`，內部放圖示、標題、說明與點擊觸發事件。

### 4.3 缺漏但 AI Console 必備的元件清單（需新寫或補齊）

| 缺漏元件 | console.x.ai / hyperagent 使用情境 | 建議解法（依 Ponytail 原則） |
|---|---|---|
| **`CopyButton` / `SecretInput`** | API Key / Token 遮罩顯示（`sk-...`）與一鍵複製按鈕。 | 手寫一個 30 行的小元件，結合 `lucide-react` 的 `Copy` / `Check` 圖示與 `navigator.clipboard.writeText`。 |
| **`EmptyState`** | 當用戶尚未建立任何 Agent 或尚無送單紀錄時的導引畫面。 | 目前專案都是各頁面手寫臨時 div；建議封裝一個通用 `<EmptyState icon={...} title="..." description="..." action={<Button>建立</Button>} />`。 |
| **`Command` (Cmd+K 搜尋)** | 全域快速跳轉或搜尋模板/功能。 | 若前期需求不高可暫緩；若需要可加裝 `cmdk` 套件。 |
| **`CodeBlock`** | 供用戶預覽 Webhook 格式或 API 調用範例的語法高亮區塊。 | 使用小巧的 `prismjs` 或簡易預格式化 `<pre className="bg-muted p-4 rounded-lg font-mono text-xs">`。 |
| **`Breadcrumb`** | 階層式導覽（如 `Dashboard / 關鍵字監聽 / 編輯模板`）。 | 專案缺少標準 Breadcrumb 元件，可使用現有 Button (variant="link") + ChevronRight 快速手拼。 |

---

## 5. 給老魚的結論（3-5 句話白話總結）

1. **重用率高達 8 成**：StartKiter 現有的底盤是 **MUI `@base-ui/react` + Tailwind v4 橄欖色**，個人帳單訂閱（`/settings/billing`）、個人安全設定與 TanStack Table 列表頁範本 100% 齊全且完全獨立於組織，可直接作為 BNI-AI 的基石。
2. **最大的坑在後台外殼樣式**：`NavBar.tsx`（1165 行）被硬編碼了 WordPress 的復古黑底（`#1d2327`）與藍色高亮，直接拿去做 AI Console 會像老舊後台；要拿到現代感（像 console.x.ai），必須先對 `NavBar.tsx` 做外觀解耦，改吃 Tailwind CSS 變數。
3. **缺失大多是 AI 領域專用小積木**：缺 API Key 遮罩與一鍵複製（`CopyButton`）、標準空白狀態（`EmptyState`）與 CodeBlock 預覽，但這些在 `@startkiter/ui` 現有體系下都是半天內能補齊的輕量元件，完全沒有架構級阻塞。
