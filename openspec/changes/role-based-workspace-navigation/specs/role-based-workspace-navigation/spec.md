## Purpose

StartKiter SHALL provide an App-scoped navigation contract shared by every installable App. The contract SHALL keep the platform (super-admin) workspace and each App's admin/user workspaces isolated, use data-driven visible role labels, and keep the runtime shell and demo aligned.

## ADDED Requirements

### Requirement: Workspace is scoped to the platform or to a single App

The system MUST represent the current navigation context as `WorkspaceContext`, a union of `{ scope: "platform" }` and `{ scope: "app"; appId: string; role: "app-admin" | "app-user" }`. The system SHALL NOT represent workspace as a fixed enum of App names; adding a new App MUST NOT require changing the `WorkspaceContext` type definition.

#### Scenario: platform scope resolves for an operator

- **WHEN** an operator resolves navigation for an administrative platform route
- **THEN** the result has `{ scope: "platform" }` and the workspace label resolves to the fixed string "總管理員"

#### Scenario: app scope resolves with the requesting App id

- **WHEN** a user resolves navigation for `/course`
- **THEN** the result has `{ scope: "app", appId: "course", role }` where `role` matches the user's capability for the `course` App

##### Example: adding a new App requires no type change

| Change | Required type edit |
| --- | --- |
| Register `design` App in the App registry | none — `appId` is a registry value, not a type literal |
| Register `community` App in the App registry | none — `appId` is a registry value, not a type literal |

### Requirement: The resolver selects exactly one workspace context

The navigation resolver MUST return exactly one `WorkspaceContext` for each authenticated navigation request. The resolver SHALL evaluate route context and existing capabilities before filtering modules; it SHALL NOT merge platform and App menus and hide unauthorized items with CSS. The existing route guard SHALL remain the authority for server-side access.

#### Scenario: app-user sees only that App's user workspace

- **WHEN** a signed-in user without admin capability for `course` resolves navigation for `/course`
- **THEN** the result has `{ scope: "app", appId: "course", role: "app-user" }` and contains no admin menu item

#### Scenario: app-admin sees only that App's admin workspace

- **WHEN** a user with admin capability for `course` resolves navigation for a course admin route
- **THEN** the result has `{ scope: "app", appId: "course", role: "app-admin" }` and contains the course admin parent and its permitted children without the platform menu

#### Scenario: super-admin enters platform scope

- **WHEN** an operator resolves navigation for an administrative platform route
- **THEN** the result has `{ scope: "platform" }`, and each App is a single entry point into that App's `app-admin` workspace rather than a duplicated child menu

#### Scenario: unauthorized capability does not create a menu entry

- **WHEN** a user lacks the role required by a module in the current App
- **THEN** the resolver omits that module from the navigation model and the existing route guard continues to deny direct unauthorized access

##### Example: permission filtering

- **GIVEN** module `course-editor` requires `app-admin` in `course` and the user has only `app-user` in `course`
- **WHEN** the resolver builds navigation
- **THEN** `course-editor` is absent and a direct unauthorized request remains guarded

### Requirement: A person can hold different roles in different Apps

Role resolution MUST be evaluated per `(userId, appId)` pair, not as a single site-wide role. Platform (`scope: "platform"`) access MUST be an independent site-wide capability that is not tied to any `appId`.

#### Scenario: same person, different App roles

- **GIVEN** a user with `app-admin` capability for `course` and only `app-user` capability for `design`
- **WHEN** the resolver evaluates navigation for `/course` and then for `/design`
- **THEN** `/course` resolves `role: "app-admin"` and `/design` resolves `role: "app-user"` in the same session

#### Scenario: super-admin resolves app-admin role inside any App

- **WHEN** an operator resolves navigation for a route inside App `design`
- **THEN** the result has `{ scope: "app", appId: "design", role: "app-admin" }`, derived without a separately stored per-App role record

