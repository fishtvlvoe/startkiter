## Why

課、kit、LINE 社群已落地；MVP 還差站內 agent：可對話、只掛兩支唯讀自用工具（訂單／課程進度），缺金鑰 fail-closed。

## What Changes

- 修改能力 `site-agent`：落地 POST /api/agent/chat、工具白名單 `get_my_orders`／`get_my_course_progress`（只查自己）。
- 新增 `packages/site-agent`（或同等）：provider 選擇（有 key 的 OpenAI／Gemini／Claude 其一）、tool registry、session 閘。
- 課程或 /app 掛最小聊天 UI。
- 更新 AGENTS／config 本刀範圍；禁止寫入工具、禁止查他人資料。

## Non-Goals

- 不做寫入工具、admin 工具、多租戶 agent。
- 不做發票、UI 精修、test-startkiter 部署開通。
- 不抽完整 supastarter AI 行銷模組。

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `site-agent`: 從規格落地為可呼叫 chat API＋兩支唯讀工具＋最小 UI。

## Impact

- Affected specs: `site-agent`
- Affected code:
  - New: `packages/site-agent/`, `apps/saas/app/api/agent/chat/route.ts`, `apps/saas/app/agent/`（或 course 內嵌）
  - Modified: `AGENTS.md`, `openspec/config.yaml`, `apps/saas/.env.example`, `apps/saas/package.json`
  - Removed: (none)
- Dependencies 新增: （實作時若需官方 SDK 再列；可先用 fetch）
- 環境變數新增: 沿用 OPENAI_API_KEY／GEMINI_API_KEY（擇一即可）；可選 ANTHROPIC_API_KEY
