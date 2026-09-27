## Purpose

Operators need to create and deactivate checkout coupons from the admin course screen. The coupon table and checkout validation already exist, and production code has no create or deactivate path outside tests.

## ADDED Requirements

### Requirement: Operator can create one coupon

An operator SHALL create one coupon by POSTing JSON to `/api/coupons`. The server MUST normalize `code` by trimming and uppercasing it before insert. `discountType` MUST be `amount` or `percent`. An `amount` coupon MUST include a positive integer `amountOff`. A `percent` coupon MUST include an integer `percentOff` from 1 through 100. A caller who is not an operator MUST receive HTTP 403 and the server MUST NOT insert a row. Invalid fields MUST receive HTTP 400 and the server MUST NOT insert a row. A code that already exists MUST receive HTTP 409 and the existing row MUST stay unchanged.

#### Scenario: Operator creates an amount coupon

- **WHEN** an operator POSTs `/api/coupons` with code ` save100 `, discountType `amount`, and amountOff `100`
- **THEN** the response is HTTP 201 and the stored code is `SAVE100`

##### Example: 金額券

| Input code | discountType | amountOff | Expected stored code | HTTP |
| ---------- | ------------ | --------- | -------------------- | ---- |
| ` save100 ` | amount | 100 | SAVE100 | 201 |

#### Scenario: Duplicate code does not overwrite

- **WHEN** an operator POSTs `/api/coupons` with a code that already exists
- **THEN** the response is HTTP 409 and the original discount values remain

#### Scenario: Percent outside 1 to 100 is rejected

- **WHEN** an operator POSTs `/api/coupons` with discountType `percent` and percentOff `0` or `101`
- **THEN** the response is HTTP 400 and no coupon row is inserted

#### Scenario: Non-operator cannot create

- **WHEN** a signed-in instructor who is not an operator POSTs `/api/coupons`
- **THEN** the response is HTTP 403 and no coupon row is inserted

#### Scenario: Empty code is rejected

- **WHEN** an operator POSTs `/api/coupons` with a blank code
- **THEN** the response is HTTP 400 and no coupon row is inserted

### Requirement: Operator can deactivate a coupon without deleting it

An operator SHALL deactivate a coupon by POSTing `{ "code": "<code>" }` to `/api/coupons/deactivate`. The server MUST set `active` to false and MUST NOT delete the row or change `timesRedeemed`. A missing code MUST receive HTTP 404. A non-operator MUST receive HTTP 403 and the row MUST stay unchanged. Deactivating an already inactive coupon MUST receive HTTP 200 with `active` still false.

#### Scenario: Active coupon becomes inactive

- **WHEN** an operator POSTs `/api/coupons/deactivate` for an active code
- **THEN** the response is HTTP 200 and that coupon's `active` field is false while `timesRedeemed` is unchanged

#### Scenario: Missing coupon

- **WHEN** an operator POSTs `/api/coupons/deactivate` for a code that does not exist
- **THEN** the response is HTTP 404

### Requirement: Instructor used-coupon list stays scoped

The course coupons page MUST keep listing only coupons already referenced by orders of courses the signed-in user can manage. A `percent` coupon on that list MUST display its percent off, and an `amount` coupon MUST display its amount off. The create and deactivate controls MUST render only for an operator.

#### Scenario: Instructor does not see create controls

- **WHEN** a signed-in instructor who is not an operator opens the course coupons page
- **THEN** the page does not render a create form and still lists only used coupons in that instructor's courses

##### Example: 講師帳號

- **GIVEN** user `instructor_1` is signed in, is not an operator, and can manage course `course_a`
- **WHEN** `instructor_1` opens the course coupons page
- **THEN** the response HTML does not contain a form whose action is POST `/api/coupons`
