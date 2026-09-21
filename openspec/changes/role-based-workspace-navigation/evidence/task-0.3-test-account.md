# Task 0.3：TEST 非管理員測試帳號盤點

盤點日期：2026-09-22

## 結論

**需建立新帳號。**

目前 repo 沒有一組可被證實為 TEST 環境、非 operator、非 course-instructor，且可供 task 5.3 真實瀏覽器登入使用的帳號。這次沒有連線 TEST、沒有查詢或修改任何資料庫，也沒有把任何帳號密碼或 API key 寫入本文件。

## 找到或需要建立的細節

### 已盤點的帳號／seed 證據

- 根目錄 `.env` 只有 `TEST_ADMIN_EMAIL`／`TEST_ADMIN_PASSWORD` 這組管理員用途設定；`apps/saas/.env` 與 `.env.example` 只有 `ADMIN_EMAIL` 類管理員設定。實際值未讀出、未複製。
- `docs/deploy-and-public-url.md:100-112` 是 2026-08-15 的歷史 TEST 站紀錄，寫有 email/password 登入模式與舊 TEST origin，但沒有可核對的帳號識別、角色或密碼，不能當作目前非管理員帳號證據。`docs/deploy-and-public-url.md:128` 也明確把 `ADMIN_EMAIL` 用作營運者後台判斷。
- `docs/vps-deployment-sop.md:24` 只記錄 `startkiter-test` 的 Coolify project，沒有測試帳號資料；`docs/dashboard/` 沒有可用帳號紀錄。
- `packages/database/prisma/seed-course.ts:1-20` 及其餘 seed 檔只建立課程／章節／單元／Studio 資料，沒有建立 User、Account 或 CourseInstructor。`tooling/scripts/src/create-user.ts` 是互動式建立使用者工具，不是已存在的 TEST 帳號資料。
- `openspec/changes/role-based-workspace-navigation/evidence/review-checklist.md:17` 記錄 TEST 入口目前回 `DEPLOYMENT_NOT_FOUND`；`:29` 記錄 5.3 三種角色真實瀏覽器驗收尚未驗證。因此不能把歷史文件或程式 fixture 推定成已可登入帳號。

### 建立帳號的可行流程（目前未執行）

優先使用 TEST 網站恢復後的正常註冊流程：

1. 先修復 TEST 部署，確認 TEST URL 不再回 `DEPLOYMENT_NOT_FOUND`；本 task 不執行這一步。
2. 開啟 `https://<TEST 網址>/signup`。`apps/saas/app/(unauthenticated)/signup/page.tsx:29-47` 顯示公開 signup route，`packages/auth/config.ts:3-9` 顯示 signup 與 password login 已開啟。
3. 使用專用、未列在 `ADMIN_EMAIL` 的 email，填寫名稱與新密碼。密碼需至少 8 字元，含大小寫字母、數字、特殊字元，且不含首尾空白；密碼只放在密碼管理器或受控測試流程，不寫入 repo。
4. 送出表單。`apps/saas/modules/auth/components/SignupForm.tsx:76-85` 會呼叫 Better Auth `authClient.signUp.email`；`packages/auth/auth.ts:258-280` 要求 email verification，因此在 TEST 郵件 provider 可用的前提下，從 TEST 郵件服務取得驗證信並完成驗證。
5. 開啟 `/login`，切換 Password 模式，以同一組帳密登入。登入後由 TEST 管理員確認該 User 的全域 role 不是 `admin`，且沒有 `CourseInstructor` 指派，再把登入與 workspace 畫面交給 task 5.3 做 desktop/mobile 真實瀏覽器驗證。

repo 另有 `tooling/scripts/package.json:5-8` 的 `pnpm --filter @startkiter/scripts create:user` 與 `tooling/scripts/src/create-user.ts:21-64` 互動式工具：選 `isAdmin=false` 會建立 `role: "user"`，並建立已驗證的 credential account；它不建立 CourseInstructor 指派。但該 script 固定載入 repo 根目錄 `../../.env` 並直接寫入 `DATABASE_URL` 指向的資料庫，不能在目前工作樹直接執行，也沒有在本次使用；只有在已注入且確認隔離的 TEST-only database 環境後，才能把它當作替代建立路徑。

## 下一步

先修復 TEST 部署；恢復後用專用非管理員 email 走 `/signup`、完成 email verification 與 password login，將帳號密碼放在受控秘密儲存，不寫入 repo。帳號建立及真實登入畫面完成前，task 5.3 必須維持「未驗證」。
