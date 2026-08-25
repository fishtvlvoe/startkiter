## ADDED Requirements

### Requirement: Operator can import a Course Pack envelope

The system SHALL expose `POST /api/course/packs/import` restricted to `courseOperatorProcedure`. The endpoint SHALL accept a JSON body `{ envelope: unknown }` and validate it against a Course Pack envelope schema requiring `schema_version` literal `"1.0.0"`, `target_runtime` literal `"startkiter"`, and a `course_pack` object with `id`, `title`, `learning_outcomes` (non-empty array), and `missions` (non-empty array). Each mission SHALL require `id`, `title`, `goal`, `action`, `evaluator`, `feedback`, `consequence`, `recovery` (non-empty, sorted by ascending `attempt`), and `evidence` (at least one entry marked `required: true`). On successful validation the system SHALL persist a `CoursePack` record and its `CoursePackMission` records and respond `200` with `{ id, sourcePackId, title, missionCount, importedAt }`. On validation failure the system SHALL respond `400` with `{ errors: { path: string; message: string }[] }` and SHALL NOT persist any record. A caller without operator permission SHALL receive `403` and no data SHALL be persisted.

#### Scenario: Valid envelope is imported successfully

- **WHEN** an operator sends `POST /api/course/packs/import` with an envelope matching the fixture `saas-payment-course-pack.json` (one mission `webhook-01`)
- **THEN** the system responds `200` with `missionCount: 1`, and a subsequent `GET /api/course/packs` includes the imported pack with `status: "active"`

#### Scenario: Envelope missing a required mission field is rejected

- **WHEN** an operator sends an envelope whose single mission omits the `evaluator` field
- **THEN** the system responds `400` with a non-empty `errors` array and no `CoursePack` record is created

#### Scenario: Non-operator caller is rejected

- **WHEN** a caller without `courseOperatorProcedure` permission sends `POST /api/course/packs/import` with an otherwise-valid envelope
- **THEN** the system responds `403` and no `CoursePack` record is created

#### Scenario: Wrong schema_version or target_runtime is rejected

- **WHEN** an operator sends an envelope with `schema_version: "2.0.0"` or `target_runtime: "other-platform"`
- **THEN** the system responds `400` with a non-empty `errors` array

##### Example: envelope validation boundary cases

| schema_version | target_runtime | missions | Expected |
| --- | --- | --- | --- |
| "1.0.0" | "startkiter" | 1 valid mission | 200, imported |
| "2.0.0" | "startkiter" | 1 valid mission | 400, errors non-empty |
| "1.0.0" | "other-platform" | 1 valid mission | 400, errors non-empty |
| "1.0.0" | "startkiter" | [] (empty array) | 400, errors non-empty |

### Requirement: Re-importing the same source Course Pack id preserves history

When an operator imports an envelope whose `course_pack.id` matches an existing `CoursePack.sourcePackId` with `status: "active"`, the system SHALL set that existing record's `status` to `"superseded"` and SHALL create a new `CoursePack` record with `status: "active"` for the newly imported version. The system SHALL NOT delete or overwrite the superseded record's data.

#### Scenario: Second import of the same source id supersedes the first

- **WHEN** an operator imports an envelope with `course_pack.id: "saas-payment-mvp"`, and later imports another valid envelope also with `course_pack.id: "saas-payment-mvp"`
- **THEN** `GET /api/course/packs` includes two records for `sourcePackId: "saas-payment-mvp"`: the first with `status: "superseded"` and the second with `status: "active"`

### Requirement: Operator can list imported Course Packs

The system SHALL expose `GET /api/course/packs` restricted to `courseOperatorProcedure`, returning all `CoursePack` records ordered by `importedAt` descending as `{ id, sourcePackId, title, status, missionCount, importedAt }[]`. When no Course Pack has been imported, the system SHALL respond `200` with an empty array.

#### Scenario: List returns imported packs newest first

- **WHEN** an operator imports pack `a` and then pack `b`
- **THEN** `GET /api/course/packs` responds `200` with `b` before `a` in the array

#### Scenario: List returns empty array when nothing imported

- **WHEN** an operator calls `GET /api/course/packs` before any import has happened
- **THEN** the system responds `200` with `[]`
