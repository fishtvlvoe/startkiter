## ADDED Requirements

### Requirement: Students execute real Node.js code inside a browser-based WebContainer sandbox

The course MDX renderer SHALL support a `WebContainerSandbox` block that boots a WebContainer runtime in the student's browser, mounts a virtual file system from the block's `files` prop, installs dependencies, and runs a test command to determine pass/fail. The system SHALL NOT execute student code on any server; all execution SHALL happen client-side inside the WebContainer sandbox.

#### Scenario: Student runs code and the test suite passes

- **WHEN** a student clicks "Run" inside a `WebContainerSandbox` block and the configured test command exits with code 0
- **THEN** the system SHALL emit a `pass` result, hold for a 150ms hit-stop pause, then render the reward feedback (visual + audio) before revealing the next unlocked content

#### Scenario: Student runs code and the test suite fails

- **WHEN** a student clicks "Run" inside a `WebContainerSandbox` block and the configured test command exits with a non-zero code
- **THEN** the system SHALL emit a `fail` result and render a narrative hint derived from the test output instead of the raw stack trace, and SHALL NOT unlock subsequent content

##### Example: Known failure category maps to a templated hint

| Test output pattern | Rendered hint category |
| --- | --- |
| `SyntaxError` | 語法錯誤提示 |
| assertion failure (`AssertionError`, `expect(...).toBe`) | 測試斷言失敗提示 |
| execution exceeds configured timeout | 執行逾時提示 |
| none of the above match | 通用鼓勵文字（fallback） |

#### Scenario: Browser does not support WebContainer

- **WHEN** `window.crossOriginIsolated` is falsy when a `WebContainerSandbox` block mounts
- **THEN** the system SHALL render an explicit "此瀏覽器不支援程式碼沙盒" message and SHALL NOT attempt to boot the WebContainer runtime or silently degrade to a different sandbox type

### Requirement: WebContainerSandbox props are validated as JSON-literal MDX attributes

The `WebContainerSandbox` block's props (`blockId`, `files`, `testCommand`, `hints`, `milestone`) SHALL be declared in MDX as JSON-literal attribute values only. The existing MDX safety inspector SHALL continue to reject any JavaScript expression, event handler, or dynamic value in these attributes.

#### Scenario: Operator saves a WebContainerSandbox block with a JS expression prop

- **WHEN** an operator saves Lesson content containing `<WebContainerSandbox files={someVariable} />` where `someVariable` is a JavaScript identifier rather than a JSON literal
- **THEN** the system SHALL reject the save with the existing "講義內容不允許 JavaScript 表達式" error, before any database write occurs

#### Scenario: Operator saves a valid WebContainerSandbox block

- **WHEN** an operator saves Lesson content containing `<WebContainerSandbox files={{"index.js": "console.log(1)"}} testCommand="npm test" hints={["先檢查函式名稱"]} />`
- **THEN** the system SHALL accept the save because all attribute values parse as JSON literals
