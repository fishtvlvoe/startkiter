## ADDED Requirements

### Requirement: At least three locales are supported at launch

The apps/saas application SHALL support Traditional Chinese (zh-TW), Simplified Chinese (zh-CN), and English (en) as selectable locales, using supastarter-nextjs-main's packages/i18n next-intl architecture.

#### Scenario: All three locales render the homepage

- **WHEN** a browser requests GET / with each of zh-TW, zh-CN, and en selected
- **THEN** each request MUST return HTTP 200 with page text in the corresponding language

##### Example: Locale-prefixed routes

| Locale | Path | Expected heading language |
| ----- | ----- | ----- |
| zh-TW | /zh-tw | Traditional Chinese |
| zh-CN | /zh-cn | Simplified Chinese |
| en | /en | English |

### Requirement: Locale list is extensible without component changes

Adding a new locale SHALL require only adding a new message catalog file and a new entry in the locale list constant. Adding a locale MUST NOT require editing any component file that consumes translated strings.

#### Scenario: A fourth locale is added

- **WHEN** a new message catalog file for a locale not previously listed is added and the locale list constant is updated
- **THEN** the application MUST render that locale without any change to files under apps/saas/app or packages/ui

##### Example: Adding Japanese as a fourth locale

- **GIVEN** the locale list constant currently contains `["zh-tw", "zh-cn", "en"]` and no `ja` message catalog exists
- **WHEN** a file `packages/i18n/src/locales/ja.json` is added and the locale list constant is changed to `["zh-tw", "zh-cn", "en", "ja"]`
- **THEN** GET /ja MUST return HTTP 200 with Japanese page text, and `git diff --stat` for this change MUST show no modified files under apps/saas/app or packages/ui

### Requirement: Missing translation keys fall back to zh-TW

When a translation key exists in the zh-TW catalog but is missing from another locale's catalog, the rendered page SHALL display the zh-TW text for that key rather than the raw key string.

#### Scenario: English catalog is missing a key present in zh-TW

- **WHEN** a page under the en locale renders a translation key that has no entry in the en message catalog but does have one in zh-TW
- **THEN** the rendered text MUST be the zh-TW value and MUST NOT be the literal key string (for example MUST NOT render "home.hero.title")

##### Example: Fallback in action

- **GIVEN** zh-TW catalog has `home.hero.title: "已經在用 AI 做事的人，需要的是一套 SaaS 開站包"` and the en catalog has no `home.hero.title` key
- **WHEN** GET /en renders the hero heading
- **THEN** the heading text MUST equal the zh-TW value, not the string `home.hero.title`
