# ADR 0001：Workspace 模型改成 App-scoped 結構，不再是固定三值 enum

- 狀態：已決定
- 日期：2026-09-21
- 背景程式碼：`openspec/changes/role-based-workspace-navigation/`（尚未實作，0/25 tasks）

## 背景（Context）

既有 `role-based-workspace-navigation` change（由 codex 撰寫，2026-09-21 建立，尚未 apply）把 workspace 定義成：

```ts
type WorkspaceId = "learner" | "course-admin" | "super-admin";
```

這個型別把「App 管理員」跟「課程」焊死在同一個字面值 `course-admin`。但 Fish 2026-09-21 明確定案：StartKiter 是「平台＋多個獨立 App」，課程只是第一個 App，之後會加入設計、社群等 App，每個 App 的管理者要用該 App 自己的名字稱呼（「課程管理員」「設計管理員」），且同一人可以在一個 App 是管理員、在另一個 App 是一般使用者。固定三值 enum 無法表達這件事——每加一個新 App 就要在型別層級加一個新值，且無法表達跨 App 的角色差異。

## 決策（Decision）

把 `WorkspaceId` 換成聯集型別：

```ts
type WorkspaceContext =
  | { scope: "platform" }
  | { scope: "app"; appId: string; role: "app-admin" | "app-user" };
```

- `scope: "platform"`：總管理員的平台層視角，管理所有 App，可見稱呼固定字串「總管理員」。
- `scope: "app"`：進入某個 App 時的視角，`appId` 是 App registry 的資料值（不是型別分支），`role` 決定可見稱呼是 `${App.displayName}管理員`（app-admin）或固定字串「使用者」（app-user）。

course、design、community 等任何 App 都是 `appId` 的資料，不需要修改 `WorkspaceContext` 的型別定義。角色判斷改成以 `(userId, appId)` 為單位查詢，總管理員的平台存取權是獨立的全站 capability，不綁定任何 `appId`。

## 為什麼不是其他方案

| 方案 | 為什麼不選 |
| --- | --- |
| 繼續用固定 enum，每加一個 App 就加一個新值（如 `design-admin`） | 型別隨 App 數量無限膨脹，且無法表達「一個人同時是課程管理員、設計使用者」 |
| 用單一字串 `role: string`，靠命名慣例（如 `"course:admin"`）辨識 | 字串慣例無法被 TypeScript 靜態檢查，等同放棄型別邊界 |
| 全站只存一個角色欄位，App 管理權另外用白名單表判斷 | 會讓「目前角色」與「目前 App 權限」變成兩套互相對不上的真相來源，這正是既有 bug（`/course` 顯示管理員選單）的成因之一 |

## 影響範圍

- **BREAKING**：`WorkspaceId` 型別本身改變。但因為 `role-based-workspace-navigation` 尚未實作（0/25 tasks，無已上線程式碼依賴這個型別），這是一次成本極低的破壞性變更——沒有需要遷移的既有呼叫端。
- 下游四張 change（`app-extension-contract`、`account-settings-theme-language`、`app-feature-surfaces`、`platform-launch-verification-evidence`）全部依賴這個新型別設計，若日後要再改動 `WorkspaceContext` 的形狀，需要回頭同步這四張 change 的 spec 與 tasks。
- App 管理員的可見稱呼樣板（`${displayName}管理員`）本次固定為單一樣板，不開放自訂；若未來要支援自訂樣板，是另一個決策，不在本 ADR 範圍內。

## 後續追蹤

- `app-extension-contract` 定義 `displayName` 的儲存與編輯機制時，若與本 ADR 假設的「App registry 提供可解析的 `displayName`」不符，需要回頭修改本 ADR 或另開一份新 ADR 記錄變更。
