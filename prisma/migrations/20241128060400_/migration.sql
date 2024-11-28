/*
  Warnings:

  - Added the required column `updatedAt` to the `SharedLink` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SharedLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SharedLink_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SharedLink" ("expiresAt", "id", "link", "videoId") SELECT "expiresAt", "id", "link", "videoId" FROM "SharedLink";
DROP TABLE "SharedLink";
ALTER TABLE "new_SharedLink" RENAME TO "SharedLink";
CREATE UNIQUE INDEX "SharedLink_link_key" ON "SharedLink"("link");
CREATE TABLE "new_Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Video" ("duration", "id", "name", "path", "size", "uploadedAt") SELECT "duration", "id", "name", "path", "size", "uploadedAt" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
