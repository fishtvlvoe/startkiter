# Puter.js 極速 MVP 開發實戰教學

> 本教學示範如何利用 [Puter.js (HeyPuter/puter)](https://github.com/HeyPuter/puter) 在 10 分鐘內打造具備**雲端儲存、會員登入、AI 智慧拆解**的無伺服器 (Serverless) 前端應用。

---

## 什麼是 Puter.js？

**Puter 就像是「跑在瀏覽器裡的雲端作業系統」加上「免維護的後端雲服務 (BaaS)」**。

傳統前端要存資料、做會員或串 AI，通常需要：
1. 架設 Node.js / Python / Go 後端 API
2. 申請 PostgreSQL / Redis 資料庫
3. 申請 OpenAI API Key 並處理伺服器端代理 (Proxy) 與防盜刷

使用 Puter.js，前端只需引入一行 JavaScript SDK，直接擁有雲端資料庫、使用者認證與 AI 調用能力。

```html
<script src="https://js.puter.com/v2/"></script>
```

---

## 核心 API 速查

### 1. 雲端資料庫 (KV Store)
每個使用者的資料獨立儲存在其 Puter 帳號中，無需後端設定：

```javascript
// 寫入資料
await puter.kv.set('todos', [{ id: 1, text: '學習 Puter.js' }]);

// 讀取資料
const todos = await puter.kv.get('todos');

// 刪除資料
await puter.kv.del('todos');
```

### 2. 會員登入 (Auth)
零設定一鍵登入，支援跨裝置同步：

```javascript
// 判斷是否已登入
if (puter.auth.isSignedIn()) {
  const user = await puter.auth.getUser();
  console.log('使用者名稱:', user.username);
}

// 觸發登入視窗
await puter.auth.signIn();

// 登出
await puter.auth.signOut();
```

### 3. AI 模型調用 (AI Chat)
內建支援 500+ 款 AI 模型，免自備 API Key：

```javascript
const response = await puter.ai.chat('請將「學好 Next.js」拆解為 3 個步驟');
console.log(response.message.content);
```

### 4. 檔案系統 (Cloud Storage)
```javascript
// 儲存檔案
await puter.fs.write('notes.txt', '今日學習筆記...');

// 讀取檔案
const content = await puter.fs.read('notes.txt');
```

---

## 與 StartKiter 架構定位比較

| 維度 | StartKiter 正式架構 | Puter.js 應用場景 |
|---|---|---|
| **技術棧** | Next.js + Neon (PostgreSQL) + Prisma | 純前端 HTML / React + Puter SDK |
| **金流/訂單** | **PAYUNi** (台灣合規交易與 Webhook 防偽) | 無原生台灣金流支援 |
| **會員體系** | **LINE Login / Google OAuth** 綁定主站 DB | Puter 獨立帳號體系 |
| **最佳用途** | **商業賣課、正式 SaaS 營運、數位商品發牌** | **學員實作作業、10 分鐘 MVP 驗證、課堂輔助工具** |

---

## 實戰範例：AI 智慧待辦清單 (To-Do App)

本目錄包含一份完整的單一 HTML 範例專案 [`demo/index.html`](./demo/index.html)。

### 包含功能
- **Puter KV 雲端存取**：新增、刪除、完成狀態即時同步，附帶 LocalStorage 離線回退機制。
- **Puter Auth 登入**：登入後自動加載使用者專屬待辦。
- **Puter AI 任務拆解**：點擊「AI 拆解」，自動調用 AI 將大任務分解為 3~5 個執行步驟。
- **Tailwind CSS + Lucide 圖示**：現代化深色質感介面。

---

## 2 分鐘本機啟動

因 Puter.js 基於安全策略要求 HTTP/HTTPS 伺服器環境（不支援 `file://` 直接開啟）：

```bash
# 進入 demo 目錄啟動伺服器
cd docs/tutorials/puter-serverless-mvp/demo
python3 -m http.server 3000
```

瀏覽器開啟 `http://localhost:3000` 即可體驗完整功能。
