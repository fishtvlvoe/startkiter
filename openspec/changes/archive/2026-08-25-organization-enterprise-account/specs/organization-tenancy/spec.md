## ADDED Requirements

### Requirement: Organization-scoped course purchases grant access to all current members

When an Order's `organizationId` references an Organization, every current Member of that Organization SHALL have `courseAccess` for the course associated with that Order, independent of their own personal Order history.

#### Scenario: A member without a personal order accesses a course through their organization

- **WHEN** a Member has no personal Order granting `courseAccess`, and belongs to an Organization that has an Order with `courseAccess: true`
- **THEN** the Member's course access check MUST succeed

#### Scenario: A newly added member immediately inherits existing organization access

- **WHEN** a user is added as a Member to an Organization that already has an Order with `courseAccess: true`
- **THEN** that new Member's course access check MUST succeed without requiring any additional purchase

### Requirement: Organization invitations are delivered by email

An Invitation created for an Organization SHALL trigger an email notification to the invited address. It SHALL NOT be delivered through LINE Messaging.

#### Scenario: Inviting a new member sends an email

- **WHEN** an owner or admin creates an Invitation for an email address that is not yet a Member
- **THEN** an email notification MUST be sent to that address, and no LINE message MUST be sent for this invitation
