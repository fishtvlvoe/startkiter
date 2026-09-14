## Tasks

- [x] 1.1 `CourseAccessReader`／`BundleCourseAccessReader` 新增 `getUserRole` 方法
- [x] 1.2 `canAccessCourse`／`canAccessCourseId` 加上 admin 最前置 bypass 判斷
- [x] 2.1 `apps/saas/lib/course-access.ts` 的 Prisma reader 實作 `getUserRole`
- [x] 2.2 `packages/api/modules/course/lib/course-access.ts` 的 Prisma reader 實作 `getUserRole`
- [x] 3.1 補測試：admin 無任何記錄依然放行
- [x] 3.2 補測試：role=user 無記錄依然擋下
- [x] 3.3 補測試：`getUserRole` 回傳 null 依然擋下
- [x] 4.1 Codex 獨立 code review（0 Critical）
- [x] 4.2 依 Codex review 修正 pg.Pool 連線池配置、查詢容錯與測試覆蓋度
- [x] 5.1 完整測試套件驗證（pnpm test 全綠）
- [x] 6.1 commit 並合併進 main（已合併，commit 見 `feature/admin-role-full-access-bypass`）
- [ ] 6.2 [PM 待辦，需 Coolify/Neon 存取權限] SSH／Coolify Execute Command 進正式站資料庫，UPDATE `fish@fishot.com` 的 role 為 admin，交付：Fish 用該帳號登入正式站能免購買看到所有課程內容。驗證：登入後實際點開一門課，確認內容正常顯示、不需要走結帳流程。
