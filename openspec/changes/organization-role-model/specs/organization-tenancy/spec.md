## ADDED Requirements

### Requirement: Organization membership roles are a fixed four-value set

Every Member record SHALL have a role value that is exactly one of `owner`, `admin`, `instructor`, or `user`. No other role value SHALL be permitted.

#### Scenario: Role value outside the four-value set is rejected

- **WHEN** a Member record is created or updated with a role value that is not `owner`, `admin`, `instructor`, or `user`
- **THEN** the operation MUST be rejected

##### Example: Invalid role rejected

- **GIVEN** an organization with an existing member
- **WHEN** an attempt is made to set that member's role to `moderator`
- **THEN** the system MUST reject the change and the member's role MUST remain unchanged

### Requirement: Every organization has exactly one owner

Each Organization SHALL have exactly one Member with the `owner` role at all times. Transferring ownership to another member MUST demote the previous owner to `admin` in the same operation.

#### Scenario: Ownership transfer demotes the previous owner

- **WHEN** an organization's owner transfers ownership to another existing member
- **THEN** the new member's role MUST become `owner` and the previous owner's role MUST become `admin`, and the organization MUST still have exactly one `owner` after the operation

##### Example: Transfer from Alice to Bob

- **GIVEN** an organization where Alice has role `owner` and Bob has role `admin`
- **WHEN** Alice transfers ownership to Bob
- **THEN** Bob's role becomes `owner` and Alice's role becomes `admin`

### Requirement: Only owner or admin can assign or revoke the instructor role

Changing a member's role to or from `instructor` SHALL only be permitted when the actor performing the change has role `owner` or `admin` in that organization. Members with role `instructor` or `user` MUST NOT be permitted to change any member's role, including their own.

#### Scenario: Admin assigns instructor role to a user

- **WHEN** an organization admin changes a member with role `user` to role `instructor`
- **THEN** the operation MUST succeed and the member's role MUST become `instructor`

#### Scenario: Instructor cannot self-promote or promote others

- **WHEN** a member with role `instructor` attempts to change any member's role (including their own)
- **THEN** the operation MUST be rejected

#### Scenario: User cannot self-promote

- **WHEN** a member with role `user` attempts to change their own role to `instructor`
- **THEN** the operation MUST be rejected

##### Example: Rejected self-promotion

- **GIVEN** a member Carol with role `user`
- **WHEN** Carol attempts to set her own role to `instructor`
- **THEN** the system MUST reject the change and Carol's role MUST remain `user`

### Requirement: Instructor role grants course content permissions but not billing visibility

A member with role `instructor` SHALL be permitted to create and edit course content within their organization. A member with role `instructor` MUST NOT be permitted to view the organization's full order list or buyer roster; that visibility is restricted to `owner` and `admin`.

#### Scenario: Instructor can edit course content

- **WHEN** a member with role `instructor` attempts to create or edit a course lesson within their organization
- **THEN** the operation MUST be permitted

#### Scenario: Instructor cannot view organization orders

- **WHEN** a member with role `instructor` attempts to view the organization's order list
- **THEN** the operation MUST be rejected

### Requirement: Every member can view their own purchased courses regardless of role

Any member of an organization, regardless of role (`owner`, `admin`, `instructor`, or `user`), SHALL be able to view and watch courses they have personally purchased access to.

#### Scenario: A user role member watches their own purchased course

- **WHEN** a member with role `user` who has purchased course access requests to view that course
- **THEN** the request MUST succeed
