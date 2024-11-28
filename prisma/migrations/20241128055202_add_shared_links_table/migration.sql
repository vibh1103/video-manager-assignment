-- CreateTable
CREATE TABLE "Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SharedLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "SharedLink_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedLink_link_key" ON "SharedLink"("link");
