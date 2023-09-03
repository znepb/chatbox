-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "mayCreateLicense" BOOLEAN NOT NULL,
    "isAdmin" BOOLEAN NOT NULL,
    "licenseId" TEXT
);
INSERT INTO "new_User" ("id", "isAdmin", "licenseId", "mayCreateLicense", "username") SELECT "id", "isAdmin", "licenseId", "mayCreateLicense", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
