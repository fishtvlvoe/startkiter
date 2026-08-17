-- CreateEnum
CREATE TYPE "GithubKitGrantStatus" AS ENUM ('invited', 'accepted', 'revoked', 'failed');

-- CreateTable
CREATE TABLE "github_kit_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "org" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'pull',
    "status" "GithubKitGrantStatus" NOT NULL,
    "orderNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_kit_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "github_kit_grants_userId_idx" ON "github_kit_grants"("userId");

-- CreateIndex
CREATE INDEX "github_kit_grants_githubLogin_idx" ON "github_kit_grants"("githubLogin");

-- CreateIndex
CREATE UNIQUE INDEX "github_kit_grants_userId_org_repo_key" ON "github_kit_grants"("userId", "org", "repo");

-- AddForeignKey
ALTER TABLE "github_kit_grants" ADD CONSTRAINT "github_kit_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
