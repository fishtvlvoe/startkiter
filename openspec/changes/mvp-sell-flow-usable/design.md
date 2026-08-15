## Context

TEST 站 `https://startkiter.aiver.me` 已能 email 登入。表面仍是灰模：system-ui、青綠色自創色票、多 CTA 擠一排、無 agent 導覽。DESIGN.md 是工作區 UI SSOT。

## Goals / Non-Goals

**Goals:**

- 賣流頁面對齊 DESIGN token（色、字、間距、圓角）
- 首頁可讀成「開站包」賣場：品牌、一句價值、一主 CTA、一輔 CTA
- 登入後導覽含課程、結帳、助手、帳號
- agent 可被發現；文案去工程味

**Non-Goals:**

- 社群 OAuth、kit 真邀、真課影片換 Bunny（可下張）、後台 settings UI 完整 CRUD

## Decisions

### Decision: 一張 SR 收斂賣流 UX＋導覽，不拆五張小 UI 單

Alternatives: 每頁一張 SR → 否決（佇列空轉）；只改 CSS 不改文案／導覽 → 否決（完成度錯覺依舊）。

### Decision: 顏色／間距跟 DESIGN.md；首頁構圖跟「品牌＋一主 CTA」賣場規則

Alternatives: 完全照舊青綠色灰模 → 否決；做成 dashboard 多卡 → 否決。

### Decision: Production 灌 OPENAI_API_KEY 讓 /agent 可回；缺 key 仍 503

Alternatives: 假 echo → 否決（誤導）。

### Decision: kit／LINE invite 缺密鑰時 UI 顯示可理解的「尚未開放」而非堆 stack／內部欄位名

Alternatives: 繼續露 courseAccess／503 JSON → 否決。

## Implementation Contract

- Behavior: 未登入首頁主 CTA 指結帳或註冊；登入後導覽可到 /course /checkout /agent /app；視覺 token 來自 DESIGN；agent 有 key 時可對話。
- Failure: 缺 OPENAI → agent 明確不可用文案；缺 kit env → 領取區說明尚未開放。
- Acceptance: 手機寬度可完成註冊→進課程導覽；首頁無四顆同級 CTA；spectra validate 過。
- Scope: apps/saas UI、i18n、docs、Vercel OPENAI。Out: OAuth callback、kit PEM、乾淨包。

## Risks / Trade-offs

- [Risk] 大改 CSS 弄壞既有表單 → Mitigation: 保留 class 名漸進換 token；ego 點過註冊／課程。
- [Risk] DEMO_GRANT 在 Production 誤導 → Mitigation: UI 標「測試站 Demo」；文件寫可關。

## Migration Plan

1. Artifact＋Claude OK 2. 改 UI／導覽／env 3. push test 自動部 4. Codex CR 5. archive

## Open Questions

- 正式課影片何時換 Bunny（本張可用較好的 placeholder 文案，不強制換源）
