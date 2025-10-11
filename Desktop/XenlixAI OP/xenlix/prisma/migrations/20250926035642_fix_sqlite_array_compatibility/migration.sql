-- CreateTable
CREATE TABLE "AuthoritySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "oprDecimal" REAL NOT NULL,
    "oprInteger" INTEGER NOT NULL,
    "globalRank" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'openpagerank',
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PSISnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performance" REAL NOT NULL,
    "accessibility" REAL NOT NULL,
    "bestPractices" REAL NOT NULL,
    "seo" REAL NOT NULL,
    "fcp" REAL NOT NULL,
    "lcp" REAL NOT NULL,
    "cls" REAL NOT NULL,
    "fid" REAL NOT NULL,
    "ttfb" REAL NOT NULL,
    "rawData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "OPRSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalClicks" INTEGER NOT NULL,
    "totalImpressions" INTEGER NOT NULL,
    "averageCTR" REAL NOT NULL,
    "averagePosition" REAL NOT NULL,
    "topQueries" TEXT NOT NULL,
    "rawData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SchemaSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schemasFound" INTEGER NOT NULL,
    "validSchemas" INTEGER NOT NULL,
    "invalidSchemas" INTEGER NOT NULL,
    "schemas" TEXT NOT NULL,
    "rawData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AlertThreshold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "thresholdId" TEXT,
    "configId" TEXT,
    "url" TEXT,
    "metricType" TEXT,
    "type" TEXT,
    "currentValue" REAL,
    "thresholdValue" REAL,
    "data" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertEvent_thresholdId_fkey" FOREIGN KEY ("thresholdId") REFERENCES "AlertThreshold" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AlertEvent_configId_fkey" FOREIGN KEY ("configId") REFERENCES "AlertConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Brand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    CONSTRAINT "BrandAlias_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandNegativeTerm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    CONSTRAINT "BrandNegativeTerm_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "topic" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "volatility" TEXT NOT NULL DEFAULT 'stable',
    "brandId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastCollected" DATETIME,
    CONSTRAINT "Prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptKeyword_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "score" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" DATETIME,
    CONSTRAINT "PromptCandidate_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromptCandidate_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engine" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "answerText" TEXT,
    "htmlHash" TEXT,
    "responseTimeMs" INTEGER,
    "wordCount" INTEGER,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayloadJson" TEXT,
    "htmlSnapshotPath" TEXT,
    CONSTRAINT "Answer_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnswerMention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answerId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "position" INTEGER,
    "sentiment" REAL,
    "context" TEXT,
    "matchType" TEXT,
    "confidence" REAL,
    CONSTRAINT "AnswerMention_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnswerMention_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnswerCitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT,
    "rank" INTEGER,
    "authorityScore" REAL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AnswerCitation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIVisibilityMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "aiVisibilityIndex" REAL NOT NULL,
    "aiCoverage" REAL NOT NULL,
    "aiSourceShare" REAL NOT NULL,
    "totalPrompts" INTEGER NOT NULL,
    "mentionedPrompts" INTEGER NOT NULL,
    "citedPrompts" INTEGER NOT NULL,
    "averagePosition" REAL,
    "averageSentiment" REAL,
    "competitorShare" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIVisibilityMetric_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsightGap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "InsightGap_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InsightGap_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsightCompetitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insightId" TEXT NOT NULL,
    "competitor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InsightCompetitor_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "InsightGap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsightSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "totalCitations" INTEGER NOT NULL DEFAULT 0,
    "authorityScore" REAL,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactEmail" TEXT,
    "contactName" TEXT
);

-- CreateTable
CREATE TABLE "SourceBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceBrand_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "InsightSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsightRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecommendationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recommendationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecommendationAction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "InsightRecommendation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsightOutreach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "targetDomain" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactRole" TEXT,
    "pitchTemplate" TEXT NOT NULL,
    "pageReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactedAt" DATETIME,
    CONSTRAINT "InsightOutreach_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PageAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "wordCount" INTEGER,
    "lastModified" DATETIME,
    "outboundLinks" INTEGER,
    "readabilityScore" REAL,
    "authorityScore" REAL,
    "contentFreshness" TEXT,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PageSchema" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "schemaType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageSchema_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "PageAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisibilityDrift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "weekStarting" TEXT NOT NULL,
    "brandVisibility" JSONB NOT NULL,
    "deltaFromPrevious" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisibilityDrift_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DriftChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driftId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriftChange_driftId_fkey" FOREIGN KEY ("driftId") REFERENCES "VisibilityDrift" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EngineBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engine" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL,
    "monthlyLimit" INTEGER NOT NULL,
    "currentDaily" INTEGER NOT NULL DEFAULT 0,
    "currentMonthly" INTEGER NOT NULL DEFAULT 0,
    "costPerRequest" REAL,
    "resetDaily" DATETIME NOT NULL,
    "resetMonthly" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnswerCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptHash" TEXT NOT NULL,
    "responseHash" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "citations" JSONB NOT NULL,
    "mentions" JSONB NOT NULL,
    "engine" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "hitCount" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brandId" TEXT,
    "threshold" REAL,
    "webhookUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertChannel_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "AlertConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KeyPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KeyPermission_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER,
    "statusCode" INTEGER NOT NULL,
    CONSTRAINT "ApiUsage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuthoritySnapshot_domain_fetchedAt_idx" ON "AuthoritySnapshot"("domain", "fetchedAt");

