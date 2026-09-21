## Purpose

StartKiter SHALL provide a typed, CI-enforced registration contract for adding a new App to the platform, and SHALL keep developer-only vocabulary out of learner-facing surfaces.

## ADDED Requirements

### Requirement: A new App registers through a typed manifest validated at CI time

Every new App MUST submit an `AppRegistrationManifest` containing a unique `appId`, a `displayName`, a `route.basePath`, menu metadata with light and dark icon identifiers, eligibility rules, an i18n namespace, supported locales, and test references. CI MUST validate the manifest before the App enters the App registry; the system SHALL NOT accept a partially registered App.

#### Scenario: valid registration is accepted

- **WHEN** an App manifest declares a unique `appId`, a non-reserved `displayName`, a non-conflicting `route.basePath`, both icon variants, and all three supported locale keys
- **THEN** CI accepts the manifest and the App registry includes it

#### Scenario: missing required field is rejected

- **WHEN** an App manifest is missing `displayName`, `route.basePath`, `icon.light`, `icon.dark`, or any of the three supported locale keys
- **THEN** CI fails and lists each missing field

##### Example: rejected registrations

| Missing field | Expected CI result |
| --- | --- |
| `icon.dark` | reject, list `icon.dark` |
| `route.basePath` | reject, list `route.basePath` |
| `supportedLocales` missing `en` | reject, list `en` |

#### Scenario: duplicate appId or route is rejected

- **WHEN** a new manifest declares an `appId` or `route.basePath` already used by a registered App
- **THEN** CI fails and reports the conflicting App id

### Requirement: displayName is owned by the App's own admin and blocks reserved words

`displayName` MUST be settable only by a user with `app-admin` role for that specific App. `displayName` MUST be 1 to 20 characters, non-blank, and MUST NOT equal a reserved workspace noun ("總管理員" or "使用者"). Updating `displayName` MUST NOT require a redeploy for the new value to appear in resolved navigation labels.

#### Scenario: app-admin updates displayName

- **GIVEN** an app-admin for App `design`
- **WHEN** they set `displayName` to "圖片設計"
- **THEN** the change is accepted and the next navigation resolve for that App shows workspace label "圖片設計管理員"

#### Scenario: non-admin cannot set displayName

- **WHEN** a user with only `app-user` role for an App attempts to set `displayName`
- **THEN** the request is rejected by the existing permission layer

#### Scenario: reserved word is rejected

- **WHEN** a `displayName` update submits the value "總管理員" or "使用者"
- **THEN** validation rejects the update and the previous `displayName` remains in effect

##### Example: reserved word rejection

| Submitted value | Expected result |
| --- | --- |
| `"總管理員"` | reject |
| `"使用者"` | reject |
| `""` | reject (blank) |
| `"圖片設計"` | accept |

### Requirement: The startkiter-dev Skill guides new App registration from the repository

The repository SHALL extend the existing `.agents/skills/startkiter-dev/SKILL.md` with an App-registration section that directs the developer or AI to check for a reusable existing App, fill the typed `AppRegistrationManifest`, provide both icon variants, cover all three supported locales, and attach unit and browser test references before implementation. The project SHALL NOT add a second Skill duplicating this flow.

#### Scenario: new App workflow starts with the manifest contract

- **WHEN** a developer asks the supported development workflow to add a new App
- **THEN** the startkiter-dev Skill directs the workflow to check reusable Apps, complete the registration manifest fields, and identify unit and browser checks before implementation

#### Scenario: unsupported Skill discovery does not weaken enforcement

- **WHEN** an AI tool does not automatically discover repo-local Skills
- **THEN** the CI-enforced manifest validation still blocks an incomplete App registration regardless of whether the Skill was read

### Requirement: Developer-only vocabulary is excluded from learner-facing text

Terms `manifest`, `resolver`, `registry`, and `workspace context` MUST NOT appear in user-visible UI copy, `docs/tutorials/`, or marketing/help documentation. These terms MAY appear in `.agents/skills/`, `openspec/`, source code, and code comments.

#### Scenario: forbidden developer term in UI copy is rejected

- **WHEN** a static check scans user-visible UI copy and `docs/tutorials/` for `manifest`, `resolver`, `registry`, or `workspace context`
- **THEN** the check fails and lists the offending file and term

#### Scenario: developer vocabulary in code comments is allowed

- **WHEN** the same scan encounters `manifest` inside a TypeScript code comment or `.agents/skills/startkiter-dev/SKILL.md`
- **THEN** the scan does not flag it

##### Example: scan scope

| Location | Scan result |
| --- | --- |
| `apps/saas/modules/**` UI copy | flagged if term found |
| `docs/tutorials/**` | flagged if term found |
| `.agents/skills/startkiter-dev/SKILL.md` | not scanned |
| `packages/platform/src/app-registry/*.ts` comments | not scanned |
