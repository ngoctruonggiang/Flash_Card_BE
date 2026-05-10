/*
  Warnings:

  - You are about to alter the column `interval` on the `CardReview` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - Added the required column `newStatus` to the `CardReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousStatus` to the `CardReview` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deckId" INTEGER NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tags" TEXT,
    "wordType" TEXT,
    "pronunciation" TEXT,
    "examples" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "stepIndex" INTEGER NOT NULL DEFAULT 0,
    "interval" REAL NOT NULL DEFAULT 0,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "nextReviewDate" DATETIME,
    "reverseCardId" INTEGER,
    CONSTRAINT "Card_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Card" ("back", "createdAt", "deckId", "examples", "front", "id", "pronunciation", "tags", "updatedAt", "wordType") SELECT "back", "createdAt", "deckId", "examples", "front", "id", "pronunciation", "tags", "updatedAt", "wordType" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE INDEX "Card_deckId_idx" ON "Card"("deckId");
CREATE TABLE "new_CardReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cardId" INTEGER NOT NULL,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "interval" REAL NOT NULL,
    "eFactor" REAL NOT NULL,
    "nextReviewDate" DATETIME NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quality" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    CONSTRAINT "CardReview_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CardReview" ("cardId", "eFactor", "id", "interval", "nextReviewDate", "quality", "repetitions", "reviewedAt") SELECT "cardId", "eFactor", "id", "interval", "nextReviewDate", "quality", "repetitions", "reviewedAt" FROM "CardReview";
DROP TABLE "CardReview";
ALTER TABLE "new_CardReview" RENAME TO "CardReview";
CREATE INDEX "CardReview_cardId_idx" ON "CardReview"("cardId");
CREATE INDEX "CardReview_nextReviewDate_idx" ON "CardReview"("nextReviewDate");
CREATE TABLE "new_Deck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "colorCode" TEXT,
    "languageMode" TEXT NOT NULL DEFAULT 'VN_EN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Deck" ("colorCode", "createdAt", "description", "iconName", "id", "languageMode", "title", "updatedAt", "userId") SELECT "colorCode", "createdAt", "description", "iconName", "id", "languageMode", "title", "updatedAt", "userId" FROM "Deck";
DROP TABLE "Deck";
ALTER TABLE "new_Deck" RENAME TO "Deck";
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
