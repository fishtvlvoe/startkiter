## Purpose

StartKiter SHALL provide a single account menu contract that exposes role-scoped settings entries, moves theme and locale controls out of the primary navigation, and pairs every icon with light and dark SVG variants using semantic color tokens.

## ADDED Requirements

### Requirement: Account menu settings entries are derived from WorkspaceContext

The account menu MUST always show a "使用者設定" entry regardless of `WorkspaceContext`. It MUST show a "{displayName}管理員設定" entry only when the current `WorkspaceContext` is `{ scope: "app", role: "app-admin" }`, using that App's `displayName`. It MUST show a "總管理員設定" entry only when the current `WorkspaceContext` is `{ scope: "platform" }`. Visibility MUST be derived from the same `WorkspaceContext` produced by the navigation resolver, not a separately computed permission check.

#### Scenario: app-user sees only user settings

- **WHEN** a user with `{ scope: "app", role: "app-user" }` opens the account menu
- **THEN** the menu shows "使用者設定" and does not show any admin settings entry

#### Scenario: app-admin sees an App-named settings entry

- **GIVEN** App `course` has `displayName` "課程"
- **WHEN** a user with `{ scope: "app", appId: "course", role: "app-admin" }` opens the account menu
- **THEN** the menu shows "使用者設定" and "課程管理員設定", and does not show "總管理員設定"

#### Scenario: super-admin sees platform settings

- **WHEN** a user with `{ scope: "platform" }` opens the account menu
- **THEN** the menu shows "使用者設定" and "總管理員設定"

##### Example: entry visibility matrix

| WorkspaceContext | 使用者設定 | {App}管理員設定 | 總管理員設定 |
| --- | :---: | :---: | :---: |
| app / app-user | shown | hidden | hidden |
| app / app-admin | shown | shown | hidden |
| platform | shown | hidden | shown |

### Requirement: Theme and locale controls live only inside user settings

Color mode (dark/light/system) and locale controls MUST render only within the "使用者設定" page. They SHALL NOT render in the first-level navigation or as a top-level account menu item.

#### Scenario: first-level navigation has no theme or locale control

- **WHEN** the shell renders the first-level navigation for any workspace
- **THEN** no color-mode toggle or locale switcher is present in that navigation surface

#### Scenario: user settings page exposes both controls

- **WHEN** a user opens "使用者設定"
- **THEN** the page renders a color-mode toggle and a locale switcher, and changes take effect immediately

### Requirement: Icons ship as paired light and dark SVG assets

Every menu or account-area icon MUST provide both a `light` and a `dark` SVG asset. The shell MUST select the asset matching the resolved color mode. The system SHALL NOT derive a dark-mode icon from a single asset via CSS filter inversion.

#### Scenario: dark mode selects the dark icon asset

- **WHEN** the resolved color mode is dark
- **THEN** every rendered menu and account icon loads its `dark` SVG variant

#### Scenario: missing icon variant fails the build

- **WHEN** an icon registration provides only `light` or only `dark`
- **THEN** the icon asset check fails and lists the icon id and the missing variant

##### Example: icon asset check

| Icon id | light | dark | Result |
| --- | :---: | :---: | --- |
| `nav.course` | ✓ | ✓ | pass |
| `nav.settings` | ✓ | — | fail: missing `dark` |

### Requirement: Shared navigation and account components use semantic color tokens

Shared navigation and account menu components MUST use semantic tokens (`background`, `foreground`, `muted-foreground`, `border`, `accent`) for all text and surface colors. They SHALL NOT declare a hardcoded dark-mode-only text color class.

#### Scenario: hardcoded dark text class is rejected

- **WHEN** a static check scans shared navigation and account components for a hardcoded dark-mode-only text color class
- **THEN** the check fails and lists the file and line

#### Scenario: color mode switch preserves readable text

- **WHEN** a user switches among dark, light, and system color modes
- **THEN** the account menu and navigation foreground, background, and border colors resolve from the active semantic token set and remain readable

### Requirement: Account menu and settings entries stay usable at desktop and mobile widths

The account menu and its settings entries MUST render without horizontal overflow at desktop width `1440px` and mobile width `390px`, and content MUST NOT be hidden behind the account menu when open.

#### Scenario: desktop account menu fits the viewport

- **WHEN** the account menu opens at a `1440px` viewport
- **THEN** the menu and its entries fit without horizontal overflow

#### Scenario: mobile account menu fits the viewport

- **WHEN** the account menu opens at a `390px` viewport
- **THEN** the menu remains usable, does not cover the page's primary content permanently, and the document has no horizontal overflow

#### Scenario: locale switch updates the account menu labels

- **WHEN** an authenticated user switches between `zh-tw`, `zh-cn`, and `en`
- **THEN** the account menu entry labels use the selected locale without leaving any entry in a previous locale
