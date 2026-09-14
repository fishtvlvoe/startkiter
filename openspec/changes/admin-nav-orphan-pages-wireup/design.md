## Context

`packages/platform/src/mount-points.ts` 匯出靜態陣列 `MOUNT_POINTS: PluginManifest[]`，`apps/saas/modules/shared/lib/nav-menu-items.ts` 的 `getMountMenuItems()` 依這個陣列產生側邊導覽項目，`requiresOperator: true` 的項目只有 `admin.access` 權限（`user.role === "admin"`）的使用者才看得到。目前已註冊且正常運作的後台項目：`admin`（後台設定，指向 `/admin/users`）、`bundles`（課程綁定包）、`onboarding-surveys`（新生問卷）、`media-library`（媒體庫）、`course-pack-admin`（CoursePack 任務）、`email-settings`（課程郵件），後四者透過 `groupId: "course-admin"` 收合進側邊導覽的「課程」群組。`pages-cms` 走另一條獨立的 `canAccessPagesCms` 權限判斷，不受 `requiresOperator` 影響，也已註冊。

排查程式碼確認 6 個頁面完全沒有出現在 `MOUNT_POINTS` 裡：`apps/saas/app/(authenticated)/(main)/(account)/admin/organizations`、`admin/orders`、`admin/revenue`、`admin/settings/checkout-gateway`、`admin/settings/einvoice`、`admin/settings/gemini`。這些頁面本身的 `page.tsx` 都存在且功能完整（例如 `checkout-gateway/page.tsx` 有完整的金流切換表單），純粹是導覽層沒接上。

## Goals / Non-Goals

**Goals:**

- 6 個既有頁面（organizations、orders、revenue、checkout-gateway、einvoice、gemini）全部註冊進 `MOUNT_POINTS`，`requiresOperator: true` 的管理員登入後能在側邊導覽看到並點擊進入
- 不影響現有 9 個已註冊項目的順序與分組

**Non-Goals:**

- 不新增 `/admin` 首頁
- 不改變 `requiresOperator` 或 `admin.access` 判斷邏輯本身
- 不處理這 6 個頁面各自的功能是否完整正確（那是各自獨立的問題，這次只處理「找不找得到」）

## Decisions

### 6 個新條目依內容性質分兩組：業務管理維持獨立頂層項目，系統設定併入新的 admin-settings 群組

`organizations`（組織管理）、`orders`（訂單管理）、`revenue`（營收報表）三者是查看業務資料的頁面，性質上不屬於「課程內容管理」（現有 `course-admin` 群組專指 bundles/onboarding-surveys/media/course-pack），也不適合硬塞進去造成語意混亂，維持獨立頂層導覽項目，各自一個 icon 與 label。

`checkout-gateway`（金流設定）、`einvoice`（發票設定）、`gemini`（Gemini API 設定）三者性質上都是「系統層級設定」，比照 `MENU_GROUP_CONFIG` 現有的 `course-admin` 分組寫法，新增一個 `admin-settings` 分組（`id: "admin-settings-menu"`, `label: "系統設定"`, `icon: "settings"`, `requiresOperator: true`），這三個條目都帶 `groupId: "admin-settings"`，會被 `nav-menu-items.ts` 既有的 `groupMountMenuItems()` 邏輯自動收合成一個帶子選單的群組項目，不需要修改 `groupMountMenuItems()` 本身的邏輯。

**Alternatives Considered:**
- 全部 6 個都當獨立頂層項目，不分組：否決，`checkout-gateway`／`einvoice`／`gemini` 三個都是低頻使用的系統設定，全部攤平在主導覽會讓選單過長，分組後使用者掃視主要業務項目（組織/訂單/營收）更清楚
- 把這 6 個全部併入既有的 `course-admin` 群組：否決，`course-admin` 群組名稱與既有 4 個子項目語意都是「課程內容管理」，`organizations`／`orders`／`revenue`／金流/發票設定跟課程內容管理是不同性質的功能，硬塞進同一個群組會讓「課程」這個群組名稱失去意義

### order 值安排在既有最大值（18，email-settings）之後，避免打亂既有順序

