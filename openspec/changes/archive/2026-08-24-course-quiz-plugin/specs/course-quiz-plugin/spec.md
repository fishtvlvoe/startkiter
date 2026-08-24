## ADDED Requirements

### Requirement: Quiz definitions are stored through the shared PluginContent table

The system SHALL persist quiz definitions (settings and questions) as `PluginContent` records with `pluginId: "quiz"` and `type: "quiz-definition"`. The system MUST NOT create a Plugin-specific table for storing quiz definitions or questions.

#### Scenario: Quiz definition is retrievable through PluginContent

- **WHEN** an operator creates a quiz definition via the quiz admin page
- **THEN** the system MUST insert a `PluginContent` row with `pluginId: "quiz"` and `type: "quiz-definition"`, and the quiz MUST be retrievable by querying `pluginId = "quiz" AND type = "quiz-definition"`

### Requirement: Quiz attempts are recorded in a dedicated transaction-type table

The system SHALL record each learner's quiz submission as a `QuizAttempt` row in its own database table, separate from the shared `PluginContent` table.

#### Scenario: Submitting a quiz creates a QuizAttempt row

- **WHEN** a signed-in learner submits answers for a quiz
- **THEN** the system MUST create a `QuizAttempt` row with the learner's `userId`, the quiz's `pluginContentId`, submitted `answers`, computed `score`, and `passed` boolean

### Requirement: Four question types are graded using verified logic

The system SHALL grade `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, and `FILL_IN_BLANK` question types. Multiple-choice answers SHALL be compared as sets (order-independent); fill-in-blank answers SHALL accept any of multiple predefined acceptable strings.

#### Scenario: Multiple-choice answer order does not affect grading

- **WHEN** a learner selects options in a different order than the stored `correctAnswer` array but the same set of options
- **THEN** the question MUST be graded as correct

##### Example: order-independent multiple choice

| correctAnswer | submitted answer | Result |
| --- | --- | --- |
| ["a", "b"] | ["b", "a"] | Correct |
| ["a", "b"] | ["a"] | Incorrect |

#### Scenario: Fill-in-blank accepts any predefined acceptable answer

- **WHEN** a learner's submitted text matches any one of the question's predefined acceptable answer strings
- **THEN** the question MUST be graded as correct

### Requirement: Quiz pages render through the auto-mode mount point, not embedded in lesson content

The quiz Plugin's manifest entry in `MOUNT_POINTS` SHALL declare `mount.content.kind: "auto"` bound to `/quiz`. The system MUST NOT rely on `"block"` mode for rendering quiz pages, since v1 does not guarantee block-mode rendering.

#### Scenario: Quiz page is reachable via its own auto-mounted route

- **WHEN** a signed-in learner navigates to `/quiz/{pluginContentId}` for an existing quiz definition
- **THEN** the quiz page MUST render without requiring any block-mode content placement

### Requirement: Pass status is queryable without modifying the course engine's unlock logic

The system SHALL expose a `hasPassedQuiz(userId, pluginContentId)` function returning whether a learner has passed a given quiz. The system MUST NOT modify the course engine's existing lesson-unlock logic to automatically enforce quiz results.

#### Scenario: hasPassedQuiz reflects the latest passing attempt

- **WHEN** a learner has at least one `QuizAttempt` with `passed: true` for a given `pluginContentId`
- **THEN** `hasPassedQuiz(userId, pluginContentId)` MUST return true

#### Scenario: hasPassedQuiz returns false with no passing attempt

- **WHEN** a learner has no `QuizAttempt` with `passed: true` for a given `pluginContentId`
- **THEN** `hasPassedQuiz(userId, pluginContentId)` MUST return false
