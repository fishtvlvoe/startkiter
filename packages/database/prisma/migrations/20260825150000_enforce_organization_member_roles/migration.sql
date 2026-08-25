-- Better Auth uses "member" as its native default role. Keep that input
-- compatible while storing the StartKiter role vocabulary as "user".
UPDATE "member"
SET "role" = 'user'
WHERE "role" = 'member';

-- Keep the four-value invariant at the database boundary as well as in the
-- Better Auth hooks. Unknown legacy values are regular users during migration.
UPDATE "member"
SET "role" = 'user'
WHERE "role" NOT IN ('owner', 'admin', 'instructor', 'user');

ALTER TABLE "member"
ADD CONSTRAINT "member_role_allowed"
CHECK ("role" IN ('owner', 'admin', 'instructor', 'user'));
