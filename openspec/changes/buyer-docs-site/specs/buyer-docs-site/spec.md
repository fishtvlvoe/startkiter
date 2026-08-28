## ADDED Requirements

### Requirement: A dedicated docs app renders buyer-facing technical documentation

The system SHALL provide a standalone `apps/docs` Next.js application, built with Fumadocs, that renders MDX content from `content/docs/**/*.mdx` with sidebar navigation and full-text search, independent from the `apps/marketing` and `apps/saas` applications.

#### Scenario: Visitor loads the docs home page

- **WHEN** a visitor requests the docs app root path `/`
- **THEN** the server MUST return a rendered page listing the available documentation sections in a sidebar navigation

#### Scenario: Visitor navigates into a documentation page

- **WHEN** a visitor clicks a sidebar link to any page under `content/docs/**/*.mdx`
- **THEN** the corresponding MDX content MUST render, including tables and syntax-highlighted code blocks

#### Scenario: Visitor searches documentation content

- **WHEN** a visitor enters a query into the docs search UI
- **THEN** the system MUST return matching documentation pages ranked by relevance

### Requirement: Documentation covers environment variables, local development, Core/Plugin boundaries, and upstream sync

The system SHALL publish documentation pages that explain how to configure environment variables, start local development, understand the Core/Plugin extension boundary, and use the upstream sync mechanism, derived from the existing `apps/saas/.env.example`, `README.md`, and `docs/core-boundary-and-extension-guide.md` source material.

#### Scenario: Buyer looks up whether an environment variable is required

- **WHEN** a buyer opens the environment variables documentation page
- **THEN** the page MUST list each variable from `apps/saas/.env.example` with a required-or-optional marker determined by whether the codebase provides a fallback default for that variable

#### Scenario: Buyer looks up the Core/Plugin boundary rules

- **WHEN** a buyer opens the Core/Plugin boundary documentation page
- **THEN** the page MUST list the same Core modules, Mount Point kinds (`route`, `menu`, `content`), and `dataSpec` values (`"content"`, `"none"`) as defined in `docs/core-boundary-and-extension-guide.md` and enforced by `packages/platform/src/types.ts`

#### Scenario: Buyer looks up how to pull upstream updates

- **WHEN** a buyer opens the upstream sync documentation page
- **THEN** the page MUST describe the `git fetch startkiter-upstream` and `git merge` workflow and state that merge conflicts from buyer-modified Core files are the buyer's responsibility

### Requirement: Deployment documentation is scaffolded but explicitly marked incomplete

The system SHALL publish a deployment documentation section with section headings and a placeholder notice, and SHALL NOT publish specific deployment operational steps as finalized content until those steps have been validated by a separate change.

#### Scenario: Buyer opens the deployment section before it is filled in

- **WHEN** a buyer opens the deployment documentation section
- **THEN** the page MUST display an explicit notice stating that detailed deployment steps are pending and MUST NOT present unvalidated deployment commands as authoritative instructions

### Requirement: Adding the docs app does not break existing monorepo builds

The system SHALL add `apps/docs` as an independent workspace package without modifying the build, type-check, or runtime behavior of `apps/marketing` or `apps/saas`.

#### Scenario: Monorepo-wide build succeeds after adding the docs app

- **WHEN** `pnpm build` runs at the repository root after `apps/docs` is added
- **THEN** the build MUST succeed for `apps/marketing`, `apps/saas`, and `apps/docs`, and no existing app's build output MUST change as a result of adding `apps/docs`

#### Scenario: Monorepo-wide type-check succeeds after adding the docs app

- **WHEN** `pnpm type-check` runs at the repository root after `apps/docs` is added
- **THEN** the check MUST pass for all workspace packages including the new `apps/docs` package
