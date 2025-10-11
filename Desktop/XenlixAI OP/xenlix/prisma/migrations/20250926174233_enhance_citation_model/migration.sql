/*
  Warnings:

  - Added the required column `normalizedUrl` to the `AnswerCitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawCitation` to the `AnswerCitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AnswerCitation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnswerCitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answerId" TEXT NOT NULL,
    "rawCitation" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT,
    "rank" INTEGER,
    "authorityScore" REAL,
    "confidenceScore" REAL,
    "citationType" TEXT,
    "isLive" BOOLEAN,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "lastChecked" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnswerCitation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AnswerCitation" ("answerId", "authorityScore", "domain", "id", "isPrimary", "rank", "title", "url") SELECT "answerId", "authorityScore", "domain", "id", "isPrimary", "rank", "title", "url" FROM "AnswerCitation";
DROP TABLE "AnswerCitation";
ALTER TABLE "new_AnswerCitation" RENAME TO "AnswerCitation";
CREATE INDEX "AnswerCitation_answerId_idx" ON "AnswerCitation"("answerId");
CREATE INDEX "AnswerCitation_domain_idx" ON "AnswerCitation"("domain");
CREATE INDEX "AnswerCitation_isPrimary_idx" ON "AnswerCitation"("isPrimary");
CREATE INDEX "AnswerCitation_authorityScore_idx" ON "AnswerCitation"("authorityScore");
CREATE INDEX "AnswerCitation_citationType_idx" ON "AnswerCitation"("citationType");
CREATE INDEX "AnswerCitation_isLive_idx" ON "AnswerCitation"("isLive");
CREATE INDEX "AnswerCitation_lastChecked_idx" ON "AnswerCitation"("lastChecked");
CREATE INDEX "AnswerCitation_normalizedUrl_idx" ON "AnswerCitation"("normalizedUrl");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
