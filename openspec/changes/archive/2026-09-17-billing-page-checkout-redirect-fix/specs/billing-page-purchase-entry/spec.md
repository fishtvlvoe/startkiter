## ADDED Requirements

### Requirement: Billing page purchase entry routes to the working checkout flow
The system SHALL route the `/settings/billing` page's plan-purchase action to the `/checkout` page (the payment flow actually wired to a live gateway), instead of invoking the unconnected generic subscription checkout flow (`createCheckoutLink`) that has no configured provider price ID for this product.

#### Scenario: A user without an existing purchase clicks the plan action on the billing page
- **WHEN** a signed-in user without course access opens `/settings/billing` and clicks the plan action
- **THEN** they are taken to `/checkout`, where the existing PAYUNi-backed purchase flow can complete

#### Scenario: A user who already purchased sees an owned state, not a purchase button
- **WHEN** a signed-in user with existing course access (per `userHasCourseAccess`) opens `/settings/billing`
- **THEN** the page shows an owned/entitled state and a link to `/course`, not a purchase action that would attempt to charge again

#### Scenario: No failed-checkout error appears on the billing page
- **WHEN** a user interacts with the billing page's plan action under this change
- **THEN** no "checkout failed" or provider-error message appears, because the page no longer calls the unconnected `createCheckoutLink` flow
