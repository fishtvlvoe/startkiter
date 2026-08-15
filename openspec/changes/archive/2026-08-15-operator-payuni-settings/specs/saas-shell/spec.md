## ADDED Requirements

### Requirement: Operator navigation reaches settings
When a signed-in operator views authenticated primary navigation, a link to /admin/settings MUST be visible. Learners MUST NOT see that link.

#### Scenario: Operator nav includes settings
- **WHEN** a signed-in operator views a page that renders SiteNav
- **THEN** a link targeting /admin/settings MUST be present

#### Scenario: Learner nav omits settings
- **WHEN** a signed-in learner whose email is not ADMIN_EMAIL views SiteNav
- **THEN** the document MUST NOT contain a hyperlink to /admin/settings
