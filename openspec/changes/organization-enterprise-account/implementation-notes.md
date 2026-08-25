# Implementation notes

## Task 1.1 Better Auth role probe

The Better Auth `organization` plugin was exercised with its in-memory test
adapter. Its native writes were:

- organization creator: `owner`
- added member with the native `member` role: `member`

The native `member` value is incompatible with the four-value StartKiter role
set. Prisma enum was therefore not selected. The implementation keeps the
database column as text, normalizes Better Auth's compatibility input
`member -> user` in `organizationHooks`, and adds a PostgreSQL CHECK constraint
for `owner`, `admin`, `instructor`, and `user`. Existing non-canonical values
are migrated to `user` before the constraint is installed.