### Requirement: Navigation supports one-level parent and child menus without duplicates

The navigation model MUST represent a first-level item with an ordered `children` collection. A module id, href, or visible menu relationship MUST appear at most once in the resolved model. The shell SHALL render one navigation surface for a workspace; an admin page SHALL NOT render a second parallel menu containing the same routes.

#### Scenario: course App admin menu contains ordered children

- **WHEN** the `course` App-admin workspace resolves course, quiz, assignment, and review modules
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

#### Scenario: course learner route renders no admin menu

- **WHEN** a `course` app-user requests `/course`
- **THEN** the rendered shell contains only the course App-user navigation surface, and `/admin/course` is not reachable from that surface

#### Scenario: course admin route renders one menu, not two

- **WHEN** a `course` app-admin requests `/admin/course`
- **THEN** the rendered shell contains exactly one navigation surface, and no second parallel horizontal admin menu is rendered

##### Example: real duplicate-label pairs observed before this change (must not recur)

| Route | Sidebar label (pre-existing `mount-points.ts`) | Parallel horizontal menu label (pre-existing `admin/layout.tsx` + `SettingsMenu`) |
| --- | --- | --- |
| `/admin/course` | 課程管理 | 課程管理 |
| `/admin/users` | 後台設定 | 用戶 |
| `/admin/orders` | 訂單管理 | 訂單列表 |
| `/admin/revenue` | 營收報表 | 營收結算 |
| `/admin/organizations` | 組織管理 | 組織 |
| `/admin/settings/checkout-gateway` | 系統設定（群組） | 結帳金流 |

#### Scenario: admin layout does not render a second menu component

- **WHEN** `/admin/course` (or any admin route) renders
- **THEN** the admin layout does not mount a second, independently-maintained menu component alongside the primary navigation surface, and removing that second component does not remove any route the primary navigation surface already exposes

#### Scenario: removing the duplicate menu also fixes the mobile overflow it caused

- **GIVEN** the pre-existing parallel horizontal menu rendered its items in a single non-wrapping row, producing roughly `730px` of content width at a `390px` viewport
- **WHEN** the parallel menu is removed and `/admin/course` renders only the primary navigation surface
- **THEN** the admin content area fits within `390px` without horizontal overflow

### Requirement: Menu labels resolve through the active locale catalog, not hardcoded strings

Every `menu.labelKey` in an `AppManifestEntry` MUST be a key resolvable through the active locale catalog for `zh-tw`, `zh-cn`, and `en`. A manifest SHALL NOT declare a literal display string (e.g. a Chinese phrase) as `menu.labelKey`. The rendered navigation label MUST be resolved at render time from the current locale, not baked into the manifest data.

#### Scenario: locale switch updates the sidebar, not only the main content

- **WHEN** an authenticated user switches locale from `zh-tw` to `en`
- **THEN** the workspace heading and every first-level and child menu label re-resolve to `en` in the same render, matching the main content's language

#### Scenario: hardcoded display string in labelKey is rejected

- **WHEN** a module registers `menu.labelKey` containing a literal Chinese or English phrase instead of a catalog key
- **THEN** manifest validation fails and reports the module id and the offending value

##### Example: labelKey validation

| `menu.labelKey` value | Expected result |
| --- | --- |
| `"nav.course.admin"` | accept (resolvable key) |
| `"課程管理"` | reject (literal string, not a key) |
| `""` | reject (empty) |

#### Scenario: pre-existing hardcoded labels are migrated, not left in parallel

- **GIVEN** `mount-points.ts` previously declared menu labels as literal strings (e.g. `label: "課程管理"`) with no locale key
- **WHEN** the migration to `AppManifestEntry` completes
- **THEN** no menu-producing module in the registry still declares a literal display string in place of `labelKey`

### Requirement: Visible role labels are data-driven and forbid legacy nouns

