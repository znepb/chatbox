/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "mayCreateLicense" BOOLEAN NOT NULL DEFAULT true,
    "bannedUntil" DATETIME,
    "licenseId" TEXT,
    "cbspyEnrolled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("cbspyEnrolled", "id", "licenseId", "mayCreateLicense", "username") SELECT "cbspyEnrolled", "id", "licenseId", "mayCreateLicense", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
