## MODIFIED Requirements

### Requirement: Locale is zh-TW only

The saas shell SHALL ship zh-TW, zh-CN, and en as the supported product locales at launch, with an architecture that allows additional locales to be added without component changes. zh-TW MUST remain the fallback locale for missing translation keys in any other locale.

#### Scenario: Boot does not depend on unconfigured locales

- **WHEN** apps/saas starts
- **THEN** missing message catalogs for locales other than zh-TW, zh-CN, and en MUST NOT cause HTTP 500 on GET /

#### Scenario: All three launch locales serve the public homepage

- **WHEN** a client requests GET /zh-tw, GET /zh-cn, and GET /en
- **THEN** each request MUST return HTTP 200 with page text rendered in the corresponding locale

## ADDED Requirements

### Requirement: Shell pages use the shared design system

apps/saas pages SHALL be composed from packages/ui design-system components (see the design-system capability) rather than page-local hand-written CSS classes for buttons, cards, badges, and form controls.

#### Scenario: Public homepage does not use bespoke button classes

- **WHEN** GET / is rendered
- **THEN** the DOM MUST NOT contain elements whose only styling comes from a page-local class named "button" or "hero" and MUST instead contain design-system component marker attributes

### Requirement: Marketing surface and app surface are not required to share identical layout

The public marketing pages (equivalent to supastarter.dev's presentation) and the authenticated app pages (equivalent to demo.supastarter.dev's presentation) SHALL NOT be required to use identical layout density or visual emphasis. Both SHALL draw their colors, typography, and components from the same shared design-system tokens defined in the design-system capability.

#### Scenario: Marketing and app pages share design tokens despite different layouts

- **WHEN** the computed CSS custom properties for color tokens are compared between GET / (marketing) and GET /app (authenticated app area)
- **THEN** the token values MUST be identical even if the two pages arrange components differently

##### Example: Same accent token, different layout density

- **GIVEN** GET / renders a centered single-column hero with generous vertical spacing, and GET /app renders a dense sidebar-plus-content-grid layout
- **WHEN** the `--accent` (or equivalently named accent color) CSS custom property is read from both pages' document roots
- **THEN** both pages MUST report the same hex value for `--accent`, even though the two pages' component arrangement differs