The system MUST resolve visible workspace labels as follows: `{ scope: "platform" }` resolves to the fixed string "總管理員"; `{ scope: "app", role: "app-admin" }` resolves to `"${App.displayName}管理員"` where `displayName` comes from the App registry; `{ scope: "app", role: "app-user" }` resolves to the fixed string "使用者" regardless of `appId`. The system SHALL NOT render "平台管理員", "模組管理員", or "學員" in any user-visible text or in the demo.

#### Scenario: app-admin label uses the App's own name

- **GIVEN** App `course` has `displayName` "課程" and App `design` has `displayName` "設計"
- **WHEN** an app-admin resolves navigation in each App
- **THEN** the `course` workspace label is "課程管理員" and the `design` workspace label is "設計管理員"

#### Scenario: app-user label ignores the App name

- **WHEN** an app-user resolves navigation in any App
- **THEN** the workspace label is the fixed string "使用者", not the App's `displayName` combined with any role noun

#### Scenario: forbidden legacy nouns are rejected

- **WHEN** a static check scans user-visible UI copy and the demo for "平台管理員", "模組管理員", or "學員"
- **THEN** the check fails and lists the offending file and string

##### Example: forbidden noun scan scope

| Scanned | Excluded |
| --- | --- |
| `apps/saas/modules/**` UI copy | `openspec/changes/archive/**` |
| `docs/ux/startkiter-sr-architecture-focus.html` | `docs/discuss/**` |

### Requirement: The demo and runtime consume one navigation truth

The UX focus demo SHALL either render shared runtime components or consume a serialized fixture generated from the same App registry and navigation resolver. The demo SHALL NOT maintain independent App, role, route, label, or child literals that conflict with the runtime contract.

#### Scenario: demo matches the resolved model

- **WHEN** the demo and runtime are evaluated with the same capabilities and locale
- **THEN** their `workspace`, item ids, hrefs, label keys, and child order match

##### Example: app-user demo comparison

- **GIVEN** `course` app-user capabilities and locale `zh-tw`
- **WHEN** demo and runtime models are compared
- **THEN** both contain the same workspace label "使用者", href list, and child arrays

#### Scenario: demo has no unregistered App or module

- **WHEN** the demo references an `appId`, module id, or href absent from the registry
- **THEN** the demo consistency check fails and the demo cannot be treated as the approved UX reference

##### Example: stale demo entry

- **GIVEN** the demo contains `/legacy-admin` and the registry has no such route
- **WHEN** the consistency check runs
- **THEN** the check fails with `/legacy-admin`

### Requirement: Workspace skeleton changes have layered verification

Every workspace-skeleton change MUST include pure manifest/resolver tests, component tests for shell composition, and a base browser verification pass. Browser verification for this change MUST cover the three role labels (使用者／{App}管理員／總管理員) at `1440px` and `390px`. A build-only result SHALL NOT satisfy this requirement. Full cross-App, cross-locale, cross-theme verification is out of scope for this requirement and is covered by the `platform-launch-verification-evidence` change.

#### Scenario: pure contract checks pass

- **WHEN** the `WorkspaceContext`, resolver, duplicate-menu, and forbidden-noun checks run against the registered Apps
- **THEN** they verify workspace isolation, parent-child ordering, duplicate rejection, permission filtering, and forbidden-noun absence with zero failures

#### Scenario: browser verification finds a regression

- **WHEN** deployed browser verification finds a duplicate menu, a workspace boundary violation, or a forbidden legacy noun
- **THEN** the change is reported as failed and SHALL NOT be marked complete even if the build succeeds

#### Scenario: visible navigation entry is activated

- **WHEN** browser verification activates each visible menu entry in a workspace
- **THEN** the destination route loads without a duplicate shell or unauthorized admin menu

##### Example: course child activation

- **GIVEN** `course` app-admin navigation exposes `/quiz-admin`
- **WHEN** browser verification activates the quiz child
- **THEN** `/quiz-admin` loads with one course app-admin shell and no platform menu
