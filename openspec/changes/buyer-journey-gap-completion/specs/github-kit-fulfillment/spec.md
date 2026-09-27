## ADDED Requirements

### Requirement: The claim entry point is visible where the buyer needs it, not only reachable via a direct API call

The checkout page and the course page SHALL each render a "claim your kit" control for a signed-in user whose order has `kitClaimEligible` true. Pressing the control SHALL invoke the existing `POST /api/github/claim` flow. A user whose order does not have `kitClaimEligible` true MUST NOT be shown a clickable claim control on either page.

#### Scenario: Eligible buyer sees a claim control on the checkout page

- **GIVEN** a signed-in user with an order where `kitClaimEligible` is true
- **WHEN** that user opens `/checkout` after already owning the product
- **THEN** the page SHALL render a clickable "領取代碼包" control next to the existing ownership message

#### Scenario: Eligible buyer sees a claim control on the course page

- **GIVEN** a signed-in user with an order where `kitClaimEligible` is true
- **WHEN** that user opens `/course`
- **THEN** the page SHALL render a clickable "領取代碼包" control

#### Scenario: Ineligible user sees no clickable claim control

- **GIVEN** a signed-in user with no order where `kitClaimEligible` is true
- **WHEN** that user opens `/checkout` or `/course`
- **THEN** neither page SHALL render a clickable claim control

#### Scenario: Pressing the control uses the existing claim flow without a new endpoint

- **WHEN** an eligible user presses the claim control
- **THEN** the client SHALL call the existing `POST /api/github/claim`, and no new HTTP endpoint SHALL be introduced for this control
