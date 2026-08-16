## ADDED Requirements

### Requirement: Login and signup forms use the shared design system

The login and signup pages SHALL be composed from packages/ui design-system Input, Button, and Form components rather than page-local hand-written form markup.

#### Scenario: Login form fields are design-system components

- **WHEN** GET /login is rendered
- **THEN** the email input, password input, and submit button MUST carry design-system component marker attributes rather than page-local class names as their only styling source

##### Example: No page-local form classes remain

- **GIVEN** the pre-migration login form used classes like `className="input"` and `className="button"`
- **WHEN** the migrated GET /login DOM is inspected
- **THEN** no form control MUST have `input` or `button` as its only class name; each MUST instead carry a `data-slot` attribute identifying it as a design-system component

### Requirement: Auth provider list is structurally extensible

The set of enabled social login providers SHALL be defined as a list that can be extended with a new provider by adding a configuration entry, without requiring changes to the login page's layout markup.

#### Scenario: A new provider is enabled without layout changes

- **WHEN** a new social provider configuration entry is added to the provider list
- **THEN** the login page MUST render an additional provider button using the existing provider button layout, without any edit to the page's JSX structure outside the provider list iteration

##### Example: Adding GitHub as a third social provider

- **GIVEN** the provider list constant contains entries for `google` and `line`, each rendering a button via a `.map()` over the list
- **WHEN** a `github` entry is appended to the provider list constant
- **THEN** GET /login MUST render three provider buttons (google, line, github), and `git diff` for this change MUST show only the provider list constant file changed, not the login page's JSX layout file
