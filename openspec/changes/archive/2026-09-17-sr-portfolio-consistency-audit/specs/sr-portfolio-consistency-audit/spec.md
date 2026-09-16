## Purpose

Keep the recorded completion state of every non-archived SR (its `tasks.md` checkboxes) honest against what actually exists in `main`, so PM and future agents can trust `spectra list` output instead of re-verifying every SR's code from scratch before continuing work on it.

## ADDED Requirements

### Requirement: Every non-archived SR's recorded task progress matches its actual code state

For each SR under `openspec/changes/` that is not archived, the checkbox state in `tasks.md` SHALL reflect whether the corresponding code artifact actually exists and is merged, not merely whether the checkbox was manually ticked.

#### Scenario: Merged code with unmatched checkboxes triggers a fix

- **WHEN** an SR's code artifacts (files, schema fields, procedures named in tasks.md) are verified present in the `main` branch
- **THEN** the SR's `tasks.md` checkboxes for those tasks SHALL be updated to `[x]` and the SR SHALL be archived if all tasks are complete

#### Scenario: Unmerged code keeps checkboxes unchecked

- **WHEN** an SR's code artifacts are not found in `main` for a given task
- **THEN** that task's checkbox SHALL remain `[ ]` and the SR SHALL NOT be archived

### Requirement: Independent code review confirms SR-to-code consistency before further development

An agent other than the one that authored the SR's proposal/design/tasks SHALL review each SR's code against its `tasks.md` and produce a report stating, per task, whether the checkbox state matches the observed code.

#### Scenario: Reviewer confirms a match

- **WHEN** the reviewing agent finds the code described by a task exists and behaves as the task's verification target describes
- **THEN** the report SHALL mark that task as "matched"

#### Scenario: Reviewer finds a mismatch

- **WHEN** the reviewing agent finds a task's checkbox state does not match the observed code (checked but code missing, or unchecked but code present and working)
- **THEN** the report SHALL mark that task as "mismatch" and state the specific missing or extra artifact

### Requirement: SR consistency analysis passes before continuing development on a given SR

Before implementation work resumes on any SR still requiring development, `spectra analyze <change-name> --json` SHALL report zero Critical and zero Warning findings for that SR.

#### Scenario: Clean analysis unblocks development

- **WHEN** `spectra analyze` for a given SR returns zero Critical and zero Warning findings
- **THEN** implementation work on that SR MAY proceed

#### Scenario: Findings block development

- **WHEN** `spectra analyze` for a given SR returns one or more Critical or Warning findings
- **THEN** implementation work on that SR MUST NOT proceed until those findings are resolved or explicitly accepted with a recorded reason
