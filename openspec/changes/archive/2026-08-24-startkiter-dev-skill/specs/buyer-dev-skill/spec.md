## ADDED Requirements

### Requirement: A buyer-facing Skill merges the SOP, extension convention, and onboarding guide

The repository SHALL contain `.claude/skills/startkiter-dev/SKILL.md` that merges the content of `docs/startkiter-development-sop.md`, `docs/buyer-extension-convention.md`, and `docs/discuss/2026-08-21-buyer-dev-onboarding-guide-idea.md`. The Skill MUST be triggerable by a phrase describing adding a feature following StartKiter conventions.

#### Scenario: Skill file exists with required trigger language

- **WHEN** `.claude/skills/startkiter-dev/SKILL.md` is read
- **THEN** it MUST contain trigger language equivalent to "照 StartKiter 慣例加一個 X 功能" and MUST reference content from all three source documents

### Requirement: The Skill serves both a plain-language reader and an AI-technical reader in one file

The Skill SHALL present a plain-language step sequence (for a non-technical buyer) and a technical convention section (for an AI coding tool) within the same file, not as two separate documents.

#### Scenario: Plain-language steps precede or are clearly separated from technical rules

- **WHEN** `.claude/skills/startkiter-dev/SKILL.md` is read
- **THEN** it MUST contain a section describing the 4-step simplified process in plain language and a separate section with the hard technical rules (package.json shape, entry-point file, env-var injection convention)

### Requirement: The extension convention document's worked example reflects the actual current packages/course structure

`docs/buyer-extension-convention.md` SHALL reference the actual current file paths and file shapes of `packages/course`, not a stale or fabricated example. The document MUST NOT contain a broken absolute filesystem path to a non-existent worktree.

#### Scenario: Entry-point path matches the real repository layout

- **WHEN** `docs/buyer-extension-convention.md` is read
- **THEN** it MUST reference the literal path `packages/course/index.ts` (not `packages/course/src/index.ts`) as the package entry point

#### Scenario: package.json example matches the real shape

- **WHEN** `docs/buyer-extension-convention.md` is read
- **THEN** its `package.json` example MUST show `"main"` and `"types"` fields (not an `"exports"` field) and MUST show `"catalog:"` as the devDependency version pattern, matching `packages/course/package.json`'s actual content

#### Scenario: tsconfig.json example matches the real extends target

- **WHEN** `docs/buyer-extension-convention.md` is read
- **THEN** its `tsconfig.json` example MUST show `"extends": "@startkiter/tsconfig/base.json"`, matching `packages/course/tsconfig.json`'s actual content

#### Scenario: No broken absolute path to a non-existent worktree

- **WHEN** `docs/buyer-extension-convention.md` is read
- **THEN** it MUST NOT contain the string `/Users/fishtv/orca/workspaces/` and MUST instead reference `docs/core-boundary-and-extension-guide.md` as a relative path
