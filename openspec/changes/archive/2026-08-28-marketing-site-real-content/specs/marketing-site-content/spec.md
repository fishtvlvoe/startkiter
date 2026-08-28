## ADDED Requirements

### Requirement: Pricing section displays the actual product offer

The marketing site's pricing section SHALL display the actual StartKiter product offer (a single one-time purchase priced 8800 TWD) and SHALL NOT display placeholder subscription plans unrelated to the real checkout logic.

#### Scenario: Pricing section shows the real one-time offer

- **WHEN** a visitor opens the marketing site home page in any supported locale
- **THEN** the pricing section MUST display exactly one plan card priced 8800 TWD as a one-time purchase, and MUST NOT display any USD-denominated recurring subscription plan

#### Scenario: Pricing section text is not empty

- **WHEN** a visitor opens the marketing site home page in zh-tw, zh-cn, or en
- **THEN** the pricing section's title, description, and feature list MUST render non-empty text, and MUST NOT render an empty or undefined value caused by a missing translation key

### Requirement: Home page hero, features, testimonials, and FAQ content reflects the real product

The marketing site's hero, features, testimonials, and FAQ sections SHALL describe the actual StartKiter product (a course paired with a lifetime private code kit, delivered via a buyer-owned GitHub repository) and SHALL NOT retain unmodified template demo content describing an unrelated multi-tenant subscription SaaS product.

#### Scenario: No placeholder demo identities remain

- **WHEN** the marketing site's translation files or rendered home page are inspected in any supported locale
- **THEN** they MUST NOT contain the placeholder demo names "Acme", "Maya Chen", "Jonas Weber", or "Amelia Ortiz", and MUST NOT contain FAQ content describing subscription cancellation or a free trial period that does not apply to StartKiter's one-time-purchase offer

#### Scenario: Hero copy names the real product

- **WHEN** a visitor opens the marketing site home page
- **THEN** the hero section's headline or supporting sentence MUST reference the course-plus-lifetime-code-kit offer, not a generic multi-tenant organization/billing SaaS pitch

### Requirement: README deployment instructions do not reference a retired deploy target

The project README SHALL NOT present a one-click deploy link or button pointing to a deployment platform that the project has stopped using in production.

#### Scenario: No stale deploy button

- **WHEN** a reader opens README.md
- **THEN** it MUST NOT contain a Zeabur one-click-deploy link or button, and any deployment guidance present MUST describe the currently active deployment approach
