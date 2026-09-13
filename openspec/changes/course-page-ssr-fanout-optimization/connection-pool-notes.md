# 資料庫連線池評估筆記（Tasks 7.1 & 7.2）

日期：2026-09-14
記錄人：Antigravity Agent (course-page-ssr-fanout-optimization)

---

## 1. 7.1 正式站主機與 Postgres 實際測量數據

透過 SSH 實際連線至正式站 Coolify 伺服器 `startkiter-managed-fleet-01`（IP: `45.76.187.247`）進行實地量測，數據與取得方式如下：

### (1) CPU 核心數
- **執行指令**：`ssh root@45.76.187.247 "nproc"`
- **輸出**：
  ```
  2
  ```
- **CPU 細部規格（`lscpu`）**：
  - Model: Intel Xeon Processor (Skylake, IBRS)
  - Sockets: 1
  - Core(s) per socket: 1
  - Thread(s) per core: 2
  - CPU(s): 2 (vCPU 0, 1)

### (2) Postgres `max_connections` 設定值
- **執行指令**：`ssh root@45.76.187.247 "docker exec reh3ixu6o48kngohhelg5epd psql -U postgres -c 'SHOW max_connections;'"`
- **輸出**：
  ```
   max_connections 
  -----------------
   100
  (1 row)
  ```

### (3) 資料庫與共用狀況
- **執行指令**：`ssh root@45.76.187.247 "docker exec reh3ixu6o48kngohhelg5epd psql -U postgres -c 'SELECT datname FROM pg_database;'"`
- **輸出**：
  ```
    datname   
  ------------
   postgres
   startkiter
   template1
   template0
  (4 rows)
  ```
- **活動連線與服務佔用情況**：
  - 指令：`SELECT datname, usename, client_addr, application_name, state, count(*) FROM pg_stat_activity GROUP BY datname, usename, client_addr, application_name, state;`
  - 結果：Postgres 內部背景處理序 7 個，當前無外部長連線，僅有 psql 查詢本身（1 個連線）。
  - **結論**：目前此 Postgres 實例僅供 `startkiter` 業務資料庫使用，無其他外部系統或微服務共用。

### (4) Prisma 預設連線池大小推算與算法修正
- **Prisma 官方公式**：`connection_limit = num_physical_cpus * 2 + 1`
- **算法修正說明**：
  - 從前述 `lscpu` 可知主機規格為：1 socket、1 core per socket、2 threads per core。
  - 這代表實體核心數（physical cpus）為 **1**，而 2 是邏輯核心數（vCPU / threads）。
  - 若誤將 2 vCPU 直接代入公式會得出 `2 * 2 + 1 = 5`；但依 Prisma 官方定義的實體核心數計算，實際預設連線池僅有：
    `1 * 2 + 1 = 3` 條連線！
- **架構現況與實測（node-postgres pg.Pool）**：
  - 專案在 `packages/database/prisma/client.ts` 採用了 `@prisma/adapter-pg`，底層由 `pg.Pool` 管理連線。
  - **重要實測發現**：node-postgres 的 `pg.Pool` 僅認建構選項中的 `max` 屬性，**完全不解析**連線字串裡的 `?connection_limit=25` 或 `?max=25`。實測在連線字串帶入這些參數後，`pool.options.max` 依然固定在預設值 `10`。
  - 因此單純在 `DATABASE_URL` 加參數無法生效，必須在應用程式碼建構 `PrismaPg` 時傳入 `{ max: 25 }`。

---

## 2. 7.2 評估與調整建議（pg.Pool max = 25）

### (1) 問題與瓶頸分析
- 在 50 人併發壓測場景中，每一位使用者載入 `/course` 或 `/course/[lessonId]` 頁面時，會同時觸發 4～6 個查詢（auth session、membership、deployments、course details 等）。
- 50 人併發時可能同時產生 200～300 個非同步 DB 查詢。若連線池僅有 3（Prisma 預設）或 10（pg.Pool 預設），大量查詢會在 Node.js 應用層的連線池隊列中排隊等待釋放，造成高併發下的 p95 延遲被急劇放大（即前述 baseline 達到 5~7 秒的主因之一）。

### (2) 安全餘量計算
- **Postgres 最大容許**：`max_connections = 100`
- **系統與維護保留**：
  - Postgres 內部背景處理序：~7
  - Superuser 保留連線：3
  - 緊急運維 / CLI / psql 操作保留：20
  - 總保留量：30 條連線
- **SaaS 應用程式安全上限**：`100 - 30 = 70` 條連線。

### (3) 調整決策與實作方式
- **建議值**：設定 `max = 25`。
  - **安全性**：25 條連線僅佔 `max_connections` 的 25%，保留了高達 75 條的充裕空間，絕無超過 Postgres 容許上限導致連線被拒絕（Connection Refused）的風險。
  - **效能效益**：將並行處理能力從 3~10 提升至 25（提升 2.5~8 倍），可顯著消化 SSR 查詢的並行發出，避免 connection acquisition timeout。
- **實作落地**：
  1. 修改 `packages/database/prisma/client.ts`：在初始化 `PrismaPg` 時明確指定 `max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX, 10) : 25`。
  2. 此改動直接使 `pg.Pool` 以 25 條上限運作，若日後需要調整亦可透過環境變數 `DATABASE_POOL_MAX` 覆蓋，不依賴無效的 `DATABASE_URL` 參數。

---

## 3. 本機/測試環境驗證
- 在 `packages/database/prisma/client.ts` 加入 `max: 25` 後，執行應用程式啟動與全套測試套件（`pnpm --filter database test`、`pnpm --filter saas test`），確認 `pg.Pool` 正常建立 25 大小的連線池，無任何連線錯誤或拒絕連線異常。
