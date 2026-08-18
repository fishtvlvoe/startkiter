## MODIFIED Requirements

### Requirement: Monorepo shell boots locally

The StartKiter workspace SHALL provide a pnpm monorepo with apps/marketing serving Traditional Chinese public pages (home, blog, changelog, contact, legal) and apps/saas serving authenticated product functionality (login, signup, course, checkout, account) without requiring PAYUNi keys. Source repositories MUST NOT be modified by this change.

#### Scenario: Public home responds without payment keys

- **WHEN** an operator starts apps/marketing with DATABASE_URL and BETTER_AUTH_SECRET set and without PAYUNi keys
- **THEN** GET / MUST return HTTP 200 and MUST NOT return HTTP 500

##### Example: 無金流金鑰仍能開首頁

- 環境變數含 DATABASE_URL 與 BETTER_AUTH_SECRET，缺少任何 PAYUNi 相關鍵
- 開發伺服器啟動後對 GET / 回應 200，body 為繁中公開頁

#### Scenario: Workspace root has the shell packages

- **WHEN** the rebuild-from-official-upstream change is applied
- **THEN** package.json, pnpm-workspace.yaml, apps/marketing, apps/saas, packages/auth, and packages/database MUST exist at the workspace root

##### Example: Required workspace entries

- `test -f package.json`, `test -f pnpm-workspace.yaml`, `test -d apps/marketing`, `test -d apps/saas`, `test -d packages/auth`, and `test -d packages/database` all return success

## REMOVED Requirements

### Requirement: Locale is zh-TW only

**Reason**: This requirement duplicated behavior already normatively defined by the `i18n-multilingual` capability's "At least three locales are supported at launch" and "Missing translation keys fall back to zh-TW" requirements. Keeping the same locale-support contract defined in two places under misleading, contradictory titles (this requirement's title says "zh-TW only" while its body requires three locales) created confusion about which capability owns locale behavior.

**Migration**: Locale support behavior is governed solely by the `i18n-multilingual` capability going forward. No behavior change; `saas-shell` no longer restates it.
