## Context

TEST 站已能 email 登入與賣流 UX。課影片仍是 MDN placeholder；Bunny library 416184 已有三支影片。kit／LINE 群／社群 OAuth 本張不做。

## Goals / Non-Goals

**Goals:**

- 付費後課單元播 Bunny 影片（embed 或 CDN）
- 買家錯誤文案去內部 code
- 結帳 Return／Notify URL 用 BETTER_AUTH_URL（startkiter.aiver.me）
- 露出支援信箱；BUNNY env 上 Vercel

**Non-Goals:**

- kit 真邀、LINE 群邀請、Google／LINE Login callback

## Decisions

### Decision: Bunny 用 iframe.mediadelivery.net/embed/{libraryId}/{guid}，video id 由 env 或目錄常數對應三課

Alternatives: 自簽 MP4 URL（複雜）→ 本張否決；繼續 MDN flower → 否決。

### Decision: 缺 Bunny 設定時 fail 回 placeholder 並在 UI 標「示範影片」，不准空白炸頁

Alternatives: 缺設定就 500 → 否決。

### Decision: 買家錯誤一律映射繁中；原始 error code 只進 server log

Alternatives: 直接顯示 provider_failed → 否決。

### Decision: 支援信箱讀 SUPPORT_EMAIL，空則 EMAIL_FROM，再空則不顯示區塊

Alternatives: 硬編碼 → 否決。

## Implementation Contract

- Behavior: 有權限播課時 lesson 頁出現 Bunny embed（或明示示範影片）；結帳 session 的 Return／Notify host = BETTER_AUTH_URL；錯誤提示無內部 code；有支援信箱則頁尾可見。
- Failure: Bunny 缺 library／video → placeholder + 文案；缺 SUPPORT → 不顯示。
- Acceptance: 三課可播非 MDN 網址（或文件註明 fallback）；Vercel 有 BUNNY_*；spectra validate 過。
- Scope: course media、saas UI 錯誤／footer、env、docs。Out: kit／LINE invite／社群 OAuth。

## Risks / Trade-offs

- [Risk] Bunny iframe 與權限閘 → Mitigation: 仍只在 entitled 頁渲染 URL；目錄 API 不洩未授權 media。
- [Risk] 影片內容是 buygo acceptance 非開站包課綱 → Mitigation: 標題維持開站包文案；本張目標是接通播放管線，內容可後換 guid。

## Migration Plan

1. Artifact＋Claude 2. 實作＋灌 env 3. push 4. Codex 5. archive

## Open Questions

- 無（內容換正式成片另開）
