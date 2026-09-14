## Context

`packages/api/modules/ai/procedures/stream-message.ts` already implements a working `/ai/stream` protected oRPC procedure that streams AI responses via `streamText`/`textModel` from `@startkiter/ai`, using `@ai-sdk/openai` against the ChatGPT model configured with `OPENAI_API_KEY`. The frontend has never been built: `apps/saas/modules/ai/` does not exist, and there is no navigation entry or route for it. `packages/platform/src/mount-points.ts` is the single registry that drives what shows up in the app navigation (see the `admin-*` entries added in the `admin-nav-orphan-pages-wireup` change for the established `PluginManifest` shape).

## Goals / Non-Goals

**Goals:**
- A working chat UI reachable from navigation by any signed-in user.
- Streamed responses rendered incrementally using `@ai-sdk/react`'s `useChat`.
- Zero backend changes beyond what already exists.

**Non-Goals:**
- Chat history persistence, multi-session chat, model/provider switching — all out of scope, see proposal Non-Goals.

## Decisions

### Reuse the existing `/ai/stream` procedure unchanged
The procedure is already implemented, protected, and tested at the API layer (`stream-message.test.ts` exists). This change only adds a consumer; it does not modify `packages/api/modules/ai/` unless a genuine gap is found while implementing (in which case it must stay within Non-Goals — e.g. adding a missing unauthenticated-rejection test is in scope, changing the authorization mechanism is not).

### Navigation entry uses no `requiresOperator` gate
Unlike the `admin-*` mount points added in `admin-nav-orphan-pages-wireup` (all `requiresOperator: true`), this entry must be visible to any signed-in user — it does not set `requiresOperator`.

### No new route group
The chat page lives under the existing `apps/saas/app/(authenticated)/(main)/` route tree (same tree hosting `course`, `app`, `support`), not a new top-level route group.

## Implementation Contract

**Behavior**: A signed-in user sees an "AI 助手" navigation entry. Clicking it opens a page with a message list and a text input. Submitting a message calls `/ai/stream`; the assistant's reply streams into the message list token-by-token (or chunk-by-chunk) as it arrives, using `useChat`'s built-in streaming state. No message persists across a page reload.

**Interface / data shape**:
- New component: `apps/saas/modules/ai/components/AiChat.tsx` — a client component using `useChat` (`@ai-sdk/react`) configured to POST to the existing `/ai/stream` procedure (via the app's existing oRPC/API client convention — follow the pattern used by another existing streaming or mutation-consuming component in `apps/saas/modules/` for how the app wires its API client into a component, rather than inventing a new fetch wrapper).
- New route: a page under `apps/saas/app/(authenticated)/(main)/` (implementer picks the exact segment name, e.g. `ai` or `assistant`, consistent with existing sibling route naming) that renders `AiChat.tsx`.
- `packages/platform/src/mount-points.ts`: one new `PluginManifest` entry (no `requiresOperator`), following the existing entry shape (`id`, `name`, `version`, `mount.route.path`, `mount.menu.{label,icon,order}`, `dataSpec: "none"`).

**Failure modes**: Stream errors (e.g. OpenAI API failure) surface in the UI as a visible error state in the chat window, not a silent failure and not an unhandled exception. Network/auth failures on an unauthenticated request are the existing `protectedProcedure` 401/redirect behavior — unchanged.

**Acceptance criteria**:
- `AiChat.test.tsx` covers: message submit triggers a call to the stream endpoint, and a streamed chunk updates the rendered message list.
- A test confirms the new mount-points entry is registered with the correct `mount.route.path` and without `requiresOperator`.
- `packages/api/modules/ai/procedures/stream-message.test.ts` already covers or is extended to cover an unauthenticated request being rejected — verify this exists; add it if missing.
- `pnpm --filter saas test` and any affected package test suites pass.

**Scope boundaries**: In scope — new component, new route, new nav entry, minimal test coverage above. Out of scope — any change to `packages/ai/`, `packages/api/modules/ai/router.ts`, or the streaming procedure's tool set (`generateSpreadsheet`), chat history storage, session management.

## Risks / Trade-offs

- The `stream-message` procedure has a 100-message input cap (`z.array(z.unknown()).min(1).max(100)`) and no persistence — long conversations lose context on reload. Accepted per Non-Goals; documented here so the implementer does not silently "fix" it by adding persistence outside this change's scope.
- No existing UI convention file was found for "how a client component calls a streaming oRPC procedure" at design time; the implementer SHALL locate the closest existing pattern in `apps/saas/modules/` before writing `AiChat.tsx`, rather than inventing a divergent API-calling convention.
