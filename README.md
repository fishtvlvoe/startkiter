▋ StartKiter

給台灣已在用 AI 做服務的人：一堂課 + 終身代碼包。對外課名可用「開站包」。現行產品定義以 `openspec/specs/` 為準。

MVP 是用這包自己的站賣課。課程是課程模組，不是整站唯一長相。結帳鎖 NT$8800，主金流只接通 PAYUNi 一次買斷。付款後在站內領取代碼：GitHub 登入，系統邀請組織私人倉庫只讀。課程裡有 LINE 學員交流群加入連結（付費才看得到）。客服走 email（`NEXT_PUBLIC_SUPPORT_CHANNEL=email`，收件 SUPPORT_EMAIL）；Chatwoot 統一工單（網站/LINE/Telegram）已實作完成但暫停啟用，改設 chatwoot 即啟用，客服不進這個群。

這不是 libon.me。學員拿到的是另一個私人倉庫讀取權，不是 ZIP。

【現在這 repo 有什麼】

Git、Spectra（`openspec/`）、架構討論稿（`docs/discuss/`），以及已落地的站殼、登入、PAYUNi／Order、課程模組（`extract-shell-auth`、`extract-payuni-checkout`、`extract-course-module` 已封存）。兩倉／晉升規則已封存為 `test-clean-package-promotion`。現行施工 `extract-github-kit-fulfillment`（`packages/github-kit`＋claim API；站內領 GitHub 代碼包）。site-agent、LINE 學員社群仍是後續 change。

【來源（只讀）】

殼：`supastarter-nextjs-main`

台灣金流／訂單與課程觀看模組：`THE-TU-Project/dev/thetu`（只抽觀看／金流，不抽學院營運）

LINE 登入契約：`8-外掛/line-hub` 網頁 OAuth（不搬 PHP）

【MVP 怎麼賣】

→ 銷售頁

→ PAYUNi 結帳 8800 TWD

→ 站內看課（課程模組）

→ 站內領取代碼（GitHub 只讀邀請）

→ 課程內加入 LINE 交流群

【硬邊界】

PAYUNi 沒設金鑰時結帳必須 fail-closed，不能空白 500。

不做組織多租戶。帳單掛 user。

LINE Login Channel 做登入。學員社群是邀請連結，不能靜默入群。不做 SKOOL。

金鑰填後台。發票不在 MVP。

【已廢（不是現行規則）】

「不是賣課平台」「四堂課對 SHOPLINE」「主金流 SHOPLINE」「發票在 MVP」已廢。細節看 `docs/discuss/README.md` 與各篇開頭的取代聲明。

【網域】

盯 `startkiter.dev`。下單前再查 whois。不使用 libon.me 網域。

【部署】

正式環境使用 Coolify 管理 VPS 部署。部署前置條件、環境變數分類與驗收方式見 [`docs/vps-deployment-sop.md`](./docs/vps-deployment-sop.md)。學員乾淨安裝包的倉庫邊界、晉升 checklist 與 `promote-clean-package` 腳本見 [`docs/clean-package-promotion-guide.md`](./docs/clean-package-promotion-guide.md)。

### 自架 VPS（Docker）

任何支援 Docker 的 VPS 都可以使用同一份 `apps/saas/Dockerfile`。建置機建議至少有 4GB RAM；記憶體較小時可用 `NODE_OPTIONS=--max-old-space-size=4096` 限制 Node.js 建置記憶體：

```bash
docker build --build-arg NODE_OPTIONS=--max-old-space-size=4096 -f apps/saas/Dockerfile . -t startkiter
docker run --env-file .env -p 3000:3000 startkiter
```

請在 `.env` 填入實際部署所需的環境變數，至少包含 `DATABASE_URL`、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`；金流金鑰未設定時，結帳端點會維持既有的 fail-closed 行為。

【下一步】

對齊文件後，施工 `extract-github-kit-fulfillment`（`/spectra-apply extract-github-kit-fulfillment`）。不要在 Development 根目錄開施工單。不要改來源 repo。產品衝突以 `openspec/specs/` 為準，不以 `docs/discuss/` 舊稿為準。

---

## 🤖 AI 代理協同開發與蓋神工作流 (AI Agents & SDD)

本專案全面支援 **【通用版：蓋神 (Gaishen)】** 與 **【StartKiter 專屬開發代理】**，結合 Orca 實體房間隔離 (Worktree) 與雲端網頁即時對焦 (Artifacts)。

- 📖 **完整規範文件**：[`docs/gaishen-orca-workflow.md`](./docs/gaishen-orca-workflow.md)
- 🌐 **視覺化手冊 (即時網頁)**：[https://share.onorca.dev/a/5fkuSmAYDJLS](https://share.onorca.dev/a/5fkuSmAYDJLS)
- 📚 **Orca 官方文檔庫 (本機 SSOT)**：[`/Users/fishtv/Development/docs/orca`](file:///Users/fishtv/Development/docs/orca/)

### 快速上手 3 步驟：
1. **交代需求**：對著對話框打一句話（例如：「`叫蓋神做：實作 PAYUNi 結帳 Webhook`」）。
2. **網頁對焦**：收到蓋神發布的【提案網頁】（包含架構圖與規格表），點開確認拍板（硬停點 1）。
3. **無干擾驗收**：多個 AI 代理在獨立 Worktree 施工完畢，自動產出【完工驗收網頁】與測試證據。
