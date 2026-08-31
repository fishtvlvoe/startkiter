# Tasks: mission-frontend-entry

- [ ] 1. 後台 CoursePack 列表頁：`/admin/course-pack`，顯示已匯入的 CoursePack（title/status/importedAt），操作權限比照既有 operator 判斷（用 `isOperator`，SR2 統一過的那個）
- [ ] 2. 後台 CoursePack 詳情頁：點進去列出底下的 `CoursePackMission`（title/goal/sortOrder）
- [ ] 3. 學員端 CoursePack 詳情頁：逐一渲染 Mission 內容，用既有 `MissionBlockRenderer`／`resolveMissionBlock`
- [ ] 4. 串接 `submitMissionFormValue` procedure：學員送出表單，正確處理成功/失敗狀態
- [ ] 5. 串接 `runMissionCheck` procedure：顯示檢查結果
- [ ] 6. 寫測試：後台列表頁權限（非 operator 應該被拒絕）、學員端表單送出成功/失敗、Mission 檢查結果顯示正確
- [ ] 7. PM 驗證：跑完整測試+type-check，親自走一次頁面流程確認可用
