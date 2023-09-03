/*
  Warnings:

  - You are about to drop the column `user` on the `License` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capabilities" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_License" ("capabilities", "createdAt", "id", "updatedAt", "userId") SELECT "capabilities", "createdAt", "id", "updatedAt", "userId" FROM "License";
DROP TABLE "License";
ALTER TABLE "new_License" RENAME TO "License";
CREATE UNIQUE INDEX "License_id_key" ON "License"("id");
CREATE UNIQUE INDEX "License_userId_key" ON "License"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
