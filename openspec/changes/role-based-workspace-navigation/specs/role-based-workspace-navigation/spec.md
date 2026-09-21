## Purpose

StartKiter SHALL provide a typed navigation contract for independently installable UI modules. The contract SHALL keep learner, course-admin, and super-admin workspaces isolated while keeping the shipped developer guidance, runtime shell, demo, and tests aligned.

## ADDED Requirements

### Requirement: UI modules declare a typed platform manifest

Every installable UI module MUST declare a manifest containing a unique `id`, route path, workspace, permission, menu metadata when visible in navigation, and an i18n namespace. A menu declaration MUST contain a translation key, icon identifier, and finite order value; a child declaration MUST reference an existing parent module in the same workspace. The platform shell SHALL compose manifests and SHALL NOT require a second hand-written menu entry for the module.

#### Scenario: valid module manifest is accepted

- **WHEN** a module declares a unique id, a non-empty route, a supported workspace, a supported permission, an i18n namespace, and valid menu metadata
- **THEN** the module registry accepts the manifest and the navigation resolver can include it

#### Scenario: invalid manifest is rejected

- **WHEN** a module has an empty id, empty route, unsupported workspace, non-finite order, duplicate id, duplicate route, or an unknown parent id
- **THEN** the type check or manifest validation fails with the module id and the invalid field, and the module is not registered

##### Example: invalid manifest cases

| Input | Expected result |
| --- | --- |
| `id=""` | reject `id` |
| `route.path=""` | reject `route.path` |
| `order=Infinity` | reject `order` |
| `parentId="missing"` | reject `parentId` |

### Requirement: The resolver selects exactly one workspace

The navigation resolver MUST return exactly one workspace from `learner`, `course-admin`, or `super-admin` for each authenticated navigation request. The resolver SHALL evaluate route context and existing capabilities before filtering modules; it SHALL NOT merge all workspace menus and hide unauthorized items with CSS. The existing route guard SHALL remain the authority for server-side access.

#### Scenario: learner sees learner workspace only

- **WHEN** a signed-in learner without course-instructor or operator capability resolves navigation for `/course`
- **THEN** the result has workspace `learner` and contains no course-admin or super-admin menu item

#### Scenario: course administrator sees course workspace only

- **WHEN** a user with course-instructor capability resolves navigation for a course-admin route
- **THEN** the result has workspace `course-admin` and contains the course management parent and its permitted children without the parallel super-admin menu

#### Scenario: operator enters super-admin workspace

- **WHEN** an operator resolves navigation for an administrative route
- **THEN** the result has workspace `super-admin`, and the course entry is a single route to the course-admin workspace rather than a second copy of course children

#### Scenario: unauthorized capability does not create a menu entry

- **WHEN** a user lacks the permission declared by a module
- **THEN** the resolver omits that module from the navigation model and the existing route guard continues to deny direct unauthorized access

##### Example: permission filtering

- **GIVEN** module `course-editor` requires `course-instructor` and the user has only `signed-in`
- **WHEN** the resolver builds navigation
- **THEN** `course-editor` is absent and a direct unauthorized request remains guarded

### Requirement: Navigation supports one-level parent and child menus without duplicates

The navigation model MUST represent a first-level item with an ordered `children` collection. A module id, href, or visible menu relationship MUST appear at most once in the resolved model. The shell SHALL render one navigation surface for a workspace; an admin page SHALL NOT render a second parallel menu containing the same routes.

#### Scenario: course menu contains ordered children

- **WHEN** the course workspace resolves course, quiz, assignment, and review modules
- **THEN** the model contains one course parent with children ordered by their declared order, and each child has one href

##### Example: course child ordering

| Child | Order | Expected position |
| --- | ---: | ---: |
| `course` | 10 | 1 |
| `quiz` | 20 | 2 |
| `assignment` | 30 | 3 |
| `review` | 40 | 4 |

#### Scenario: duplicate menu registration fails

- **WHEN** two modules register the same id, href, or parent-child relationship
- **THEN** validation fails before rendering and reports the conflicting module ids

##### Example: duplicate registration

- **GIVEN** `quiz-admin` and `quiz-report` both register `/quiz-admin`
- **WHEN** the registry validates navigation
- **THEN** validation reports both ids and produces no rendered navigation model

#### Scenario: empty menu registry is safe

- **WHEN** a valid workspace has no visible modules after permission filtering
- **THEN** the resolver returns an empty `items` array for that workspace and the shell renders no stale menu from another workspace

### Requirement: Visible navigation uses complete locale catalogs

Every visible module label, workspace heading, and shared theme-control label MUST resolve through the active locale catalog using a registered translation key. The supported locales SHALL include `zh-tw`, `zh-cn`, and `en`; missing module keys SHALL fail validation and SHALL NOT render a raw key at runtime. The existing zh-tw fallback SHALL remain available for runtime resilience.

#### Scenario: locale switch updates the complete shell

- **WHEN** an authenticated user switches between `zh-tw`, `zh-cn`, and `en`
- **THEN** the workspace heading, first-level labels, child labels, and theme-control labels use the selected locale without leaving the sidebar in a previous locale

#### Scenario: missing locale key is rejected

- **WHEN** a registered module label key is missing from one supported locale catalog
- **THEN** the locale completeness check fails with the missing key and locale, and the raw key is not displayed as user-facing text

##### Example: missing English label

- **GIVEN** `course-admin.label` exists in `zh-tw` and `zh-cn` but not `en`
- **WHEN** locale completeness validation runs
- **THEN** validation reports `en:course-admin.label` and runtime does not render that raw key

#### Scenario: empty translation value is rejected

