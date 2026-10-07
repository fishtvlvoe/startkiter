# fresh-install-migrations Specification

## Purpose

Fresh install migrations guarantee that applying every Prisma migration to an empty PostgreSQL database succeeds and yields the columns the application reads, so a buyer can create a working database from the repository alone.

## Requirements

### Requirement: Migrations apply cleanly to an empty database

Running `prisma migrate deploy` against an empty PostgreSQL database SHALL apply every migration in `packages/database/prisma/migrations/` without error.

#### Scenario: Empty database

- **WHEN** `prisma migrate deploy` runs against a newly created empty database
- **THEN** the command exits with code 0 and reports that all migrations were applied

#### Scenario: Duplicate newsletter automation migration

- **WHEN** migration `20260916031800_add_newsletter_automation` runs after `20260915221513_add_newsletter_automation`
- **THEN** it performs no schema change and does not raise `type "EmailBounceState" already exists`


<!-- @trace
source: fresh-install-migration-chain
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: Welcome email content column matches the schema

After all migrations are applied, table `course_welcome_email` SHALL have column `contentJson` and SHALL NOT have column `content_json`, regardless of which of the two columns existed before migration `20261007000000_fix_welcome_email_content_json_column` ran.

##### Example: Column states

| Before fix migration | After fix migration | Data |
| -------------------- | ------------------- | ---- |
| only content_json | only contentJson | values preserved |
| both columns, content_json has value, contentJson NULL | only contentJson | value copied from content_json |
| only contentJson | only contentJson | unchanged |
| neither | only contentJson | NULL |

#### Scenario: Fresh install column

- **WHEN** all migrations are applied to an empty database
- **THEN** `information_schema.columns` for `course_welcome_email` lists `contentJson` and does not list `content_json`


<!-- @trace
source: fresh-install-migration-chain
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->

---
### Requirement: One-command fresh install verification

`pnpm --filter @startkiter/database verify:fresh-install` SHALL create a temporary database, apply all migrations, check the `course_welcome_email` columns, and drop the temporary database on both success and failure. It SHALL exit 0 and print `fresh install OK` on success, and exit 1 with the failing step on failure. When `DATABASE_URL` is not set it SHALL exit 1 without creating a database.

#### Scenario: Verification passes

- **WHEN** the migrations are correct and the command runs
- **THEN** it prints `fresh install OK`, exits 0, and no database named `startkiter_fresh_verify_*` remains

#### Scenario: Verification fails

- **WHEN** a migration fails to apply
- **THEN** the command exits 1, prints the failing migration error, and no database named `startkiter_fresh_verify_*` remains

#### Scenario: Missing DATABASE_URL

- **WHEN** `DATABASE_URL` is empty
- **THEN** the command prints that `DATABASE_URL` is not set and exits 1

<!-- @trace
source: fresh-install-migration-chain
updated: 2026-10-07
code:
  - docs/dashboard/README.md
  - AGENTS.md
-->