-- CreateIndex
CREATE INDEX "PSISnapshot_url_timestamp_idx" ON "PSISnapshot"("url", "timestamp");

-- CreateIndex
CREATE INDEX "OPRSnapshot_url_timestamp_idx" ON "OPRSnapshot"("url", "timestamp");

-- CreateIndex
CREATE INDEX "SchemaSnapshot_url_timestamp_idx" ON "SchemaSnapshot"("url", "timestamp");

-- CreateIndex
CREATE INDEX "AlertThreshold_url_metricType_idx" ON "AlertThreshold"("url", "metricType");

-- CreateIndex
CREATE INDEX "AlertEvent_url_createdAt_idx" ON "AlertEvent"("url", "createdAt");

-- CreateIndex
CREATE INDEX "AlertEvent_sent_createdAt_idx" ON "AlertEvent"("sent", "createdAt");

-- CreateIndex
CREATE INDEX "AlertEvent_configId_sent_idx" ON "AlertEvent"("configId", "sent");

-- CreateIndex
CREATE INDEX "AlertEvent_type_createdAt_idx" ON "AlertEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Brand_userId_idx" ON "Brand"("userId");

-- CreateIndex
CREATE INDEX "BrandAlias_brandId_idx" ON "BrandAlias"("brandId");

-- CreateIndex
CREATE INDEX "BrandAlias_locale_idx" ON "BrandAlias"("locale");

-- CreateIndex
CREATE INDEX "BrandNegativeTerm_brandId_idx" ON "BrandNegativeTerm"("brandId");

-- CreateIndex
CREATE INDEX "BrandNegativeTerm_locale_idx" ON "BrandNegativeTerm"("locale");

-- CreateIndex
CREATE INDEX "Prompt_active_locale_idx" ON "Prompt"("active", "locale");

-- CreateIndex
CREATE INDEX "Prompt_priority_volatility_idx" ON "Prompt"("priority", "volatility");

-- CreateIndex
CREATE INDEX "Prompt_userId_idx" ON "Prompt"("userId");

-- CreateIndex
CREATE INDEX "Prompt_brandId_idx" ON "Prompt"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptKeyword_promptId_keyword_key" ON "PromptKeyword"("promptId", "keyword");

-- CreateIndex
CREATE INDEX "PromptCandidate_parentId_score_idx" ON "PromptCandidate"("parentId", "score");

-- CreateIndex
CREATE INDEX "PromptCandidate_status_locale_idx" ON "PromptCandidate"("status", "locale");

-- CreateIndex
CREATE INDEX "Run_engine_startedAt_idx" ON "Run"("engine", "startedAt");

-- CreateIndex
CREATE INDEX "Answer_runId_idx" ON "Answer"("runId");

-- CreateIndex
CREATE INDEX "Answer_promptId_engine_idx" ON "Answer"("promptId", "engine");

-- CreateIndex
CREATE INDEX "Answer_collectedAt_idx" ON "Answer"("collectedAt");

-- CreateIndex
CREATE INDEX "Answer_htmlHash_idx" ON "Answer"("htmlHash");

-- CreateIndex
CREATE INDEX "Answer_locale_idx" ON "Answer"("locale");

-- CreateIndex
CREATE INDEX "AnswerMention_answerId_idx" ON "AnswerMention"("answerId");

-- CreateIndex
CREATE INDEX "AnswerMention_brandId_idx" ON "AnswerMention"("brandId");

-- CreateIndex
CREATE INDEX "AnswerMention_sentiment_idx" ON "AnswerMention"("sentiment");

-- CreateIndex
CREATE INDEX "AnswerCitation_answerId_idx" ON "AnswerCitation"("answerId");

