## 1. Shell and tokens

- [ ] 1.1 重寫 apps/saas globals／layout：套 DESIGN token（primary #3b82f6、slate、字型、間距），拿掉舊 --accent 青綠。對應 Requirement: Design tokens drive sell-flow surfaces；Decision: 顏色／間距跟 DESIGN.md；首頁構圖跟「品牌＋一主 CTA」賣場規則。驗證：CSS 變數可見 primary blue。 [Tool: sonnet]
- [ ] 1.2 抽共用 SiteNav（未登入／已登入），已登入含 /course /checkout /agent /app。對應 Requirement: Authenticated navigation reaches core surfaces；Requirement: Site agent is discoverable in product navigation；Decision: 一張 SR 收斂賣流 UX＋導覽，不拆五張小 UI 單。驗證：登入後頁面 HTML 有 /agent 連結。 [Tool: sonnet]

## 2. Sell surfaces

- [ ] 2.1 首頁改成品牌＋一主一輔 CTA，更新 i18n 文案。對應 Requirement: Landing presents a sellable first viewport；Requirement: Home page offers the MVP purchase path；Decision: 顏色／間距跟 DESIGN.md；首頁構圖跟「品牌＋一主 CTA」賣場規則。驗證：首頁主區 CTA ≤2。 [Tool: sonnet]
- [ ] 2.2 登入／註冊／結帳／課程／agent／帳號頁套新 shell 與去工程文案（含 kit／LINE 未開放狀態）。對應 Requirement: Buyer-facing copy hides internal field names；Decision: kit／LINE invite 缺密鑰時 UI 顯示可理解的「尚未開放」而非堆 stack／內部欄位名。驗證：課程鎖權文案無 courseAccess 字樣。 [Tool: sonnet]

## 3. Dogfood wiring and close-out

- [ ] 3.1 Production 灌 OPENAI_API_KEY（本機已有）；文件更新；push test 驗證部署。對應 Decision: Production 灌 OPENAI_API_KEY 讓 /agent 可回；缺 key 仍 503。驗證：有 session 打 /api/agent/chat 不再因缺 key 503。 [Tool: sonnet]
- [ ] 3.2 Claude OK＋Codex 無 Critical 後 archive；AGENTS 標明仍卡 kit／LINE invite／社群 OAuth。驗證：CLI＋代理結論。 [Tool: sonnet]
