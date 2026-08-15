## Why

extract 與 TEST 部署已封存，但買家在 `startkiter.aiver.me` 看到的仍是工程灰模：導覽斷線、文案露內部詞、UI 未對齊 DESIGN、agent 找不到。產品可用度被誤判成「規格抽完＝能賣」。

## What Changes

- 新增／重做賣流表面 UI：首頁、登入／註冊、結帳、課程、帳號、agent，對齊 DESIGN.md token 與可賣文案
- 修改全站導覽：登入後可達 course／checkout／agent／帳號；首頁 CTA 收斂成一主一輔
- 修改課程／kit／LINE 區塊文案，去掉 courseAccess 等工程用語
- 修改 Vercel Production：灌入可狗糧的 OPENAI（agent）；DEMO 維持可關文件說明
- 修改 docs／AGENTS：標明 kit／LINE invite／社群 OAuth 仍卡老闆密鑰

## Capabilities

### New Capabilities

- `sell-flow-ux`: 賣流表面的視覺、導覽與文案契約

### Modified Capabilities

- `mvp-offer`: 首頁價值主張與購買 CTA 行為
- `site-agent`: agent 必須可從導覽到達

## Non-Goals

- 不做 Google／LINE Login callback（老闆外出暫跳過）
- 不假裝完成 kit（缺 ORG／REPO／PEM）
- 不抽乾淨安裝包、不做發票、不做 Organization
- 不重寫 PAYUNi／auth 核心協定

## Impact

- Affected specs: mvp-offer, site-agent, sell-flow-ux（新）
- Affected code: apps/saas/app/**, apps/saas/app/globals.css, packages/i18n, docs/deploy-and-public-url.md, AGENTS.md
- Dependencies: 無新套件（字型可用 CDN／next/font）
- Env: OPENAI_API_KEY（Production）；kit／LINE invite 仍待老闆
