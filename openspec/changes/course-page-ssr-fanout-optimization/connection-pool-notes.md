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

### (4) Prisma 預設連線池大小推算
- **Prisma 官方公式**：`connection_limit = num_physical_cpus * 2 + 1`
- **推算結果**：
  - 正式站主機為 2 vCPU（1 physical core / 2 threads），推算值為 `2 * 2 + 1 = 5`（若以 1 physical core 計則僅 `1 * 2 + 1 = 3`）。
- **架構現況注意**：
  - 專案在 `packages/database/prisma/client.ts` 採用了 `@prisma/adapter-pg`，委由 `pg.Pool` 管理連線。在未傳入額外 pool option 的情況下，`pg.Pool` 預設連線上限為 `max: 10`。
  - 不論是 Prisma 原生推算的 5 條還是 pg.Pool 預設的 10 條，兩者均低於 20。

---

## 2. 7.2 評估與調整建議（connection_limit）

### (1) 問題與瓶頸分析
- 在 50 人併發壓測場景中，每一位使用者載入 `/course` 或 `/course/[lessonId]` 頁面時，會同時觸發 4～6 個查詢（auth session、membership、deployments、course details 等）。
- 50 人併發時可能同時產生 200～300 個非同步 DB 查詢。若連線池僅有 5～10 條，大量查詢會在 Node.js 應用層的連線池隊列中排隊等待釋放，造成高併發下的 p95 延遲被急劇放大（即前述 baseline 達到 5~7 秒的主因之一）。

### (2) 安全餘量計算
- **Postgres 最大容許**：`max_connections = 100`
- **系統與維護保留**：
  - Postgres 內部背景處理序：~7
  - Superuser 保留連線：3
  - 緊急運維 / CLI / psql 操作保留：20
  - 總保留量：30 條連線
- **SaaS 應用程式安全上限**：`100 - 30 = 70` 條連線。

### (3) 調整決策
- **建議值**：設定 `connection_limit = 25`。
  - **安全性**：25 條連線僅佔 `max_connections` 的 25%，保留了高達 75 條的充裕空間，絕無超過 Postgres 容許上限導致連線被拒絕（Connection Refused）的風險。
  - **效能效益**：將並行處理能力從 5~10 提升 2.5~5 倍，可顯著消化 SSR 查詢的並行發出，避免 connection acquisition timeout。
- **套用範圍**：
  1. `apps/saas/.env`：在 `DATABASE_URL` 後加入 `connection_limit=25` 參數（例如 `postgresql://...?schema=public&connection_limit=25`）。
  2. **正式站部署提示（供 PM / DevOps 於 Task 8 執行）**：正式站的環境變數是由 Coolify 控制並注入容器（目前正式站容器內的 `DATABASE_URL` 未帶參數），在正式站執行 Task 8 部署前，需在 Coolify Dashboard 的 SaaS 服務環境變數中同步在 `DATABASE_URL` 尾端加上 `?connection_limit=25`（若已有參數則以 `&connection_limit=25` 連接）。

---

## 3. 本機/測試環境驗證
- 在 `apps/saas/.env` 套用 `connection_limit=25` 後，執行應用程式啟動與全套測試套件，確認 Prisma / pg 正常解析連線字串，無任何連線錯誤或拒絕連線異常。
