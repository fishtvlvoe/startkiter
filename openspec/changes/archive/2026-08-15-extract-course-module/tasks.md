## 1. Docs and package scaffold

- [x] 1.1 更新 AGENTS.md、README.md、openspec/config.yaml：標明現行施工 extract-course-module；白名單含 packages/course 與 apps/saas 課程路由；來源 thetu 觀看／權限只讀。對應 Decision: 改寫抽 thetu 播放殼，不拷學院路由樹。驗證：rg -n "extract-course-module|packages/course" AGENTS.md README.md openspec/config.yaml 命中。
- [x] 1.2 建立 packages/course（package.json、tsconfig、src/index.ts）並掛進 workspace／apps/saas 依賴。對應 Decision: 課程目錄先用套件內靜態 manifest。驗證：@startkiter/course type-check 通過。

## 2. Entitlement and catalog

- [x] 2.1 先寫 Vitest（有權／無權／退款後）再實作 canAccessCourse(userId)：查 Order sku=startkiter-mvp 且 courseAccess=true。對應 Requirement: Playback entitlement reads Order.courseAccess；Decision: Entitlement 只讀 Order.courseAccess。驗證：pnpm test 相關案例全綠。
- [x] 2.2 先寫測試再實作靜態 lesson manifest 與 listLessons／getLesson；未知 id 回 null。對應 Requirement: Lesson catalog is served from the course package；Decision: 課程目錄先用套件內靜態 manifest。驗證：單元測試覆蓋 list 與未知 id。

## 3. SaaS routes and player shell

- [x] 3.1 從 thetu 改寫抽最小播放殼／權限 UI 到 packages/course（禁止拷 coupons／homework／newsletter／學院營運）。對應 Requirement: Course is a module on the sellable site；Decision: 改寫抽 thetu 播放殼，不拷學院路由樹。驗證：來源 thetu 觀看相關路徑 git status --short 無修改。
- [x] 3.2 在 apps/saas 掛課程列表與 course/[lessonId]：未登入拒、無 courseAccess 回 403 且不含媒體 URL、有權可播、未知 id 404。對應 Requirement: Playback entitlement reads Order.courseAccess；Requirement: Course is a module on the sellable site；Decision: 播放 API 與頁面雙層閘。驗證：focused route 測試或同等斷言 + pnpm type-check。

## 4. Close-out

- [x] 4.1 跑 pnpm test 與 pnpm type-check 全綠。驗證：兩個指令 exit 0。
- [x] 4.2 跑 spectra analyze extract-course-module --json 與 spectra validate extract-course-module；Critical／Warning 為 0。驗證：analyze／validate 通過。
