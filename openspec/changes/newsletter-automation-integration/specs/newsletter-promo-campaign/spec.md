## Purpose

Promo campaign features add the promotional-newsletter-only building blocks — a coupon block that can't be typo'd, a course/bundle CTA card pulled live from catalog data, a static countdown, and automatic UTM tagging — so a creator can build a converting promotional email without hand-typing a price, a link, or a coupon code that could drift from the source of truth.

## ADDED Requirements

### Requirement: Coupon block bound to an existing coupon

The system SHALL let a creator insert a coupon block by selecting an existing `Coupon` record, auto-populating the code and expiry from that record, and SHALL NOT allow the coupon code to be manually typed or edited in the block.

#### Scenario: Coupon code field is read-only

- **WHEN** a creator inserts a coupon block and selects a coupon
- **THEN** the rendered code field SHALL display that coupon's code and SHALL NOT be editable as free text

### Requirement: Coupon validity checked before send

The system SHALL validate the bound coupon's active status, expiry, and redemption limit both when the block is inserted and again immediately before the campaign is sent, and SHALL block sending if the coupon has expired, been deactivated, or reached its redemption limit.

#### Scenario: Expired coupon blocks send

- **WHEN** a promotional campaign's bound coupon has an `expiresAt` in the past at send-confirmation time
- **THEN** the system SHALL block the send and SHALL indicate the coupon is invalid

### Requirement: Course/bundle CTA card pulled from catalog data

The system SHALL let a creator insert a course or bundle CTA card by selecting a `Course` or `Bundle` record, auto-populating the cover image, title, and price from that record, and SHALL NOT allow the price or link to be manually typed.

#### Scenario: Price field is not editable

- **WHEN** a creator inserts a course CTA card
- **THEN** the rendered price SHALL match the selected course's current price and SHALL NOT be a free-text field

### Requirement: Static countdown text

The system SHALL render the countdown block as static localized text derived from the bound coupon's `expiresAt`, and SHALL NOT use client-side JavaScript or an animated image to render it.

#### Scenario: Countdown reflects coupon expiry as static text

- **WHEN** a countdown block is bound to a coupon expiring on a given date
- **THEN** the rendered email SHALL contain static text stating that date, with no script-driven or animated countdown element

### Requirement: Automatic UTM tagging on promotional links

The system SHALL automatically append `utm_source=newsletter`, `utm_medium=email`, `utm_campaign`, and `utm_content` parameters to every link in a promotional campaign, without requiring the creator to enter them manually.

#### Scenario: Course CTA link carries UTM parameters

- **WHEN** a promotional campaign containing a course CTA card is rendered
- **THEN** the CTA link SHALL include `utm_source=newsletter`, `utm_medium=email`, `utm_campaign`, and `utm_content` query parameters

### Requirement: Marketing consent lock on promotional audience

The system SHALL force every promotional-campaign audience query to include a marketing-consent condition that requires `marketingConsent = true`, and SHALL reject at the API level any promotional send request whose computed audience was not filtered by that condition.

#### Scenario: API-level bypass attempt is rejected

- **WHEN** a request to send a promotional campaign is constructed without the marketing-consent filter applied
- **THEN** the system SHALL reject the request with an error and SHALL NOT dispatch any email
