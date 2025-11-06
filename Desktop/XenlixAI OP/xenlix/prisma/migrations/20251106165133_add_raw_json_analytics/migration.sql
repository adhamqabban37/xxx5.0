/*
  Warnings:

  - A unique constraint covering the columns `[answerId,normalizedUrl]` on the table `AnswerCitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "industry" TEXT,
    "description" TEXT,
    "companyInfoJson" JSONB NOT NULL,
    "visibilityScore" REAL,
    "lastScanAt" DATETIME,
    "nextScanAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scanProgress" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QueryResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "questionType" TEXT,
    "mentioned" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "sentiment" REAL,
    "context" TEXT,
    "answerText" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "QueryResult_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyCitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT,
    "pageRank" REAL,
    "authorityScore" REAL,
    "source" TEXT NOT NULL,
    "engine" TEXT,
    "query" TEXT,
    "isLive" BOOLEAN,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "lastChecked" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyCitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyCompetitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "competitorDomain" TEXT,
    "industry" TEXT,
    "visibilityScore" REAL,
    "brandMentions" INTEGER NOT NULL DEFAULT 0,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "aeoScore" REAL,
    "appearsInQueries" JSONB,
    "citationGaps" JSONB,
    "lastAnalyzed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyCompetitor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "visibilityIndex" REAL NOT NULL,
    "coveragePct" REAL NOT NULL,
    "sourceSharePct" REAL NOT NULL,
    "schemaScore" REAL,
    "contentScore" REAL,
    "technicalScore" REAL,
    "industryAvg" REAL,
    "percentile" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyScore_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "actionItems" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyRecommendation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyScanJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "resultData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyScanJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AeoValidation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "businessName" TEXT,
    "businessType" TEXT,
    "validationResults" JSONB NOT NULL,
    "overallScore" REAL NOT NULL,
    "issueCount" INTEGER NOT NULL,
    "criticalIssues" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "stripePaymentIntentId" TEXT,
    "premiumUnlockedAt" DATETIME,
    "authorityScore" REAL,
    "competitorAuthority" JSONB,
    "psiMobile" JSONB,
    "psiDesktop" JSONB,
    "psiPerf" REAL,
    "psiSeo" REAL,
    "psiAccessibility" REAL,
    "psiBestPractices" REAL,
    "gscSummary" JSONB,
    "gscConnected" BOOLEAN NOT NULL DEFAULT false,
    "optimizedSchemas" JSONB,
    "implementationGuide" JSONB,
    "competitorAnalysis" JSONB,
    "rawJson" JSONB,
    "schemaVersion" TEXT,
    "analyzerVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AeoValidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoogleTokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "grantedScopes" TEXT,
    "verifiedSites" JSONB,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoogleTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- CreateIndex
CREATE INDEX "Company_domain_idx" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "Company_visibilityScore_idx" ON "Company"("visibilityScore");

-- CreateIndex
CREATE INDEX "Company_lastScanAt_idx" ON "Company"("lastScanAt");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "QueryResult_companyId_idx" ON "QueryResult"("companyId");

-- CreateIndex
CREATE INDEX "QueryResult_engine_region_idx" ON "QueryResult"("engine", "region");

-- CreateIndex
CREATE INDEX "QueryResult_mentioned_idx" ON "QueryResult"("mentioned");

-- CreateIndex
CREATE INDEX "QueryResult_fetchedAt_idx" ON "QueryResult"("fetchedAt");

-- CreateIndex
CREATE INDEX "CompanyCitation_companyId_idx" ON "CompanyCitation"("companyId");

-- CreateIndex
CREATE INDEX "CompanyCitation_domain_idx" ON "CompanyCitation"("domain");

-- CreateIndex
CREATE INDEX "CompanyCitation_authorityScore_idx" ON "CompanyCitation"("authorityScore");

-- CreateIndex
CREATE INDEX "CompanyCitation_source_idx" ON "CompanyCitation"("source");

-- CreateIndex
CREATE INDEX "CompanyCitation_isTrusted_idx" ON "CompanyCitation"("isTrusted");

-- CreateIndex
CREATE INDEX "CompanyCompetitor_companyId_idx" ON "CompanyCompetitor"("companyId");

-- CreateIndex
CREATE INDEX "CompanyCompetitor_competitorDomain_idx" ON "CompanyCompetitor"("competitorDomain");

-- CreateIndex
CREATE INDEX "CompanyCompetitor_visibilityScore_idx" ON "CompanyCompetitor"("visibilityScore");

-- CreateIndex
CREATE INDEX "CompanyScore_companyId_date_idx" ON "CompanyScore"("companyId", "date");

-- CreateIndex
CREATE INDEX "CompanyScore_visibilityIndex_idx" ON "CompanyScore"("visibilityIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyScore_companyId_date_key" ON "CompanyScore"("companyId", "date");

-- CreateIndex
CREATE INDEX "CompanyRecommendation_companyId_status_idx" ON "CompanyRecommendation"("companyId", "status");

-- CreateIndex
CREATE INDEX "CompanyRecommendation_priority_impact_idx" ON "CompanyRecommendation"("priority", "impact");

-- CreateIndex
CREATE INDEX "CompanyScanJob_companyId_status_idx" ON "CompanyScanJob"("companyId", "status");

-- CreateIndex
CREATE INDEX "CompanyScanJob_jobType_status_idx" ON "CompanyScanJob"("jobType", "status");

-- CreateIndex
CREATE INDEX "AeoValidation_userId_idx" ON "AeoValidation"("userId");

-- CreateIndex
CREATE INDEX "AeoValidation_paymentStatus_idx" ON "AeoValidation"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleTokens_userId_key" ON "GoogleTokens"("userId");

-- CreateIndex
CREATE INDEX "GoogleTokens_userId_idx" ON "GoogleTokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerCitation_answerId_normalizedUrl_key" ON "AnswerCitation"("answerId", "normalizedUrl");
