# Task 5.3 追加：總管理員進入 `/course` 的 App 管理員身份

日期：2026-09-24

## 回歸重現

用 `ego-browser` 實際開啟 `https://app.startkiter.dev/course`，現有登入 session 顯示 `fish@fishot.com`。頁面側欄只有「首頁／課程／客服／AI 助手／帳號設定」五項，沒有 workspace 身份標籤；同一 session 開啟 `/admin/newsletter` 時，側欄顯示「總管理員」與完整管理選單。這確認問題是 `/course` 的 workspace label 遺失，不是登入失效或管理選單權限錯誤。

## 根因

根因是前一次課程前台／後台路由拆分 commit `f6d6ba4d` 引入的兩個互相配合的判斷：

1. `getMountNavigationContext()` 只在目前路由符合 platform mount 時才把 `platformAdmin` 傳進 `NavigationCapabilities`，所以 `/course` 解析時 capability 變成 `false`。
2. `resolveNavigation()` 又以目前 mount 的 `requiredRole`（`/course` 是 `app-user`）覆蓋角色，總管理員在前台路徑被解析成 `app-user`，因此 `workspaceLabel` 變成「使用者」；NavBar 的 `workspaceLabel !== "使用者"` 條件自然不渲染標籤。

這不是 `isCollapsedEffective` 或 JSX 外層隱藏問題。`NavBar` 的 label JSX 已存在，實際缺的是 resolver 輸出的 label。

## 修法

- App 路徑也保留 `platformAdmin` capability，讓總管理員在任一 App 路徑解析成 `app-admin` workspace。
- 選單過濾仍以目前路由的 `requiredRole` 為準：`/course` 維持五個使用者入口，`/admin/course` 維持課程管理入口，不把前台路徑變成管理選單。
- `requiresOperator` 改以各 menu entry 的 `requiredRole` 判斷，避免總管理員在 `/course` 的五個使用者入口被錯誤分到管理區。

## 新增回歸測試

- `packages/platform/src/workspace/navigation.test.ts`：總管理員解析 `/course` 得到 `{ scope: "app", appId: "course", role: "app-admin" }`、`workspaceLabel === "課程管理員"`，且仍只有 `course-user`。
- `packages/platform/src/workspace/feature-surfaces.test.ts`：保留課程前台五個入口，並斷言總管理員的 App 管理員身份。
- `apps/saas/modules/shared/lib/nav-menu-items.test.ts`：總管理員 `/course` 仍只有五項，沒有 `/admin/*` 入口，也沒有管理區標記。
- `apps/saas/modules/shared/components/NavBar.test.tsx`：實際 SSR shell markup 包含 `sidebar-workspace-label` 與「課程管理員」，且不包含課程管理子選單。

## 驗證

```text
pnpm --filter @startkiter/platform exec vitest run src/workspace/navigation.test.ts src/workspace/feature-surfaces.test.ts
Test Files  2 passed (2)
Tests  19 passed (19)

pnpm --filter @startkiter/saas exec vitest run modules/shared/lib/nav-menu-items.test.ts modules/shared/components/NavBar.test.tsx
Test Files  2 passed (2)
Tests  35 passed (35)
```

既有 `pnpm --filter @startkiter/platform test` 仍有與本次 diff 無關的既存 `FORBIDDEN_WORKSPACE_COPY`（`apps/saas/modules/admin/component/users/UserList.tsx` 的「學員」）失敗；本次未擴大範圍修改該 UI 文案。雲端目前仍是未部署的舊版本，因此 post-fix `/course` 真人瀏覽器驗收待部署後重跑；本文件的雲端快照是修復前回歸證據，不能當成修復後通過證據。

## 之前為何誤判通過

原 `task-5.3-real-login-verification.md` 只用真實非管理員帳號驗證 app-user 視角，沒有用總管理員帳號在 `/course` 驗證身份標籤；同時既有 `feature-surfaces.test.ts` 把總管理員 `/course` 預期寫成 `app-user`，測試因此把錯誤行為固定成綠燈。這次把具體前台路徑與身份標籤加入測試，並保留五項前台選單的斷言，避免修標籤時帶回越權選單。
