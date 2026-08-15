## Context

LINE 社群已封存。規格要求 chat + 恰好兩支唯讀自用工具。

## Goals / Non-Goals

**Goals:** 401／400／503／200 chat；工具只回呼叫者資料；未知工具拒絕。

**Non-Goals:** 寫入工具、完整 AI 產品化、進度持久化表（本刀可回「可存取課表／是否有權」作為 progress 最小形狀）。

## Decisions

### Decision: packages/site-agent 純邏輯 + saas route 接 session

Alternatives: 全塞 apps/saas → 否決：難測。

### Decision: Provider 優先序 OpenAI → Gemini → Anthropic（誰有 key 用誰）；皆無 503

Alternatives: 強制三家同時 → 否決。

### Decision: get_my_course_progress 本刀回 lesson 清單＋courseAccess 狀態（無獨立 progress 表則 status=not_tracked）

Alternatives: 本刀建 progress 表 → 否決：超出最小履約；可後續。

### Decision: 最小 UI 掛 /agent

Alternatives: 只 API → 否決。

## Implementation Contract

- POST /api/agent/chat { message: string } → { assistantMessage, toolTraces? }
- Tools: get_my_orders(userId)、get_my_course_progress(userId)；未知工具拒絕
- 缺 provider key → 503；空 message → 400；未登入 → 401
- Acceptance: vitest 工具隔離＋mock provider；type-check

## Risks / Trade-offs

- [Risk] 真 LLM 不穩 → Mitigation: 測試用 mock provider；真 key 可選
- [Risk] progress 無表被誤解 → Mitigation: 回傳欄位標 not_tracked

## Migration Plan

1. package＋route＋UI＋測試 2. archive 3. 回滾下線 route

## Open Questions

- 正式預設 provider（env 決定即可）