- **WHEN** a registered label key resolves to an empty or whitespace-only string
- **THEN** locale validation fails and the module cannot pass the UI contract check

##### Example: whitespace label

- **GIVEN** `admin-settings.label` is `"   "` in `zh-cn`
- **WHEN** the catalog validator runs
- **THEN** validation rejects the label as empty

### Requirement: Shared navigation uses semantic theme and responsive contracts

Shared navigation components MUST use semantic tokens for surface, foreground, muted foreground, border, focus, and accent states. They MUST NOT add dark-mode-only hardcoded text colors for shared menu content. The shell SHALL provide readable navigation at desktop width `1440px` and mobile width `390px` without horizontal overflow or content hidden behind the fixed mobile navigation.

#### Scenario: color mode changes preserve readable navigation

- **WHEN** a user switches among dark, light, and system color modes
- **THEN** the navigation foreground, background, border, active, hover, and focus states resolve from the active semantic token set and remain readable

##### Example: semantic color states

| Mode | Required foreground source |
| --- | --- |
| dark | active semantic foreground token |
| light | active semantic foreground token |
| system | resolved system theme semantic foreground token |

#### Scenario: desktop shell fits the viewport

- **WHEN** the shell renders at a `1440px` viewport
- **THEN** the sidebar, top bar, content region, and visible navigation entries fit without horizontal overflow

#### Scenario: mobile shell fits the viewport

- **WHEN** the shell renders at a `390px` viewport
- **THEN** the mobile navigation remains usable, content is not covered by it, and the document has no horizontal overflow

### Requirement: The startkiter-dev Skill guides module development from the repository

The repository SHALL ship the existing `.agents/skills/startkiter-dev/SKILL.md` as the single developer Skill entrypoint. The Skill MUST direct the developer or AI to the canonical navigation spec before creating or modifying a UI module, inspect reusable modules first, declare the typed manifest, provide locale keys and semantic tokens, and run the contract checks before browser verification. The project SHALL NOT add a second UI-specific Skill that duplicates these rules.

#### Scenario: new module workflow starts with the contract

- **WHEN** a developer asks the supported development workflow to add a UI module
- **THEN** the startkiter-dev Skill directs the workflow to read this spec, inspect existing packages, define the module manifest, and identify unit, component, locale, and browser checks before implementation

##### Example: preflight order

- **GIVEN** a request to add `course-feedback`
- **WHEN** the Skill workflow starts
- **THEN** it checks reusable packages and the manifest contract before proposing implementation files

#### Scenario: unsupported Skill discovery does not weaken enforcement

- **WHEN** an AI tool does not automatically discover repo-local Skills
- **THEN** `AGENTS.md`, typed manifest validation, automated tests, and CI checks still provide the contract, and the module cannot pass by relying only on an unverified Skill instruction

#### Scenario: duplicate developer entrypoint is not introduced

- **WHEN** the repository adds guidance for a new UI module
- **THEN** the guidance extends `startkiter-dev` or links to the canonical spec, and validation fails if a second Skill duplicates the navigation contract

### Requirement: The demo and runtime consume one navigation truth

The UX focus demo SHALL either render shared runtime components or consume a serialized fixture generated from the same module registry and navigation resolver. The demo SHALL NOT maintain independent role, route, label, child, or color literals that conflict with the runtime contract.

#### Scenario: demo matches the resolved model

- **WHEN** the demo and runtime are evaluated with the same capabilities and locale
- **THEN** their workspace id, item ids, hrefs, label keys, child order, and visible states match

##### Example: learner demo comparison

- **GIVEN** learner capabilities and locale `en`
- **WHEN** demo and runtime models are compared
- **THEN** both contain the same workspace id, href list, label keys, and child arrays

#### Scenario: demo has no unregistered module

- **WHEN** the demo references a module id or href absent from the registry
- **THEN** the demo consistency check fails and the demo cannot be treated as the approved UX reference

##### Example: stale demo entry

- **GIVEN** the demo contains `/legacy-admin` and the registry has no such route
- **WHEN** the consistency check runs
- **THEN** the check fails with `/legacy-admin`

### Requirement: Navigation changes have layered verification

Every navigation contract change MUST include pure manifest/resolver tests, component tests for shell composition, and deployed browser verification. Browser verification MUST cover learner, course-admin, and super-admin contexts; all supported locales; dark, light, and system modes; `1440px` and `390px` viewports; and every visible menu entry. A build-only result SHALL NOT satisfy this requirement.

#### Scenario: pure contract checks pass

- **WHEN** the manifest, resolver, locale, and semantic-token checks run against the registered modules
- **THEN** they verify workspace isolation, parent-child ordering, duplicate rejection, permission filtering, and locale completeness with zero failures

##### Example: contract check set

- **GIVEN** the registry contains learner, course-admin, and super-admin modules
- **WHEN** the focused contract command runs
- **THEN** it reports zero failures only when all three workspaces and all three locales pass

#### Scenario: browser verification finds a regression

- **WHEN** deployed browser verification finds a raw translation key, 401/500 response, horizontal overflow, unreadable state, duplicate menu, or workspace boundary violation
- **THEN** the change is reported as failed and SHALL NOT be marked complete even if the build succeeds

#### Scenario: visible navigation entry is activated

- **WHEN** browser verification activates each visible menu entry in a supported workspace
- **THEN** the destination route loads without a duplicate shell, unauthorized admin menu, or unhandled error

##### Example: course child activation

- **GIVEN** course-admin navigation exposes `/quiz-admin`
- **WHEN** browser verification activates the quiz child
- **THEN** `/quiz-admin` loads with one course-admin shell and no super-admin menu
