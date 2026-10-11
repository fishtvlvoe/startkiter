## Purpose

This capability defines how creators publish content and sell digital products, courses, bundles, and offers through one catalog and checkout model. It preserves the existing course and PAYUNi foundations while adding a common creator-facing model.

## ADDED Requirements

### Requirement: Content and sellable products SHALL have separate responsibilities

The system SHALL distinguish content resources from sellable products. A product SHALL reference one or more content entitlements, while content SHALL remain reusable across products and bundles.

#### Scenario: A creator sells one course in two offers

- **WHEN** a creator creates a one-time offer and a subscription offer for the same course
- **THEN** both offers grant the configured course entitlement without duplicating the course record

#### Scenario: A creator edits content used by an offer

- **WHEN** a creator updates a lesson or media item
- **THEN** the system updates the content resource while preserving the offer, order, and entitlement history

### Requirement: A creator SHALL manage a simple website and sales flow

The platform SHALL support a published page, a form or checkout entry, and an optional funnel sequence as first-class resources. Each published resource SHALL have a status, owner workspace, locale, and revision history.

#### Scenario: A creator publishes a lead capture page

- **WHEN** a creator saves valid content and publishes the page
- **THEN** the public route shows the published revision and the form records a contact source

#### Scenario: A creator edits a published page

- **WHEN** a creator edits a published page
- **THEN** the system creates a draft revision and leaves the current published revision unchanged until publish

### Requirement: Offers SHALL connect to Taiwan checkout and order records

The system SHALL represent price, currency, payment mode, tax or invoice requirements, entitlement outcome, and refund policy for each offer. Checkout SHALL use the existing provider abstraction and SHALL create an auditable order state transition.

#### Scenario: A buyer purchases a TWD offer

- **WHEN** a buyer completes a valid PAYUNi checkout in TWD
- **THEN** the system records the order, payment reference, entitlement result, and customer contact linkage

#### Scenario: Checkout provider is unavailable

- **WHEN** the configured payment provider is missing or unavailable
- **THEN** checkout fails closed with a user-readable message and SHALL NOT grant an entitlement

### Requirement: Existing course operations SHALL remain reusable

Course management, lessons, assignments, quizzes, reviews, bundles, media, and course access SHALL remain owned by existing course packages and SHALL be exposed through the creator platform registry instead of being copied into a new product module.

#### Scenario: A creator opens course operations from the platform shell

- **WHEN** a creator selects course operations
- **THEN** the system routes to the existing course management surface with the platform workspace context

#### Scenario: A new product references an existing bundle

- **WHEN** a creator attaches a bundle to an offer
- **THEN** the system reuses the existing bundle access rules and does not create a second bundle authority

