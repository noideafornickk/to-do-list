-- DropIndex
DROP INDEX IF EXISTS "User_email_key";

-- DropIndex
DROP INDEX IF EXISTS "User_googleId_key";

-- AlterTable
ALTER TABLE "User" RENAME COLUMN "googleId" TO "googleSub";
ALTER TABLE "User" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

