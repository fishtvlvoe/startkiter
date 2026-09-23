## 0. 共用權限層（其他任務組的前置依賴，對應設計決策「共用權限層優先於各功能獨立實作」）

- [ ] 0.1 新增 `requireCourseManageAccess(userId, courseId)` 與 `manageableCourseWhereForUser(userId)`：未授權課程呼叫回傳 403 且不洩漏資料，並附負向測試（講師嘗試存取未授權課程被拒絕）

## 1. 課程管理儀表板

- [ ] 1.1 新增課程管理儀表板頁面，顯示上架課程數/累計學員數/近 30 天營收三項指標，資料來源為既有課程/訂單表；驗證：對照 `specs/course-dashboard/spec.md` 兩個 Scenario 各寫一則測試
- [ ] 1.2 儀表板指標依 `manageableCourseWhereForUser` 限制講師可見範圍；驗證：講師帳號只看到自己被授權課程的統計數字

## 2. 設計系統色票語意化

- [ ] 2.1 實作「語意化色票變數」：樣式進入點新增 `--heading`/`--body`/`--caption`/`--surface`/`--surface-hover`/`--divider` 語意化變數，淺色/深色主題各自定義值，色票變數命名沿用參考專案慣例；驗證：`pnpm build` 通過，兩種主題下手動截圖比對對比度
- [ ] 2.2 完成「既有硬編碼顏色替換」：替換 `admin/course/page.tsx`、`classroom-client.tsx`、`lesson-tool-embed.tsx`、`course-review-panel.tsx`、`MediaPicker.tsx` 五個檔案的寫死顏色類別為語意化 class；驗證：grep 確認這 5 個檔案不再出現 `text-neutral-`/`bg-neutral-`/`text-gray-`/`text-zinc-`/`text-slate-`

## 3. 留言/私訊拆分

- [ ] 3.1 前台播放頁新增獨立「私訊老師」入口，訊息寫入 `LessonPrivateMessage` 不進入 `LessonComment`；驗證：對照 `specs/lesson-comments-dm-split/spec.md`「前台留言與私訊分離入口」Scenario
- [ ] 3.2 後台拆出「課程留言」「學員私訊」兩個獨立路由與列表；驗證：對照「課程留言與私訊各自獨立後台路由」Scenario
- [ ] 3.3 後台私訊頁改為 Messenger 式介面（對話清單、未讀紅點、行內回覆）；驗證：對照「後台私訊 Messenger 式介面」Scenario

## 4. 測驗成績查看

- [ ] 4.1 新增 `getQuizAttemptsForAdmin`/`getQuizAttemptDetail` server action，回傳受 `manageableCourseWhereForUser` 限制；驗證：對照「測驗成績列表」「逐題對照檢視」Scenario
- [ ] 4.2 新增後台成績列表頁 + 逐題對照檢視頁 + CSV 匯出；驗證：對照「成績匯出」Scenario，實際下載 CSV 檢查欄位正確

## 5. 多講師管理

- [ ] 5.1 用戶管理頁新增角色分頁（全部/學員/講師/管理員）+ 角色指派 UI，僅 ADMIN 可操作；驗證：對照「用戶管理頁角色分頁」Scenario
- [ ] 5.2 課程資訊頁新增講師授權範圍設定（多選講師，未指定預設全講師可管）；驗證：對照「課程講師授權範圍」兩個 Scenario
- [ ] 5.3 完成「後端權限檢查（非僅前端隱藏）」：課程管理相關 API 全面套用 `requireCourseManageAccess`；驗證：對照該 Scenario，直接呼叫未授權課程 API 應回傳 403
- [ ] 5.4 後台選單依講師角色隱藏 5 項總管理員專屬功能（銷售分析、系統設定、隱私權、服務條款、組合包）；驗證：對照「講師後台選單可見性限制」Scenario
- [ ] 5.5 優惠券管理套用課程權限隔離；驗證：對照「優惠券權限隔離」Scenario

## 6. 整合驗證

- [ ] 6.1 `pnpm build` 全綠、既有測試不因本次改動變紅
- [ ] 6.2 本機以講師測試帳號完整走一次：儀表板、留言/私訊、測驗成績、多課程權限隔離，截圖存證
