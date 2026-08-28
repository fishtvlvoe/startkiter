# course-pack-mission-execution Specification

## Purpose

TBD - created by archiving change 'course-pack-mission-execution'. Update Purpose after archive.

## Requirements

### Requirement: Mission action surface resolves to a rendering block
The system SHALL map each `Mission.action.surface` value (`code_editor`, `terminal`, `structured_form`, `embedded_tool`) to exactly one existing interactive block for rendering.

#### Scenario: Known surface resolves to a block
- **WHEN** a Mission's action surface is one of the four supported values
- **THEN** the system SHALL resolve it to the corresponding registered block without error

#### Scenario: Surface value has no registered block mapping
- **WHEN** a Mission's action surface is a valid schema value but has no entry in the surface-to-block map
- **THEN** the system SHALL display a fail-closed error to the learner without crashing the page, and SHALL NOT render a broken component


<!-- @trace
source: course-pack-mission-execution
updated: 2026-08-25
code:
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/course/src/course-pack/schema.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - docs/dispatch-board.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/schema.prisma
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/list-course-packs.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
tests:
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - packages/course/src/course-pack/schema.test.ts
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
-->

---
### Requirement: Structured form field values are persisted per user per mission
The system SHALL store each value a learner submits for a `structured_form` field as an encrypted record scoped to that user and that Mission, keyed by field key.

#### Scenario: Submitting a field value creates or updates a stored record
- **WHEN** an authenticated user submits a value for a field key on a Mission
- **THEN** the system SHALL encrypt the value and SHALL upsert exactly one record identified by the combination of user, Mission, and field key

#### Scenario: Unauthenticated submission is rejected
- **WHEN** an unauthenticated request calls `POST /api/course/mission/form-value`
- **THEN** the system SHALL respond with HTTP 401 and SHALL NOT persist any value


<!-- @trace
source: course-pack-mission-execution
updated: 2026-08-25
code:
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/course/src/course-pack/schema.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - docs/dispatch-board.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/schema.prisma
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/list-course-packs.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
tests:
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - packages/course/src/course-pack/schema.test.ts
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
-->

---
### Requirement: External check evaluators dispatch to a named check registry
The system SHALL execute a Mission's `external_check` evaluator by dispatching its `check_id` to a server-side registry of check implementations.

#### Scenario: Registered check_id executes and returns a status
- **WHEN** a learner triggers an `external_check` evaluator whose `check_id` is registered
- **THEN** the system SHALL invoke the corresponding implementation and SHALL return one of `passed`, `pending`, or `failed`

#### Scenario: Unregistered check_id is rejected distinctly from a failed check
- **WHEN** a learner triggers an `external_check` evaluator whose `check_id` has no registered implementation
- **THEN** the system SHALL respond with `reasonCode: unknown_check_id` and SHALL NOT report this as a failed learning attempt


<!-- @trace
source: course-pack-mission-execution
updated: 2026-08-25
code:
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/course/src/course-pack/schema.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - docs/dispatch-board.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/schema.prisma
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/list-course-packs.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
tests:
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - packages/course/src/course-pack/schema.test.ts
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
-->

---
### Requirement: External check execution requires an authenticated learner
The system SHALL reject `POST /api/course/mission/check` requests from unauthenticated callers.

#### Scenario: Unauthenticated check request is rejected
- **WHEN** an unauthenticated request calls `POST /api/course/mission/check`
- **THEN** the system SHALL respond with HTTP 401 and SHALL NOT execute any check implementation


<!-- @trace
source: course-pack-mission-execution
updated: 2026-08-25
code:
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/course/src/course-pack/schema.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - docs/dispatch-board.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/schema.prisma
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/list-course-packs.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
tests:
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - packages/course/src/course-pack/schema.test.ts
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
-->

---
### Requirement: External check failures are classified by reason
The system SHALL classify a failed `external_check` result into one of `auth_error`, `network_error`, or `not_found`, so the learner-facing recovery message can differ by cause.

#### Scenario: Third-party API authentication failure is classified as auth_error
- **WHEN** a check implementation calls a third-party API using a stored credential and the API responds with an authentication failure
- **THEN** the system SHALL return `reasonCode: auth_error`

#### Scenario: Network or timeout failure is classified as network_error
- **WHEN** a check implementation's outbound call times out or the network is unreachable
- **THEN** the system SHALL return `reasonCode: network_error`


<!-- @trace
source: course-pack-mission-execution
updated: 2026-08-25
code:
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/course/src/course-pack/schema.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - docs/dispatch-board.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/schema.prisma
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/list-course-packs.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
tests:
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - packages/course/src/course-pack/schema.test.ts
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
-->

---
### Requirement: A check that depends on a missing stored value fails closed
The system SHALL treat a `check_id` execution as pending, not failed, when a required `MissionFormValue` for that check has not yet been submitted, and SHALL NOT attempt the outbound call in that case.

#### Scenario: Missing required form value short-circuits the check
- **WHEN** a check implementation requires a stored field value that has not been submitted yet
- **THEN** the system SHALL return `status: pending` without making any outbound network call

<!-- @trace
source: course-pack-mission-execution
updated: 2026-08-25
code:
  - docs/design-canvas/anson-manual-redesign-direction.html
  - docs/assets/god-manual-prototype/anson-manual-hero.png
  - docs/assets/god-manual-prototype/anson-handoff-case.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-03-anson-guidance.png
  - packages/database/prisma/migrations/20260825061601_add_mission_form_value/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-overview-2x3.png
  - docs/assets/god-manual-prototype/anson-infinite-canvas-workflow.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-04-real-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-05-phased-proposal.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-06-next-step.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-06-next-step.png
  - docs/design-canvas/anson-seedance-2.5-storyboard.md
  - docs/assets/god-manual-prototype/anson-infinite-canvas-brand.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-05-phased-proposal.png
  - packages/api/modules/course/procedures/import-course-pack.ts
  - packages/course/src/course-pack/schema.ts
  - packages/database/prisma/zod/index.ts
  - packages/api/modules/course/router.ts
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-02-price-resistance.png
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-03-anson-guidance.png
  - packages/api/modules/course/lib/mission-form-value-crypto.ts
  - docs/dispatch-board.md
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board.svg
  - docs/assets/god-manual-prototype/storyboard-seedance/4k/shot-01-vague-need.png
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-production-board-4k.png
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-01-vague-need.png
  - packages/database/prisma/schema.prisma
  - docs/assets/god-manual-prototype/storyboard-seedance/shot-02-price-resistance.png
  - packages/api/modules/course/procedures/list-course-packs.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.ts
  - packages/database/prisma/migrations/20260825055318_add_course_pack_import/migration.sql
  - docs/assets/god-manual-prototype/storyboard-seedance/anson-storyboard-model-reference-4k.png
tests:
  - packages/api/modules/course/procedures/import-course-pack.test.ts
  - packages/course/src/course-pack/schema.test.ts
  - packages/api/modules/course/procedures/list-course-packs.test.ts
  - packages/database/src/mission-form-value/mission-form-value.test.ts
  - packages/api/modules/course/procedures/submit-mission-form-value.test.ts
-->
