## Context

`packages/ai/index.ts` currently exports `textModel` as a module-load-time constant (`openai("gpt-4o-mini")`), imported by three callers verified via repo-wide grep: `packages/api/modules/ai/procedures/stream-message.ts` (the AI chat endpoint this change is primarily about), `packages/support/src/generate-diagnosis.ts` (an unrelated support-diagnosis feature), and `apps/saas/app/api/course/ai/route.ts` (course AI notes generation). Two existing settings patterns already solve "one site-wide, admin-editable, sensitive setting stored via `db.siteSetting`":

- `packages/payments/gateway-settings.ts` — a single-row, site-wide `enabledGateway` selection (not per-user), read via `loadCheckoutGatewayCredentials`, exposed through `admin/settings/checkout-gateway/page.tsx` (operator-only).
- `packages/api/modules/course/lib/gemini-settings.ts` — a per-`instructorId` encrypted API key, using `packages/api/modules/course/lib/settings-crypto.ts`'s `encryptSettingsJson`/`decryptSettingsJson` with `SETTINGS_ENCRYPTION_KEY`.

This change needs the site-wide selection shape of the first pattern combined with the encryption mechanism of the second, applied to a new setting: which provider/model the AI assistant uses.

## Goals / Non-Goals

**Goals:**
- One site-wide `siteSetting` row holding: active provider (`openai` | `gemini`), the selected model string for that provider, and (for `gemini`) an encrypted API key.
- `textModel` becomes a function resolved per-request, not a load-time constant, with a safe fallback.
- Admin-only settings page mirroring `checkout-gateway`'s page structure and authorization.

**Non-Goals:**
- Per-user or per-instructor provider selection (see proposal Non-Goals).
- Any provider beyond OpenAI/Gemini, or any model beyond `textModel` (see proposal Non-Goals).
- Changing the behavior of `generate-diagnosis.ts` or `apps/saas/app/api/course/ai/route.ts` beyond the mechanical update from constant-import to function-call required by the `textModel` interface change — their own model choice/logic is out of scope.

## Decisions

### Reuse `settings-crypto.ts` directly, do not fork it
`encryptSettingsJson`/`decryptSettingsJson` are generic (string payload + secret in, ciphertext out). The new setting's read/write module imports them directly rather than duplicating encryption logic.

### One fixed `siteSetting` id, not a per-entity id
Unlike `gemini-settings.ts`'s `getGeminiSettingId(instructorId)`, this setting uses one constant id (e.g. `"ai-provider-config"`) — no suffix — because it is site-wide by design (see proposal Non-Goals: no per-user/per-instructor variant).

### `textModel` becomes an async resolver function; ALL THREE known callers must be updated
`packages/ai/index.ts` currently does `export const textModel = openai("gpt-4o-mini")`. This change replaces that export with an async function (name to be decided by the implementer following the package's existing export-naming convention, e.g. `resolveTextModel()`) that reads the stored config and returns the appropriate AI SDK model object. Every current caller — verified by repo-wide grep to be exactly three: `packages/api/modules/ai/procedures/stream-message.ts`, `packages/support/src/generate-diagnosis.ts`, and `apps/saas/app/api/course/ai/route.ts` — must be updated to call the function instead of importing a constant. The implementer SHALL re-run the grep before removing the constant, in case a caller was added since this design was written.

### Fallback is silent-safe, not silent-broken
On missing/malformed config or Gemini key decryption failure, resolve to `openai("gpt-4o-mini")` (the current hardcoded default) rather than throwing. This keeps existing chat behavior working even if this change's new config path has a bug, satisfying the spec's fallback requirement.

## Implementation Contract

**Behavior**: An admin opens a new settings page (route path chosen by implementer following existing `admin/settings/*` naming, e.g. `admin/settings/ai-provider`), sees the current provider selection (defaulting to "OpenAI" / "gpt-4o-mini" when nothing is saved), picks a provider, picks a model for that provider, and — if Gemini — enters an API key (write-only field, never pre-filled with a decrypted value; page shows only configured/not-configured status). Saving persists the setting; the next AI chat request (from any of the three callers) uses it.

**Interface / data shape**:
- New module (path decided by implementer, e.g. `packages/api/modules/ai/lib/provider-settings.ts`) exporting: a read function returning the current `{ provider: "openai" | "gemini"; model: string; hasGeminiKey: boolean }` (never the raw key), and a write function accepting the same shape plus an optional new Gemini API key to encrypt and store (omitting the key on write means "keep existing key unchanged", matching `checkout-gateway`'s "leave blank to keep current key" convention).
- Stored as one `db.siteSetting` row (fixed id) whose ciphertext, once decrypted, is a JSON payload of `{ provider, model, geminiApiKey? }` — same encrypt/decrypt call shape as `gemini-settings.ts`.
- `packages/ai/index.ts`: replace `export const textModel = openai(...)` with an async resolver function; update all three verified callers to call it per-request instead of importing a constant.
- New dependency `@ai-sdk/google` added to `packages/ai/package.json` and `pnpm-workspace.yaml` catalog, pinned to a specific version the implementer confirms is compatible with the existing `ai` package major version already in use (check `packages/ai/package.json`'s current `ai` version before picking).

**Failure modes**: Any read/parse/decrypt failure during model resolution falls back to `openai("gpt-4o-mini")` and logs a warning (do not throw from the chat request path). The settings page itself, on save failure, follows `checkout-gateway`'s existing error-display convention (redirect with an `?error=` query param), not a new pattern.

**Acceptance criteria**:
- A test confirms: no config saved → resolver returns the `gpt-4o-mini` OpenAI model.
- A test confirms: Gemini config saved with an intentionally-corrupted ciphertext (or wrong `SETTINGS_ENCRYPTION_KEY` simulated) → resolver falls back to `gpt-4o-mini`, does not throw.
- A test confirms: a non-operator user requesting the new settings page is redirected/denied, matching `checkout-gateway`'s existing authorization test pattern.
- A test confirms: saving Gemini config without submitting a new API key preserves the previously stored key (not cleared).
- `pnpm test` (full monorepo) and specifically the `@startkiter/ai`, `@startkiter/api`, `@startkiter/support`, and `@startkiter/saas` package test suites pass.

**Scope boundaries**: In scope — the new settings page, the new read/write settings module, `textModel`'s conversion to a resolver, the new `@ai-sdk/google` dependency, updating all three verified callers, tests above. Out of scope — `imageModel`/`audioModel`, any change to `admin/settings/gemini` (course-notes) or `admin/settings/checkout-gateway` themselves, any provider beyond OpenAI/Gemini, any behavior change to `generate-diagnosis.ts` or the course AI notes route beyond the mechanical caller update.

## Risks / Trade-offs

- Converting `textModel` from a constant to a function is a breaking change to `packages/ai`'s public interface; all three verified callers must be updated in the same change (see Decisions).
- Adding `@ai-sdk/google` introduces a new external dependency and its own auth/quota surface; this change only wires the SDK object, it does not provision or validate a working Gemini account — an invalid key still saves (the failure surfaces at chat-request time via the fallback, not at save time), which is a deliberate trade-off to keep the settings page simple, documented here so it isn't treated as a bug.
- `generate-diagnosis.ts` and the course AI notes route will now also be affected by whatever provider/model the admin picks for the AI assistant, even though this setting's UI framing is "AI 助手" — this is a side effect of `textModel` being shared infrastructure, not a new capability being added to those two features. Documented here so it is a known, accepted trade-off rather than a surprise discovered later.
