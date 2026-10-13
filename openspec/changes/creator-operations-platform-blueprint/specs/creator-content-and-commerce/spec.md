## Purpose

This capability defines how creators publish content and sell digital products, courses, bundles, and offers through one catalog and checkout model. It preserves the existing course and PAYUNi foundations while adding a common creator-facing model.

## ADDED Requirements

### Requirement: Content and sellable products SHALL have separate responsibilities

The system SHALL distinguish content resources from sellable products. A product SHALL reference one or more content entitlements, while content SHALL remain reusable across products and bundles. A CodePackage SHALL be representable as an independently sellable product and SHALL NOT require a Course or Bundle relationship. An Offer SHALL define whether its delivery includes course access, bundle access, CodePackage access, or a combination of these outcomes.

The server SHALL persist the selected Offer's price, currency, delivery-resource set, applicable policy version, and CodePackage outcome when creating a checkout order or subscription agreement. Payment processing SHALL use that persisted snapshot rather than mutable current catalog membership. Missing historical resource evidence SHALL block the affected backfill for explicit mapping review, not invent historical membership from the current Bundle. Revoking one qualifying transaction SHALL recompute access from other independently valid grants and SHALL NOT erase them.

#### Scenario: A creator sells one course in two offers

- **WHEN** a creator creates a one-time offer and a subscription offer for the same course
- **THEN** both offers grant the configured course entitlement without duplicating the course record

##### Example: Concrete acceptance fixture 1

- **GIVEN** Course A exists once; Offers P1 one-time and P2 subscription both reference A
- **WHEN** the two Offers are saved with valid policies
- **THEN** both map to A; Course count remains 1 and access validity is controlled by the selected Offer

#### Scenario: A creator edits content used by an offer

- **WHEN** a creator updates a lesson or media item
- **THEN** the system updates the content resource while preserving the offer, order, and entitlement history

##### Example: Concrete acceptance fixture 2

- **GIVEN** Order O1 snapshots A access and lesson L1 revision R1 belongs to A
- **WHEN** the creator edits L1 to R2
- **THEN** L1 content changes while O1 price, course scope and eligibility history remain unchanged

#### Scenario: A creator sells a standalone CodePackage

- **WHEN** a creator creates a one-time or subscription Offer for a CodePackage product without attaching a Course
- **THEN** the Offer is valid, the checkout does not require a Course entitlement, and a successful payment grants only the configured CodePackage entitlement

##### Example: Concrete acceptance fixture 3

- **GIVEN** Offer K1 references only CodePackage template T1 and has valid license policy
- **WHEN** K1 is published and paid
- **THEN** only CodePackage eligibility is granted; no Course or Bundle is required or unlocked

#### Scenario: A creator combines a CodePackage with a course offer

- **WHEN** a creator configures an Offer to deliver one Course and the global CodePackage
- **THEN** the Offer grants both delivery outcomes while preserving separate Course access and CodePackage eligibility records

##### Example: Concrete acceptance fixture 4

- **GIVEN** Offer P1 delivers Course A and CodePackage T1
- **WHEN** buyer B1 pays P1
- **THEN** A access and T1 eligibility are separate records with the same qualifying order reference

### Requirement: A creator SHALL manage a simple website and sales flow

The platform SHALL support a published page, a form or checkout entry, and an optional funnel sequence as first-class resources. Each published resource SHALL have a status, owner workspace, locale, and revision history.

#### Scenario: A creator publishes a lead capture page

- **WHEN** a creator saves valid content and publishes the page
- **THEN** the public route shows the published revision and the form records a contact source

##### Example: Concrete acceptance fixture 5

- **GIVEN** page P1 revision R1 contains form F1 in W1
- **WHEN** R1 is published and C1 submits F1
- **THEN** the public page uses R1 and C1 source references F1/P1 in W1

#### Scenario: A creator edits a published page

- **WHEN** a creator edits a published page
- **THEN** the system creates a draft revision and leaves the current published revision unchanged until publish

##### Example: Concrete acceptance fixture 6

- **GIVEN** P1 published revision is R1
- **WHEN** the creator saves new text as R2 without publishing
- **THEN** public P1 stays R1 and R2 remains draft

#### Scenario: A public page presents multiple courses

- **WHEN** a creator publishes a page containing multiple course cards and valid purchase calls to action
- **THEN** the public page shows the configured courses, each call to action resolves to its configured offer, and page revisions remain independent from historical orders

##### Example: Concrete acceptance fixture 7

