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
- [x] 6.2 SSH 進正式站資料庫確認 `fish@fishot.com` 的 role 已是 admin（之前的 SR 派工已經設過，這次確認未被覆蓋），交付：Fish 用該帳號登入正式站能免購買看到所有課程內容。驗證：ego-browser 實際登入，點開 lesson-01（標「開放公開試看」）跟 lesson-02（沒有公開試看標記，正常要付費才能看）兩堂課，畫面顯示影片/講義/AI助教皆正常渲染，未被導向結帳頁，確認 admin bypass 對非公開課程也生效。截圖存證 /tmp/admin-role-verify.png、/tmp/admin-role-verify-lesson2.png。
