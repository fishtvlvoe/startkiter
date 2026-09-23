## Purpose

`role-based-workspace-navigation`（SR-01）已經把 `resolveNavigation` 邏輯寫好測試過，但沒有真的接到 `NavBar.tsx`。這份補上「真的接上」這一步，讓總管理員進不同 App 時，選單能顯示對應的管理員身份。

## ADDED Requirements

### Requirement: NavBar 呼叫 resolveNavigation 決定選單內容

`NavBar.tsx` 不再用單一布林值判斷「是不是總管理員」，改為呼叫 `resolveNavigation` 取得目前的 `WorkspaceContext`，據此決定選單顯示內容。

#### Scenario: 總管理員進入課程 App 顯示課程管理員身份

- **GIVEN** 使用者是平台總管理員，目前路徑在課程 App 底下（如 `/admin/course`）
- **WHEN** `NavBar` 渲染選單
- **THEN** 選單顯示「課程管理員」對應的身份標籤與管理設定項目，不是原本單純的「總管理員」全域標籤

#### Scenario: 一般會員看不到任何管理選單

- **GIVEN** 使用者是一般會員角色
- **WHEN** `NavBar` 渲染選單
- **THEN** 不顯示任何管理員身份或管理設定項目（維持既有行為，不因這次改動而破壞）

##### Example: WorkspaceContext 對應的選單標籤

| WorkspaceContext | 選單身份標籤 |
| ----- | --------------- |
| `{ scope: "platform" }` | 總管理員 |
| `{ scope: "app", appId: "course", role: "app-admin" }` | 課程管理員 |
| `{ scope: "app", appId: "course", role: "app-user" }` | 使用者（無管理選單） |