-- CreateIndex
CREATE INDEX "AnswerCitation_domain_idx" ON "AnswerCitation"("domain");

-- CreateIndex
CREATE INDEX "AnswerCitation_isPrimary_idx" ON "AnswerCitation"("isPrimary");

-- CreateIndex
CREATE INDEX "AnswerCitation_authorityScore_idx" ON "AnswerCitation"("authorityScore");

-- CreateIndex
CREATE INDEX "AIVisibilityMetric_brandId_date_idx" ON "AIVisibilityMetric"("brandId", "date");

-- CreateIndex
CREATE INDEX "AIVisibilityMetric_date_locale_idx" ON "AIVisibilityMetric"("date", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "AIVisibilityMetric_brandId_date_locale_key" ON "AIVisibilityMetric"("brandId", "date", "locale");

-- CreateIndex
CREATE INDEX "InsightGap_brandId_status_idx" ON "InsightGap"("brandId", "status");

-- CreateIndex
CREATE INDEX "InsightGap_severity_createdAt_idx" ON "InsightGap"("severity", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InsightCompetitor_insightId_competitor_key" ON "InsightCompetitor"("insightId", "competitor");

-- CreateIndex
CREATE UNIQUE INDEX "InsightSource_domain_key" ON "InsightSource"("domain");

-- CreateIndex
CREATE INDEX "InsightSource_totalCitations_idx" ON "InsightSource"("totalCitations");

-- CreateIndex
CREATE INDEX "InsightSource_authorityScore_idx" ON "InsightSource"("authorityScore");

-- CreateIndex
CREATE UNIQUE INDEX "SourceBrand_sourceId_brandId_key" ON "SourceBrand"("sourceId", "brandId");

-- CreateIndex
CREATE INDEX "InsightRecommendation_brandId_status_idx" ON "InsightRecommendation"("brandId", "status");

-- CreateIndex
CREATE INDEX "InsightRecommendation_priority_createdAt_idx" ON "InsightRecommendation"("priority", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationAction_recommendationId_action_key" ON "RecommendationAction"("recommendationId", "action");

-- CreateIndex
CREATE INDEX "InsightOutreach_brandId_status_idx" ON "InsightOutreach"("brandId", "status");

-- CreateIndex
CREATE INDEX "InsightOutreach_targetDomain_idx" ON "InsightOutreach"("targetDomain");

-- CreateIndex
CREATE UNIQUE INDEX "PageAnalysis_url_key" ON "PageAnalysis"("url");

-- CreateIndex
CREATE INDEX "PageAnalysis_authorityScore_idx" ON "PageAnalysis"("authorityScore");

-- CreateIndex
CREATE INDEX "PageAnalysis_contentFreshness_idx" ON "PageAnalysis"("contentFreshness");

-- CreateIndex
CREATE UNIQUE INDEX "PageSchema_pageId_schemaType_key" ON "PageSchema"("pageId", "schemaType");

-- CreateIndex
CREATE INDEX "VisibilityDrift_weekStarting_idx" ON "VisibilityDrift"("weekStarting");

-- CreateIndex
CREATE UNIQUE INDEX "VisibilityDrift_promptId_engine_weekStarting_key" ON "VisibilityDrift"("promptId", "engine", "weekStarting");

-- CreateIndex
CREATE UNIQUE INDEX "DriftChange_driftId_brandId_key" ON "DriftChange"("driftId", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "EngineBudget_engine_key" ON "EngineBudget"("engine");

-- CreateIndex
CREATE INDEX "EngineBudget_engine_idx" ON "EngineBudget"("engine");

-- CreateIndex
CREATE INDEX "AnswerCache_expiresAt_idx" ON "AnswerCache"("expiresAt");

-- CreateIndex
CREATE INDEX "AnswerCache_lastUsed_idx" ON "AnswerCache"("lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerCache_promptHash_engine_key" ON "AnswerCache"("promptHash", "engine");

-- CreateIndex
CREATE INDEX "AlertConfig_userId_enabled_idx" ON "AlertConfig"("userId", "enabled");

-- CreateIndex
CREATE INDEX "AlertConfig_type_enabled_idx" ON "AlertConfig"("type", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "AlertChannel_alertId_channel_key" ON "AlertChannel"("alertId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "KeyPermission_apiKeyId_permission_key" ON "KeyPermission"("apiKeyId", "permission");

-- CreateIndex
CREATE INDEX "ApiUsage_apiKeyId_timestamp_idx" ON "ApiUsage"("apiKeyId", "timestamp");

-- CreateIndex
CREATE INDEX "ApiUsage_timestamp_idx" ON "ApiUsage"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
