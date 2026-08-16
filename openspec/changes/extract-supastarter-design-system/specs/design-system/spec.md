## ADDED Requirements

### Requirement: UI components come from the shared design system

The apps/saas application SHALL render pages using components imported from packages/ui that are ported from supastarter-nextjs-main's shadcn/ui-based component library. Pages MUST NOT define bespoke visual components with hand-written CSS classes for controls that have an equivalent design-system component (buttons, cards, badges, form inputs).

#### Scenario: Homepage buttons use the shared Button component

- **WHEN** a browser renders GET /
- **THEN** the primary and secondary call-to-action controls MUST be DOM elements carrying the design-system component marker attribute `data-slot="button"`

##### Example: Detecting the marker attribute

- **GIVEN** the rendered homepage DOM
- **WHEN** `document.querySelectorAll('[data-slot="button"]')` is evaluated
- **THEN** the result MUST contain at least the "取得開站包" and "看示範" controls

#### Scenario: Login form uses shared form components

- **WHEN** a browser renders GET /login
- **THEN** the email and password fields MUST be design-system Input components and the submit control MUST be a design-system Button component

##### Example: Detecting Input and Button markers on the login form

- **GIVEN** the rendered login page DOM
- **WHEN** `document.querySelectorAll('input[data-slot="input"]')` and `document.querySelectorAll('button[data-slot="button"]')` are evaluated
- **THEN** the input query MUST return exactly two elements (email, password) and the button query MUST include the submit control

### Requirement: Design tokens are ported, not approximated

The theme color, radius, spacing, and typography tokens in apps/saas/app/globals.css SHALL be copied from supastarter-nextjs-main's theme.css CSS custom properties rather than hand-authored approximate values.

#### Scenario: Token values match the source

- **WHEN** the computed CSS custom property `--radius` (or the token's renamed equivalent) is read from the document root
- **THEN** its value MUST equal the value defined in supastarter-nextjs-main's theme.css, not an independently chosen value

##### Example: Border radius token traced to source

- **GIVEN** supastarter-nextjs-main/apps/saas/app/globals.css defines a `--radius` custom property
- **WHEN** the same custom property is read from StartKiter's rendered globals.css
- **THEN** the two values MUST be identical strings

### Requirement: Chinese text renders with a CJK font fallback

Every font-family declaration that includes DM Sans (or any other Latin-only display font inherited from the ported design system) MUST include a CJK-capable fallback font immediately after it in the font stack.

#### Scenario: Mixed Chinese and English text renders consistently

- **WHEN** a heading contains both Chinese characters and Latin digits (for example "取得開站包 NT$8,800")
- **THEN** the computed font-family for the Chinese characters MUST resolve to the declared CJK fallback and MUST NOT fall back to the browser's unstyled default serif or sans-serif font

##### Example: Font stack includes CJK fallback

- **GIVEN** a CSS rule `font-family: "DM Sans", "Noto Sans TC", sans-serif;`
- **WHEN** a browser without DM Sans glyph coverage for CJK characters renders "開站包"
- **THEN** it MUST render using Noto Sans TC, not the system default serif font

### Requirement: Dark and light mode share the same component system

The color mode toggle SHALL switch a `dark` class on the document root element, and every ported component MUST read its colors from CSS custom properties that change value under the `.dark` selector, matching supastarter-nextjs-main's `@variant dark` mechanism.

#### Scenario: Toggling dark mode changes token values without changing markup

- **WHEN** a user activates the color mode toggle control
- **THEN** `document.documentElement.classList.contains('dark')` MUST become true and the background color custom property MUST change value, while the DOM structure of the page MUST NOT change

##### Example: Toggle click flips the class

- **GIVEN** the document root has no `dark` class
- **WHEN** the color mode toggle button is clicked
- **THEN** the document root gains the `dark` class and the computed `background-color` of `<body>` changes to the dark-mode token value
