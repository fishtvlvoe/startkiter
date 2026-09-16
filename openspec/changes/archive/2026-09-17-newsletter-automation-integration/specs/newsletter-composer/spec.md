## Purpose

The newsletter composer lets a non-technical creator build a block-based email through a live preview, using one shared rendering path for the preview, the test send, and the real send, so what they see is exactly what recipients receive — while automated safeguards (HTML sanitization, size limits, plain-text generation) protect deliverability and security without the creator having to think about them.

## ADDED Requirements

### Requirement: Single rendering path for preview, test send, and real send

The system SHALL render campaign content through one function that produces the HTML used for the live preview, the test send, and the final send, and SHALL NOT maintain a second rendering path for any of these three surfaces.

#### Scenario: Test email matches production email byte-for-byte apart from the test banner

- **WHEN** a creator sends a test email and later sends the same campaign for real
- **THEN** the system SHALL produce identical HTML output for both except for the test-mode banner and any recipient-specific merge values

### Requirement: Table-based inline-style HTML output

The system SHALL render campaign HTML using table-based layout with fully inlined styles, a 600px container, and SHALL NOT emit a `<style>` block, flexbox, or CSS grid in the rendered output.

#### Scenario: Rendered HTML contains no unsupported layout constructs

- **WHEN** a campaign with a heading, paragraph, image, and button block is rendered
- **THEN** the output SHALL use table-based layout with inline styles only, and SHALL NOT contain a `<style>` tag, `display:flex`, or `display:grid`

### Requirement: HTML size guard

The system SHALL warn or block when rendered campaign HTML exceeds 102KB.

#### Scenario: Oversized campaign is flagged before send

- **WHEN** a campaign's rendered HTML exceeds 102KB
- **THEN** the system SHALL display a warning or block before the campaign can be sent

### Requirement: Server-side HTML sanitization

The system SHALL sanitize all outbound campaign HTML — including any HTML-mode content and merge-tag substitution results — on the server, removing `<script>` tags and `on*` event attributes, before rendering for preview, test send, or real send.

#### Scenario: Injected script tag is stripped

- **WHEN** a campaign paragraph contains a `<script>` tag
- **THEN** the system SHALL remove it from the rendered output for preview, test send, and real send alike

### Requirement: Automatic plain-text alternative

The system SHALL generate a plain-text version of every campaign automatically, derived from the HTML content, and SHALL include it as the `text` part of the outbound email.

#### Scenario: HTML campaign includes a text alternative on send

- **WHEN** a campaign is sent
- **THEN** the outbound email payload SHALL include a non-empty plain-text body alongside the HTML body

### Requirement: Draft autosave

The system SHALL autosave campaign draft content after the editor is idle for a defined debounce period, keeping a single latest snapshot per campaign.

#### Scenario: Idle period triggers autosave

- **WHEN** a creator stops editing a draft campaign and no further changes occur for the debounce window
- **THEN** the system SHALL persist the current content as the draft's latest snapshot

### Requirement: Test send restricted to internal accounts

The system SHALL only allow test emails to be sent to email addresses belonging to `ADMIN`, `EDITOR`, or `INSTRUCTOR` accounts, and SHALL exclude test recipients from all engagement statistics.

#### Scenario: Test send to a non-staff address is rejected

- **WHEN** a creator attempts to send a test email to an address that does not belong to an `ADMIN`, `EDITOR`, or `INSTRUCTOR` account
- **THEN** the system SHALL reject the request

#### Scenario: Test recipient does not count toward statistics

- **WHEN** a test email is sent and opened
- **THEN** the system SHALL mark that recipient row `isTest: true` and SHALL exclude it from any open-rate, click-rate, or delivery statistics

### Requirement: Send confirmation with recipient estimate

The system SHALL show a confirmation step before a campaign enters the sending pipeline, displaying the campaign type, subject, sender, and estimated recipient count, and SHALL require explicit confirmation before dispatch begins.

#### Scenario: Confirmation blocks accidental double-send

- **WHEN** a creator confirms and dispatch begins
- **THEN** the system SHALL prevent that same confirmation action from being submitted a second time for the same campaign
