## Why

賣流 UX 已封存，但仍有可做完且不依賴老闆當場授權的缺口：課影片還是 MDN placeholder、買家錯誤文案未清乾淨、結帳 baseUrl／Bunny env 未完整接到 TEST、支援信箱未露出。kit 真邀、LINE 群邀請、Google／LINE Login callback 本張明確不做。

## What Changes

- 新增 Bunny 播放路徑：課單元可用 signed／CDN URL（env 驅動 video id），取代 MDN flower placeholder
- 修改課程目錄與 lesson 播放頁以走新媒體解析
- 修改買家可見錯誤文案（agent／demo／kit fetch）去內部 code
- 修改結帳 gateway baseUrl 明確用 BETTER_AUTH_URL（測試站網域）
- 新增頁尾／帳號支援信箱顯示（SUPPORT_EMAIL 或 EMAIL_FROM）
- 修改 Vercel Production 灌 BUNNY_*；文件標明本張跳過項

## Capabilities

### New Capabilities

- `course-media-playback`: 付費後課程媒體解析與播放契約

### Modified Capabilities

- `sell-flow-ux`: 買家錯誤／支援聯絡表面
- `payuni-checkout`: checkout 對外 URL 必須用公開 HTTPS base

## Non-Goals

- 不做 GitHub kit 真邀（缺 ORG／REPO／PEM）
- 不做 LINE 群邀請 URL 接通
- 不做 Google／LINE Login callback
- 不做乾淨安裝包晉升、發票、Organization

## Impact

- Affected specs: course-media-playback（新）, sell-flow-ux, payuni-checkout
- Affected code: packages/course, apps/saas/app/course, apps/saas/lib, packages/payments gateway baseUrl 呼叫端, docs
- Dependencies: 無新套件（Bunny HTTP）
- Env: BUNNY_LIBRARY_ID, BUNNY_LIBRARY_API_KEY(_READONLY), 可選 BUNNY_LESSON_VIDEO_MAP／每課 video id；SUPPORT_EMAIL
