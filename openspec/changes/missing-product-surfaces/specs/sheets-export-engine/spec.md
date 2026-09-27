## ADDED Requirements

### Requirement: Admin can download the bundle spreadsheet

A signed-in user with `admin.access` SHALL download the bundle spreadsheet with `GET /api/export/bundles`. The response MUST be HTTP 200 with content type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and a body produced by `BundlesSpreadsheet`. A request without a session MUST receive HTTP 401. A signed-in user without `admin.access` MUST receive HTTP 403. When no bundle rows exist, the route MUST still return HTTP 200 and a workbook that contains the header row.

#### Scenario: Admin downloads bundles

- **WHEN** a signed-in user with `admin.access` calls `GET /api/export/bundles`
- **THEN** the response is HTTP 200 and the content type is the xlsx media type

#### Scenario: Missing session

- **WHEN** `GET /api/export/bundles` is called without a session
- **THEN** the response is HTTP 401

#### Scenario: Signed-in user without admin access

- **WHEN** a signed-in user without `admin.access` calls `GET /api/export/bundles`
- **THEN** the response is HTTP 403

#### Scenario: No bundle rows

- **WHEN** a signed-in user with `admin.access` calls `GET /api/export/bundles` and the bundle query returns no rows
- **THEN** the response is HTTP 200

### Requirement: Admin can download the coupon spreadsheet

A signed-in user with `admin.access` SHALL download the coupon spreadsheet with `GET /api/export/coupons`. The response MUST be HTTP 200 with content type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and a body produced by `CouponsSpreadsheet`. A request without a session MUST receive HTTP 401. A signed-in user without `admin.access` MUST receive HTTP 403. When no coupon rows exist, the route MUST still return HTTP 200 and a workbook that contains the header row.

#### Scenario: Admin downloads coupons

- **WHEN** a signed-in user with `admin.access` calls `GET /api/export/coupons`
- **THEN** the response is HTTP 200 and the content type is the xlsx media type

#### Scenario: Coupon export rejects a non-admin

- **WHEN** a signed-in user without `admin.access` calls `GET /api/export/coupons`
- **THEN** the response is HTTP 403 and the body is not an xlsx file