現有已註冊項目的 `order` 值最大是 `email-settings` 的 18。新增的 6 個條目 order 值從 19 開始依序遞增（organizations=19、orders=20、revenue=21、checkout-gateway=22、einvoice=23、gemini=24，實際數字待 apply 階段確認當下 `MOUNT_POINTS` 陣列的準確最大值後再排），確保不會插進既有項目中間造成既有導覽項目位置意外挪動。

**Alternatives Considered:**
- 把 organizations/orders/revenue 插在跟業務相關性更近的既有項目附近（例如訂單/營收排在 `admin`（後台設定/使用者管理）附近）：否決，插入中間需要調整多個既有項目的 order 值，增加改動範圍與意外挪動既有項目順序的風險，新項目一律排在最後是最安全、最小改動的做法，之後如果 Fish 對順序有具體偏好可以再開一張小 change 調整

## Implementation Contract

**行為：**
- `role === "admin"` 的使用者登入後，側邊導覽新增可見項目：組織管理、訂單管理、營收報表（各自獨立頂層項目），以及一個「系統設定」群組項目（展開後有金流設定、發票設定、Gemini 設定三個子項目）
- `role !== "admin"` 的使用者，這 6 個項目與新增的「系統設定」群組完全不出現在導覽（沿用既有 `requiresOperator` 過濾邏輯，不需要新寫判斷）
- 點擊每個新導覽項目後，正確導向對應的既有頁面路由，頁面本身行為不變

**驗證方式：**
- 新增或擴充 `apps/saas/modules/shared/lib/nav-menu-items.test.ts`：驗證 `isOperator: true` 時，`getMountMenuItems()` 回傳結果包含這 6 個新項目對應的 id／href，`isOperator: false` 時完全不包含
- 驗證「系統設定」群組正確收合 checkout-gateway/einvoice/gemini 三個子項目（比照既有 `course-admin` 分組的測試寫法）
- 既有 `nav-menu-items.test.ts` 測試案例（驗證既有 9 個項目的順序、分組、`isOperator` 過濾）全部維持通過，確認這次新增不影響既有項目
- 手動驗證：以 admin 角色登入正式站或本機開發環境，側邊導覽實際點擊這 6 個新項目，確認能正確導向對應頁面且頁面正常渲染（不是空白頁或 404）

**範圍邊界：**
- 只修改 `packages/platform/src/mount-points.ts` 與對應測試檔，不修改 `nav-menu-items.ts` 的分組/過濾邏輯本身（既有邏輯已經支援這次需要的分組寫法）
- 不修改這 6 個頁面各自的 `page.tsx` 內容
- 不新增 `/admin` 首頁或其他導覽相關的新功能

## Risks / Trade-offs

[Risk] `groupId: "admin-settings"` 這個新分組 id 如果拼錯或跟 `MENU_GROUP_CONFIG` 裡登記的 key 對不上，會導致這三個項目被 `groupMountMenuItems()` 判定為找不到分組設定、退回當成獨立頂層項目顯示（不是完全消失，但跟設計預期的「收合成一個系統設定群組」不一致）→ Mitigation: 新增的分組測試明確斷言最終結果是「一個 admin-settings-menu 頂層項目、底下三個 subItems」，而不是「三個獨立頂層項目」，能直接抓到拼字或設定不一致的問題

[Risk] `PluginManifest` 的 `id` 欄位在 `MOUNT_POINTS` 陣列內必須唯一（`registerPluginManifest` 有執行期檢查 `DUPLICATE_MOUNT_ID`，但 `MOUNT_POINTS` 是直接用陣列字面量宣告，這個檢查不會在靜態陣列宣告階段自動觸發），如果新 id 不小心跟既有 id 重複（例如誤用 `settings`），要等執行期或測試才會發現 → Mitigation: 新增條目前先 grep 確認 6 個新 id（`admin-organizations`／`admin-orders`／`admin-revenue`／`admin-checkout-gateway`／`admin-einvoice`／`admin-gemini`，具體命名待 apply 階段最終確認）不與既有 15 個 id 衝突

## Migration Plan

- 純前端導覽設定變更，走正常 CI/CD（合併 main → Coolify 自動部署），沒有資料庫變更、沒有特殊遷移步驟
- 回滾策略：如果新項目造成導覽版面問題，直接 revert 該次 commit 重新部署即可，不影響任何既有功能或資料
