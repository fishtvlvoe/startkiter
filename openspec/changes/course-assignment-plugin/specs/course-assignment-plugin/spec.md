## ADDED Requirements

### Requirement: Assignment definitions are stored through the shared PluginContent table

The system SHALL persist assignment definitions as `PluginContent` records with `pluginId: "assignment"` and `type: "assignment-definition"`. The system MUST NOT create a Plugin-specific table for storing assignment definitions.

#### Scenario: Assignment definition is retrievable through PluginContent

- **WHEN** an operator creates an assignment definition via the assignment admin page
- **THEN** the system MUST insert a `PluginContent` row with `pluginId: "assignment"` and `type: "assignment-definition"`

### Requirement: Attachment uploads use the signed-URL storage abstraction, not a local filesystem path

The system SHALL upload assignment attachments through `packages/storage`'s signed-URL mechanism. The system MUST NOT construct a storage key by directly concatenating a user-supplied filename.

#### Scenario: Storage key is system-generated, not derived from the uploaded filename

- **WHEN** a learner uploads a file named containing special characters (e.g. `../../etc/passwd.png`)
- **THEN** the resulting `storageKey` MUST be a system-generated identifier, and the original filename MUST only be stored in the separate `filename` display field

### Requirement: Assignment description and review feedback are sanitized before HTML rendering

The system SHALL sanitize any assignment description or review feedback content before rendering it as HTML, removing script tags and event-handler attributes.

#### Scenario: Malicious script tag is stripped before rendering

- **WHEN** an assignment description or review feedback contains a `<script>` tag or an `onclick` attribute
- **THEN** the sanitized output MUST NOT contain the script tag or event-handler attribute

### Requirement: Submissions track lateness and revision count as transaction-type data

The system SHALL record each submission's lateness status and revision number in a dedicated `AssignmentSubmission` table, separate from the shared `PluginContent` table.

#### Scenario: Late submission is flagged

- **WHEN** a learner submits after the assignment's due time
- **THEN** the `AssignmentSubmission` row MUST have `isLate: true`

#### Scenario: Resubmission increments the revision number

- **WHEN** a learner submits a second time for the same assignment
- **THEN** the new `AssignmentSubmission` row's `revisionNumber` MUST be greater than the previous submission's

### Requirement: One draft per learner per assignment is retained

The system SHALL maintain at most one `AssignmentDraft` row per `(pluginContentId, userId)` pair, overwriting the previous draft on each save.

#### Scenario: Saving a draft twice does not create two draft rows

- **WHEN** a learner saves a draft for the same assignment twice
- **THEN** the system MUST update the existing `AssignmentDraft` row rather than creating a second one
