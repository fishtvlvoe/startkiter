# Task 5.3：真實非管理員帳號瀏覽器驗收

日期：2026-09-23

## 依賴確認

`task-0.3-test-account.md` 2026-09-22 更正後結論：`app.startkiter.dev` 才是現行唯一環境（正式站＝測試站，Fish 2026-09-23 口頭確認），舊的 `test-startkiter.vercel.app`／`startkiter.aiver.me` 是已停用網址，不代表環境故障。本 task 依此結論在 `app.startkiter.dev` 建立並使用真實帳號驗證，不使用 mock capability 或測試 fixture。

## 帳號建立過程

1. ego-browser 使用的是 Fish 本人已登入的瀏覽器 session（`fish@fishot.com`），第一次送出 `/signup` 表單時沿用了既有登入 session，沒有真的切到新帳號——這個狀況已回報給 Fish，取得他明確同意後才登出他本人帳號繼續測試。
2. 登出 Fish 帳號後，在乾淨的 `/signup` 頁面建立新帳號：
   - Email：`fish+sr01usertest@fishot.com`（Fish 本人信箱的 plus-alias，驗證信會進他自己的信箱，密碼只在本次操作中使用，未寫入任何 git 追蹤檔案）
   - 姓名：`SR01 使用者測試`
   - 沒有勾選任何管理員／講師相關欄位；signup 表單本身也沒有這類欄位可選
3. Better Auth 要求 email 驗證；Fish 本人到信箱點擊驗證連結後回報「點好了」。
4. 用同一組帳密在 `/login` 完成登入，通過一次性的 onboarding（Set up your account）表單。

## 驗收結果

### 桌面 1440px

- 側欄只有 5 個一級選單項：開始、課程、客服、AI 助手、帳號設定
- **沒有「管理」群組**，沒有任何 `/admin/*` 入口
- 截圖：[`5.3-app-user-desktop-1440-home.png`](./screenshots/5.3-app-user-desktop-1440-home.png)、[`5.3-app-user-desktop-home.png`](./screenshots/5.3-app-user-desktop-home.png)、[`5.3-app-user-desktop-course.png`](./screenshots/5.3-app-user-desktop-course.png)

### `/course`（app-user 視角）

- 只顯示課程使用介面（課程說明、前往結帳、單元列表），沒有任何管理選單或管理連結
- DOM 檢查 `snapshotText()` 全文不含「管理」二字

### 直接請求 `/admin/course`（越權情境）

- 實測結果：導向 `https://app.startkiter.dev/`（首頁），沒有渲染任何管理介面，沒有出現 401/500 裸露錯誤
- 對應 spec `role-based-workspace-navigation` 的「browser verification finds a regression」example：GIVEN 只有 app-user 權限的真實帳號 → WHEN 直接請求 `/admin/course` → THEN 被導開而非渲染管理介面。**通過。**
- 截圖：[`5.3-app-user-admin-course-blocked.png`](./screenshots/5.3-app-user-admin-course-blocked.png)

### 手機 390px

- `/course` 實測 `scrollWidth 375px ≤ innerWidth 390px`，無水平溢出
- 底部導覽只有 4 個入口：開始、課程、客服、更多；沒有管理入口
- 截圖：[`5.3-app-user-mobile-390-course.png`](./screenshots/5.3-app-user-mobile-390-course.png)

## 未涵蓋的部分（如實記錄，不做完成聲稱）

- 本次只驗證了「使用者」（app-user）視角。「App 管理員」「總管理員」兩種角色的真實登入瀏覽器驗收**沒有做**——這超出 0.3／5.3 原始要求的「非管理員帳號」範圍，本 task 定義的驗收目標只到 app-user；App 管理員／總管理員視角的完整驗收留給 `platform-launch-verification-evidence`（SR-05）處理。
- 語言切換（zh-tw／zh-cn／en）與深色／淺色切換沒有在這次真人帳號驗收中重測——這兩項已由既有 component test（3.4、1.6、1.7）與先前的 ego-browser 骨架驗收涵蓋，本次不重複。
- `/admin/course` 的手機寬度沒有用真實 app-admin 帳號截圖驗證（見 `task-3.3-mobile-overflow.md` 說明）。

## 結論

「使用者」（app-user）視角的真實非管理員帳號瀏覽器驗收通過，涵蓋桌面 1440px、手機 390px、`/course` 正常顯示、直接請求 `/admin/course` 被安全導開。`tasks.md` 的 5.3 標記完成。
