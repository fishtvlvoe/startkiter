-- The application hook transfers ownership in one transaction. This partial
-- unique index prevents concurrent writes from creating two owners.
CREATE UNIQUE INDEX "member_one_owner_per_organization"
ON "member" ("organizationId")
WHERE "role" = 'owner';
