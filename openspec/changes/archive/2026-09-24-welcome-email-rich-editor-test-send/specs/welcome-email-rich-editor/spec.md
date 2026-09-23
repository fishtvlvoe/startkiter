## ADDED Requirements

### Requirement: Welcome email template is edited with a WYSIWYG block editor

The admin email settings page SHALL provide a what-you-see-is-what-you-get block editor for the welcome email body, replacing the raw Markdown textarea. The editor SHALL support paragraphs, headings, bold, italic, bulleted and numbered lists, quotes, links, and a call-to-action button block, with a Traditional Chinese editing interface. The operator SHALL NOT be required to type Markdown or HTML syntax to produce formatted content.

#### Scenario: Operator formats content without markup syntax

- **WHEN** the operator selects text in the editor and clicks the bold control
- **THEN** the selected text appears bold in the editor and no markup characters are inserted into the visible content

#### Scenario: Editor loads existing content

- **WHEN** the operator opens the email settings page for a course whose `CourseWelcomeEmail.contentJson` has a saved block array
- **THEN** the editor displays the saved content rendered as blocks identical to what was saved

#### Scenario: Editor component loads lazily

- **WHEN** the operator navigates to any admin page other than email settings
- **THEN** the block editor library is not included in the initial page bundle

### Requirement: Editor content is persisted as block JSON

Saving via POST /api/rpc/course/updateWelcomeEmailSettings SHALL persist the editor's block array into `CourseWelcomeEmail.contentJson` (TEXT column). When `contentJson` is provided, the procedure SHALL also store the editor's plain-text export in `markdownTemplate` so that legacy fallback rendering remains available. When `contentJson` is absent from the request, the procedure SHALL keep the existing `markdownTemplate`-only behavior.

#### Scenario: Save with block content

- **GIVEN** the operator has typed one paragraph and one CTA button block
- **WHEN** the operator clicks 儲存設定 and the request succeeds
- **THEN** `contentJson` contains the two blocks and `markdownTemplate` contains the corresponding plain-text export

#### Scenario: Save without block content preserves legacy behavior

- **WHEN** a request updates only `subjectTemplate` and `markdownTemplate` without `contentJson`
- **THEN** `contentJson` retains its previous value and `markdownTemplate` is updated

### Requirement: Server renders email-safe HTML from block JSON

`renderWelcomeEmailFromBlocks` in the mail package SHALL convert the block array into a single-column email-safe HTML document (600px table layout, inline styles only, no external stylesheets) and SHALL sanitize the result by removing `script` elements, event handler attributes (`on*`), `javascript:`/`data:` URLs, and `style` attributes targeting position/fixed behavior. The function SHALL reject output exceeding 256 KB with a descriptive error.

#### Scenario: Known blocks render to matching HTML

- **GIVEN** blocks: heading "歡迎加入", paragraph with bold text, CTA button with text 開始上課 and url /course/abc
- **WHEN** `renderWelcomeEmailFromBlocks` runs
- **THEN** the HTML contains an `<h1>` heading, a `<strong>` element, and a centered link-styled button pointing to the course URL

#### Scenario: Malicious markup is stripped

- **GIVEN** a paragraph block containing `<img src=x onerror=alert(1)>` and `<script>alert(2)</script>`
- **WHEN** `renderWelcomeEmailFromBlocks` runs
- **THEN** the returned HTML contains neither `onerror` nor `<script>`

#### Scenario: Oversized output is rejected

- **GIVEN** block content whose rendered HTML exceeds 256 KB
- **WHEN** `renderWelcomeEmailFromBlocks` runs
- **THEN** it throws an error stating the rendered email exceeds the size limit

#### Scenario: Unknown block types are skipped

- **GIVEN** a block array containing a block whose type the renderer does not recognize, between two paragraph blocks
- **WHEN** `renderWelcomeEmailFromBlocks` runs
- **THEN** the output contains both paragraphs and no content for the unknown block, and rendering does not fail

### Requirement: Plain text version is generated with every render

Every invocation of `renderWelcomeEmailFromBlocks` SHALL return a `text` field containing a plain-text representation of the same content (headings and list items on their own lines, links rendered as `text (url)`, button blocks rendered as `text (url)`), so the existing dual-format sending pipeline is preserved.

#### Scenario: Button block appears as text link

- **GIVEN** a CTA button block with text 開始上課 and url https://startkiter.com/course/abc
- **WHEN** `renderWelcomeEmailFromBlocks` runs
- **THEN** the `text` output contains the line 開始上課 (https://startkiter.com/course/abc)

### Requirement: Template variables are interpolated on rendered output with escaping

After rendering, the system SHALL replace the variables `{{userName}}`, `{{courseName}}`, and `{{courseUrl}}` in both the HTML and plain-text output, applying the existing escaping rule (backslash and Markdown special characters in variable values are escaped) before substitution.

#### Scenario: Variable value with markup characters stays literal

- **GIVEN** rendered HTML ending with a paragraph block and a buyer whose name is `Amy_[test]`
- **WHEN** the welcome email for that buyer is rendered
- **THEN** the output contains the literal text `Amy_[test]` and no element created from the brackets

### Requirement: Legacy Markdown rendering remains for records without block content

When `CourseWelcomeEmail.contentJson` is null, the welcome email SHALL be rendered through the existing Markdown pipeline (react-email CourseWelcome component) unchanged. The system SHALL NOT require `contentJson` to be present for sending to succeed.

#### Scenario: Existing record without contentJson still sends

- **GIVEN** a `CourseWelcomeEmail` created before this change with `contentJson: null` and a Markdown body
- **WHEN** a buyer's order for that course is marked paid
- **THEN** the welcome email is rendered from `markdownTemplate` and sent successfully
