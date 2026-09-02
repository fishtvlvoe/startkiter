# Tasks: mission-frontend-entry

- [x] 1. 後台 CoursePack 列表頁：`/admin/course-pack`，顯示已匯入的 CoursePack（title/status/importedAt），操作權限比照既有 operator 判斷（用 `isOperator`，SR2 統一過的那個）。（PM 覆核+實測）`admin/course-pack/page.tsx` 已在 main（commit b167a273）；一般學員帳號訪問 `/admin/course-pack` 被導回首頁，權限擋下正確
- [x] 2. 後台 CoursePack 詳情頁：點進去列出底下的 `CoursePackMission`（title/goal/sortOrder）。（PM 覆核）`admin/course-pack/[coursePackId]/page.tsx` 與測試檔皆在 main
- [x] 3. 學員端 CoursePack 詳情頁：逐一渲染 Mission 內容，用既有 `MissionBlockRenderer`／`resolveMissionBlock`。（PM 實測）學員端 `/course-pack/ee869428…` 正確渲染 5 個 Mission（沙盒／表單／檢查三型），截圖 `/tmp/sr-verify-course-pack.png`
- [x] 4. 串接 `submitMissionFormValue` procedure：學員送出表單，正確處理成功/失敗狀態。（PM 實測）填 Mission 2 表單（merchant_id/hash_key/webhook_url/timeout_sec）按「送出並檢查」→ 頁面回「資料已送出。」
- [x] 5. 串接 `runMissionCheck` procedure：顯示檢查結果。（PM 實測）Mission 4 按「執行檢查」→ 回「尚未完成，請完成任務後再檢查」，檢查項目 deployment_heartbeat_fresh 正確顯示
- [x] 6. 寫測試：後台列表頁權限（非 operator 應該被拒絕）、學員端表單送出成功/失敗、Mission 檢查結果顯示正確。（PM 實跑）`pnpm vitest run course-pack`（apps/saas）→ PASS 10 / FAIL 0，exit 0
- [x] 7. PM 驗證：跑完整測試+type-check，親自走一次頁面流程確認可用。（PM 實測）ego-browser 走完後台權限、學員端渲染、表單送出、檢查結果四段流程，全部正常
