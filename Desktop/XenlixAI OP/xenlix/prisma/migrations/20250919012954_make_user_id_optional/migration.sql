-- CreateTable
CREATE TABLE "AeoAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "businessInfo" JSONB NOT NULL,
    "auditResults" JSONB NOT NULL,
    "faqJsonLd" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AeoAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeoAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "aeoAuditId" TEXT,
    "auditResults" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "keywordData" JSONB,
    "technicalIssues" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
