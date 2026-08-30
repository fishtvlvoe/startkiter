# Proposal: unify-operator-permission-model

## 問題

目前系統有 **4 套**「誰是管理者」的判斷邏輯，各自獨立實作（原始盤點只抓到 3 套，PM 對照正式 specs 時多抓到第 4 套）：

| 名稱 | 判斷方式 | 用在哪 | 使用點數 |
|---|---|---|---|
| `admin.access`（`checkPermission`） | `user.role === "admin"`（資料庫欄位） | 後台總覽 layout、匯出報表、發票/金流設定、AI 工具 | 11 |
| `isCourseOperator`（`packages/api/.../course-operator.ts`） | `session.user.email === process.env.ADMIN_EMAIL`（單一寫死的信箱） | 課程建立、AI 講義生成、批次匯入、operator 後台頁面等 | 17 |
| `resolvePagesCmsAccess`（`packages/api/.../pages-cms/access.ts`） | 跟 `isCourseOperator` 同一種邏輯，但獨立重寫一份 | 網頁 CMS（Pages） | 3 |
| `isOperator`／`operatorHttpStatus`（`apps/saas/lib/operator.ts`） | 又是同一種 email 比對邏輯，第三份重寫 | sidebar-layout、bundles 三支 API | 4（另有 1 處只借用型別，非邏輯依賴） |

`apps/saas/lib/operator.ts` 還有一個 `shouldShowOperatorSettingsLink` 函式完全沒有任何呼叫點（死代碼）。

**實際影響（已與老闆確認要修）**：如果之後在資料庫把某個員工帳號設成 `role = "admin"`，他能進後台總覽，但**不能**建課程、**不能**跑批次匯入、**不能**管網頁 CMS——因為那兩套只認「email 是不是等於 `ADMIN_EMAIL` 這一個固定信箱」，不認資料庫角色。等於課程與 CMS 管理權限實質上鎖死在一個帳號，沒辦法正常授權給團隊其他人。

## 修法

在 `packages/permissions` 新增一個統一函式 `isOperator(user, adminEmail?)`：

```ts
export function isOperator(
	user: { email?: string | null; role?: string | null } | null | undefined,
	adminEmail: string | null | undefined = process.env.ADMIN_EMAIL,
): boolean {
	if (!user) return false;
	if (checkPermission({ user }, "admin.access")) return true; // role === "admin"
	return emailsMatch(user.email, adminEmail); // 相容既有 ADMIN_EMAIL 帳號
}
```

規則：`role === "admin"` **或** `email === ADMIN_EMAIL`，符合其中一個就算 operator。兩個既有判斷都保留（不砍任何現有可用權限），只是合併成一個入口。

把原本 17 處呼叫 `isCourseOperator(email, adminEmail)`、3 處呼叫 `resolvePagesCmsAccess`/`canAccessPagesCmsAdmin`、4 處呼叫 `apps/saas/lib/operator.ts` 的 `operatorHttpStatus` 內部邏輯，全部改成呼叫這個新的 `packages/permissions/isOperator`。`isCourseOperator`（純 email 比對）保留原函式簽名不動，但改為 `isOperator` 內部使用的私有邏輯。`apps/saas/lib/operator.ts` 整份刪除（含死代碼 `shouldShowOperatorSettingsLink`），4 個呼叫點改直接呼叫 `packages/permissions` 的 `isOperator`／新寫一個等價的 `operatorHttpStatus` 包裝（維持 401/403 回應格式不變）。

## 不做什麼

- 不改 `admin.access` 本身的判斷邏輯（role 比對維持不動）
- 不新增資料庫欄位、不動 Prisma schema
- 不改 `canManageCourse`（單一課程的 instructor 指派邏輯），只改它接收的 `isOperator` 布林值來源
- 不做「移除 `ADMIN_EMAIL` 環境變數」這種大動作，向下相容既有部署設定

## 影響範圍（cross-impact，已 grep 全部呼叫點）

**🔴 需要注意**：無。這是純粹擴大授權範圍（原本能通過的人繼續能通過，只是多了 role=admin 的人也能通過），不會讓原本能存取的人失去權限。

**⚠️ 需要在 tasks.md 明確處理**：
- 17 處 `isCourseOperator(session.user.email, process.env.ADMIN_EMAIL)` 呼叫改成 `isOperator(session.user, process.env.ADMIN_EMAIL)`（參數從純 email 改傳整個 user 物件，因為要多讀 role）
- 3 處 pages-cms 存取（`access.ts`／`handlers.ts`／`admin/pages/layout.tsx`）改用同一個 `isOperator`
- 4 處 `apps/saas/lib/operator.ts` 的 `operatorHttpStatus` 呼叫（`sidebar-layout`、`bundles` 三支 route）改用新的統一邏輯；`apps/saas/app/api/course/studio/route.ts` 只借用 `OperatorSession` 型別（非邏輯依賴），該型別要換一個新歸屬或直接在 `packages/permissions` 也匯出對應型別
- `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx` 目前只查 `admin.access`，沒查 `ADMIN_EMAIL` 後備帳號——順便讓它也改用 `isOperator`，讓 `ADMIN_EMAIL` 那個帳號一定看得到完整後台選單（目前若該帳號 role 不是 admin，是靠 `isInstructor` 分支勉強進來，選單是縮水的 instructor 版）
- **正式 specs 需要同步更新（MODIFIED Requirements delta，這是這次 propose 時漏做、被 Fish 抓到的部分）**：
  - `openspec/specs/operator-settings/spec.md` 的「Operator identity matches ADMIN_EMAIL」條文寫死「only when ADMIN_EMAIL...equals session email」，這次改動直接推翻這句話，必須寫 MODIFIED delta
  - `openspec/specs/course-instructor-scoped-access/spec.md` 的「Operator can assign a user as an instructor scoped to a specific course」條文寫死「verified via the existing `isCourseOperator` email check」，機制敘述要更新成新的統一判斷

**✅ 影響但邏輯不變**：`packages/api/modules/course/lib/course-operator.ts` 的 `courseOperatorProcedure`（oRPC middleware）改呼叫新函式，行為對既有 operator（role=admin 或 ADMIN_EMAIL）完全不變，只是新增涵蓋範圍。
