## ADDED Requirements

### Requirement: Interactive Blocks within MDX Lessons

`packages/course` SHALL provide standard interactive components usable within lesson MDX content: `TimelineSync`, `ConceptCompare`, `MicroSandbox`, `WorkflowSorter`, and `InstantQuiz`.

#### Scenario: Instant quiz provides immediate evaluation

- **WHEN** a learner selects an option on an `InstantQuiz` component
- **THEN** the component MUST immediately indicate whether the selected answer is correct, display the explanation, and emit a completion event for progress tracking.

##### Example: 學員選擇隨堂測驗選項
- 學員點擊選項 1
- 若為正確答案，選項標記綠色，展開解析，並標記此積木已完成

#### Scenario: Timecode sync highlights active block

- **WHEN** video playback reaches the timestamp specified in a `TimelineSync` block
- **THEN** the UI MUST highlight the corresponding block and smoothly bring it into view if auto-scroll is enabled.

##### Example: 影片播到 01:30
- 影片進度抵達 90 秒
- 標記為 `at="01:30"` 的區塊觸發高亮光暈

---

## MODIFIED Requirements

### Requirement: Lesson catalog supports optional interactive content

`packages/course` LessonDetail SHALL support an optional `interactiveMdx` field alongside traditional video metadata. Lessons without `interactiveMdx` MUST continue to render in classic video-only playback mode without regression.

#### Scenario: Lesson with interactive MDX content
- **WHEN** an entitled user accesses a lesson that has `interactiveMdx` defined
- **THEN** the system MUST render the interactive player view containing both video controls and interactive blocks.

#### Scenario: Lesson without interactive MDX content
- **WHEN** an entitled user accesses a lesson without `interactiveMdx`
- **THEN** the system MUST render the classic video player layout.
