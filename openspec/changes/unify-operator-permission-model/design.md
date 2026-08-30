# Design: unify-operator-permission-model

## 正推（預期成功路徑）

1. `packages/permissions` 新增 `isOperator(user, adminEmail?)`：`role === "admin"` OR `email === ADMIN_EMAIL`
2. 17 處 `isCourseOperator` 呼叫、3 處 pages-cms 呼叫、`admin/layout.tsx` 全部改用這一個函式
3. 既有能通過的人（ADMIN_EMAIL 帳號、role=admin 帳號）繼續能通過；新增「role=admin 但 email 不是 ADMIN_EMAIL」的人現在也能通過
4. 578 個既有測試 + 新增測試全過，type-check 全綠

## 逆推（BGO：如果這是錯的，什麼證據能推翻）

**風險 1：這是刻意的行為反轉，不是加功能，會讓既有測試變紅**

`packages/api/modules/pages-cms/access.test.ts` 現有一條測試：

```ts
it("denies a role=admin user whose email is not ADMIN_EMAIL", () => { ... })
```

這條測試的名字本身就是舊規則的宣告。這次改動的目的就是要推翻它——`resolvePagesCmsAccess` 原始設計註解寫「不看 user.role，避免後台 layout 與 API 各用一套判斷」，是刻意的隔離設計。

**對策**：這條測試要明確改名+改斷言為「allows a role=admin user even if email is not ADMIN_EMAIL」，在 proposal.md 已用問題方式跟老闆確認過方向（選「role=admin 也能管課程+CMS」），design.md 在此正式記錄這是有意識的行為變更，不是回歸 bug。

**風險 2：17 個呼叫點裡有沒有「只傳 email 字串，拿不到 role」的情境？**

`isCourseOperator(email, adminEmail)` 原本只吃 email 字串。改成 `isOperator(user, adminEmail)` 要吃整個 user 物件（要讀 `role`）。如果某個呼叫點的 session 物件在那個位置本來就沒有 `role` 欄位（例如某些 procedure context 型別裁切過），會編譯失敗或 role 恆為 undefined 導致邏輯上退化成純 email 比對（不會更寬鬆，但也沒達到目的）。

**對策**：tasks.md 第 2 步先 grep 全部 17+3 個呼叫點的呼叫現場，確認拿得到的物件裡有沒有 `role` 欄位；沒有的話要往上追一層看 session 讀取處有沒有撈 role，或改成多傳一個參數。type-check 全綠是這條風險的硬指標——如果型別對不上會直接編譯失敗，不會是「靜默過關」的那種風險。

**風險 3：權限擴大是否波及不該波及的資源？**

這次只動「誰算 operator」這一個判斷式，不動任何「operator 能做什麼」的授權邏輯（例如 `canManageCourse` 的課程層級判斷不變）。只要 17+3 個呼叫點改動範圍精準對應 proposal.md 列的清單，不會有非預期資源被波及。

**對策**：cross-impact 已在 proposal.md 完整列出全部呼叫點，tasks.md 逐項核對，不多改、不少改。

## 紅燈測試矩陣（TDD Phase 2）

| 失敗點 | 測試名稱 | 預期紅燈訊息 |
|---|---|---|
| pages-cms 舊測試斷言過時 | `packages/api/modules/pages-cms/access.test.ts` 改寫「role=admin 應該被允許」 | 改寫前跑舊測試會通過（因為還沒改代碼）；改寫斷言後、還沒改 `access.ts` 前應該是紅燈（`resolvePagesCmsAccess` 回 403） |
| `isOperator` 新函式行為 | `packages/permissions/is-operator.test.ts`：role=admin 通過／ADMIN_EMAIL 通過／兩者皆非拒絕／null user 拒絕 | 新檔案，函式還沒寫之前是 import error |
| course-operator 呼叫點遷移 | `packages/api/modules/course/lib/course-operator.test.ts` 補一條「role=admin 但 email 非 ADMIN_EMAIL 應通過 courseOperatorProcedure」 | 改動前應為紅燈（403 FORBIDDEN） |
| admin/layout 選單完整度 | 若有既有 layout 測試，補「ADMIN_EMAIL 帳號即使 role 不是 admin，也要看到完整選單」 | 改動前應為紅燈（目前只走 isInstructor 縮水選單分支） |

## 驗收標準

- 上述紅燈測試改完代碼後全部轉綠
- 既有 578 個測試（不含上面新增/修改的部分）全過，不能有既有功能被連帶弄壞
- type-check 全綠
- PM 親自 grep 確認 17+3 個呼叫點都真的換成 `isOperator`，沒有漏改的
