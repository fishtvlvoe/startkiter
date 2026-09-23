## Purpose

StartKiter SHALL require a complete pre-launch verification pass across role, theme, locale, and device combinations, every visible button and link, defined error scenarios, deployed-environment browser verification, and a rehearsed rollback before any workspace-skeleton or App-surface change is marked complete for launch.

## ADDED Requirements

### Requirement: The verification matrix covers every role, theme, locale, and device combination

A launch verification pass MUST produce a `matrix` covering all combinations of role (`app-user`, `app-admin`, `super-admin`), theme (`dark`, `light`), locale (`zh-tw`, `zh-cn`, `en`), and viewport (`1440`, `390`) — 36 cells total. Each cell MUST be marked `verified` with an evidence path or `not-applicable` with a stated reason. A cell SHALL NOT be left blank or marked `unverified` in a report claiming completion.

#### Scenario: complete matrix passes

- **WHEN** a launch evidence report is generated with all 36 cells marked `verified` or `not-applicable` with a reason
- **THEN** the report generator accepts the matrix

#### Scenario: incomplete matrix is rejected

- **WHEN** a launch evidence report is generated with any cell missing or marked `unverified`
- **THEN** the report generator refuses to produce a completion report and lists the missing combinations

##### Example: matrix completeness check

| Missing combination | Expected result |
| --- | --- |
| `super-admin / dark / en / 390` | reject: cell missing |
| all 36 cells present, one `not-applicable` with reason "no super-admin-only mobile-only feature" | accept |

### Requirement: Every visible button and link has a recorded expected and actual outcome

For the current role's visible entries, a `LinkVerification` record MUST exist for each button and link, stating `expectedOutcome`, `actualOutcome`, and `passed`. A launch verification pass with any `passed: false` record SHALL NOT be marked complete.

#### Scenario: all visible entries pass

- **WHEN** every `LinkVerification` record for the current role has `passed: true`
- **THEN** the link-check portion of the launch verification is accepted

#### Scenario: a failing entry blocks completion

- **WHEN** at least one `LinkVerification` record has `passed: false`
- **THEN** the overall launch verification is reported as not complete, listing the failing entry

##### Example: link check outcomes

| Entry | Expected outcome | Actual outcome | Passed |
| --- | --- | --- | --- |
| "使用者設定" | opens user settings page | opens user settings page | true |
| "課程管理員設定" (as app-user) | not shown | not shown | true |
| "升級" | navigates to billing page | 500 error page | false |

### Requirement: Defined error scenarios are exercised and recorded

A launch verification pass MUST exercise at minimum: a direct request to an unauthorized route, an invalid form input, and a simulated timeout. Each scenario MUST record an expected outcome, an actual outcome, and a pass/fail result. None of these scenarios SHALL expose a raw stack trace or internal file path.

#### Scenario: unauthorized route returns a safe outcome

- **WHEN** an app-user directly requests a super-admin-only route
- **THEN** the actual outcome is a safe redirect or an authorization-denied page, not a raw 401/500 page or stack trace

#### Scenario: invalid input returns a handled error

- **WHEN** a form under verification receives an invalid input
- **THEN** the actual outcome is a handled validation message, not an unhandled exception

#### Scenario: error scenario without exercise blocks completion

- **WHEN** any of the three required error scenarios has no recorded actual outcome
- **THEN** the launch verification is reported as not complete

### Requirement: Verification runs against a deployed environment, not local development only

Browser verification MUST run against a deployed TEST/preview or production URL using ego-browser. A launch verification pass that only exercises a local development server SHALL NOT be marked complete.

#### Scenario: deployed environment verification is recorded

- **WHEN** ego-browser verification runs against a deployed URL and captures screenshots or recordings
- **THEN** the launch evidence report references that deployed URL and the captured evidence paths

#### Scenario: local-only verification is rejected

- **WHEN** the only recorded verification evidence references `localhost`
- **THEN** the launch verification is reported as not complete

### Requirement: Rollback is rehearsed with a recorded execution, not only documented

Before a launch verification pass can be marked complete, the rollback procedure MUST be executed at least once in a TEST/preview or production environment, and the execution MUST be recorded with a timestamp, the command used, and the health-check result. A `rollbackRehearsal` field of `null` SHALL NOT accompany a completion report.

#### Scenario: rehearsed rollback is recorded

- **WHEN** the rollback procedure is executed and the environment's health check passes afterward
- **THEN** `rollbackRehearsal` records the timestamp, command, and health-check result

#### Scenario: undocumented-only rollback blocks completion

- **WHEN** the rollback procedure is only described in a document and has not been executed
- **THEN** `rollbackRehearsal` is `null` and the launch verification is reported as not complete

### Requirement: Delivery evidence uses a fixed report format naming unresolved items

The launch evidence report MUST include `matrix`, `linkChecks`, `errorScenarios`, `rollbackRehearsal`, and `unresolvedItems`. `unresolvedItems` MAY be an empty array but MUST be present; a report omitting this field SHALL be rejected.

#### Scenario: report with no unresolved items is valid

- **WHEN** a launch evidence report has `unresolvedItems: []` and all other fields complete
- **THEN** the report is accepted as a completion report

#### Scenario: report omitting unresolvedItems is rejected

- **WHEN** a launch evidence report has no `unresolvedItems` field
- **THEN** the report generator refuses to produce the report

#### Scenario: report with unresolved items is not a completion claim

- **WHEN** `unresolvedItems` is non-empty
- **THEN** the report SHALL NOT be presented as "功能完成", and each item MUST state what remains unconfirmed
