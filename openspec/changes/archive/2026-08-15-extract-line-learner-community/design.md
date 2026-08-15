## Context

github-kit 已封存。規格 `line-learner-community` 要求付費學員在課程區看到 LINE 邀請控制；URL 來自站設定；非客服；非靜默入群。

## Goals / Non-Goals

**Goals:**

- GET /api/community/line-invite：401／403／503／200 行為符合規格
- 課程頁付費者看得到加入控制與文案（非客服）
- 缺 URL fail-closed 503

**Non-Goals:**

- Bot／LIFF／Messaging／靜默入群／客服進群／site-agent

## Decisions

### Decision: entitlement 用 Order.courseAccess + sku startkiter-mvp

與課程觀看同一閘，避免另造旗標。退款清 courseAccess 後自然 403。

Alternatives Considered:

- 只看 status=paid → 否決：退款後可能仍 paid 歷史列歧義；雙旗標契約已用 courseAccess
- 另建 communityEligible → 否決：多餘

### Decision: URL 只讀 env LINE_COMMUNITY_INVITE_URL（本刀）

後台 settings 可後續；本刀 env 即可，缺則 503。

Alternatives Considered:

- 硬編碼 URL → 否決：進 git 風險
- 本刀做完整 settings UI → 否決：UI 延後

### Decision: UI 掛在 /course 付費區塊

與 kit panel 並列，最小控制。

Alternatives Considered:

- 只 API 無 UI → 否決：買家走不完
- 獨立 /community 頁 → 否決：範圍膨脹

## Implementation Contract

- Behavior: 未登入 401；登入無 courseAccess 403 且無 inviteUrl；有權但未設 URL 503；有權有 URL 200 + https inviteUrl
- Interface: GET /api/community/line-invite；env LINE_COMMUNITY_INVITE_URL
- Failure: 缺設定 503 非 500
- Acceptance: vitest 覆蓋閘；本機有 env 可手動看 UI
- Scope: API＋／course UI＋env example；Out: Bot／LIFF／agent

## Risks / Trade-offs

- [Risk] URL 填錯非 https → Mitigation: 校驗必須 https，否則當未設定 503
- [Risk] 文案被當成客服 → Mitigation: UI 明示「學員交流、非客服」

## Migration Plan

1. 實作 API＋UI＋測試
2. 文件 env
3. 回滾：下線 route／UI

## Open Questions

- 正式邀請連結字串（老闆填 env）；本刀可用假 https URL 測邏輯