- **GIVEN** public page P1 lists Course A/Offer A1 and Course B/Offer B1
- **WHEN** a buyer selects B purchase
- **THEN** the CTA selects B1 and historical Order O1 for A1 is unchanged

### Requirement: Offers SHALL connect to Taiwan checkout and order records

The system SHALL represent price, currency, payment mode, tax or invoice requirements, entitlement outcome, CodePackage delivery policy, and refund policy for each Offer. Checkout SHALL use the existing provider abstraction and SHALL create an auditable order or subscription state transition. A subscription Offer SHALL be able to grant time-bounded content access and SHALL define whether CodePackage access is perpetual, active-period-bound, or excluded.

A published recurring Offer SHALL explicitly define its access expiry, cancellation effect, update-channel eligibility, source-license terms, and repository-grant policy. Revoking a repository grant SHALL NOT be described as deleting source copies already delivered to the buyer. Unresolved commercial policies SHALL block publication of the affected new Offer, not change historical paid Order snapshots or already-approved legacy Offers.

#### Scenario: A buyer purchases a TWD offer

- **WHEN** a buyer completes a valid PAYUNi checkout in TWD
- **THEN** the system records the order, payment reference, entitlement result, and customer contact linkage

##### Example: Concrete acceptance fixture 8

- **GIVEN** Offer A1 is TWD 8800 and Order O1 awaits payment
- **WHEN** a valid signed payment result matches O1 stored amount and currency
- **THEN** O1 is paid with provider reference, intended entitlement and contact linkage

#### Scenario: A buyer purchases a multi-course offer

- **WHEN** a buyer completes a valid PAYUNi checkout for an offer that references multiple courses
- **THEN** the system records one order and grants each configured course entitlement exactly once

##### Example: Concrete acceptance fixture 9

- **GIVEN** Bundle B1 snapshots A/B in Order O1
- **WHEN** O1 payment succeeds and its notification is replayed
- **THEN** one O1 exists and A/B are each granted once; Course C is not granted

#### Scenario: Checkout provider is unavailable

- **WHEN** the configured payment provider is missing or unavailable
- **THEN** checkout fails closed with a user-readable message and SHALL NOT grant an entitlement

##### Example: Concrete acceptance fixture 10

- **GIVEN** payment provider is not configured and O1 is unpaid
- **WHEN** buyer B1 attempts checkout
- **THEN** the operation explains the missing provider and grants no entitlement

#### Scenario: Buyer subscribes to a standalone CodePackage

- **WHEN** an authenticated buyer completes a valid recurring checkout for a published standalone CodePackage Offer
- **THEN** the system creates the subscription state and grants the configured CodePackage policy without granting unrelated course access

##### Example: Concrete acceptance fixture 11

- **GIVEN** published CodePackage subscription K1 has approved active-period update policy and no Course
- **WHEN** buyer B1 completes valid recurring checkout
- **THEN** subscription S1 and CodePackage policy outcome are recorded without Course access

#### Scenario: Subscription Offer excludes CodePackage access

- **WHEN** a buyer completes a subscription Offer whose delivery policy excludes CodePackage
- **THEN** the system grants the configured Course or Bundle access for the active subscription and does not create CodePackage eligibility

##### Example: Concrete acceptance fixture 12

- **GIVEN** Course A subscription P1 delivery policy is none for CodePackage
- **WHEN** B1 pays P1
- **THEN** only time-bounded A access is created and no repo claim eligibility is added

### Requirement: Existing course operations SHALL remain reusable

Course management, lessons, assignments, quizzes, reviews, bundles, media, and course access SHALL remain owned by existing course packages and SHALL be exposed through the creator platform registry instead of being copied into a new product module.

#### Scenario: A creator opens course operations from the platform shell

- **WHEN** a creator selects course operations
- **THEN** the system routes to the existing course management surface with the platform workspace context

##### Example: Concrete acceptance fixture 13

- **GIVEN** W1 actor U1 has course-admin capability and existing course management route
- **WHEN** U1 selects course operations
- **THEN** the existing course surface receives W1 context without a second Course record authority

#### Scenario: A new product references an existing bundle

- **WHEN** a creator attaches a bundle to an offer
- **THEN** the system reuses the existing bundle access rules and does not create a second bundle authority

##### Example: Concrete acceptance fixture 14

- **GIVEN** Bundle B1 currently maps A/B and its module owns access rules
- **WHEN** Offer P1 attaches B1
- **THEN** P1 references B1 and historical order snapshots use the existing Bundle contract rather than copied rules

