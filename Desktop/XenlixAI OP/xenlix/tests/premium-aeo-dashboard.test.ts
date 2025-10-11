/**
 * Premium AEO Dashboard API Tests
 *
 * Comprehensive test suite for all API endpoints and functionality
 * Run with: npm test or pnpm test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/companies/route';
import { prisma } from '@/lib/prisma';

// Mock data for testing
const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  subscription: { plan: 'premium', active: true },
};

const mockCompany = {
  name: 'Test Company',
  website: 'https://testcompany.com',
  industry: 'Technology',
  userId: mockUser.id,
};

describe('Premium AEO Dashboard API Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.company.deleteMany({ where: { userId: mockUser.id } });
    await prisma.user.deleteMany({ where: { email: mockUser.email } });

    // Create test user
    await prisma.user.create({
      data: {
        ...mockUser,
        name: 'Test User',
        subscription: {
          create: {
            plan: 'premium',
            active: true,
            stripeCustomerId: 'test-customer',
          },
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.company.deleteMany({ where: { userId: mockUser.id } });
    await prisma.user.deleteMany({ where: { email: mockUser.email } });
  });

  describe('/api/companies', () => {
    it('should create a new company for premium users', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: mockCompany,
        headers: {
          'content-type': 'application/json',
        },
      });

      // Mock session
      jest.spyOn(require('next-auth/next'), 'getServerSession').mockResolvedValue({
        user: mockUser,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.name).toBe(mockCompany.name);
      expect(responseData.website).toBe(mockCompany.website);
    });

    it('should fetch companies for authenticated users', async () => {
      // Create test company
      const company = await prisma.company.create({
        data: mockCompany,
      });

      const { req, res } = createMocks({
        method: 'GET',
      });

      jest.spyOn(require('next-auth/next'), 'getServerSession').mockResolvedValue({
        user: mockUser,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData.length).toBeGreaterThan(0);
    });

    it('should reject non-premium users', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: mockCompany,
      });

      jest.spyOn(require('next-auth/next'), 'getServerSession').mockResolvedValue({
        user: { ...mockUser, subscription: { plan: 'free', active: false } },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Premium subscription required');
    });
  });

  describe('/api/visibility/[companyId]', () => {
    it('should return visibility data for company', async () => {
      const company = await prisma.company.create({
        data: mockCompany,
      });

      // Create mock visibility data
      await prisma.queryResult.create({
        data: {
          companyId: company.id,
          query: 'test query',
          position: 1,
          visibility: true,
          score: 95,
          timestamp: new Date(),
        },
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { companyId: company.id },
      });

      jest.spyOn(require('next-auth/next'), 'getServerSession').mockResolvedValue({
        user: mockUser,
      });

      const visibilityHandler = require('@/app/api/visibility/[companyId]/route').GET;
      await visibilityHandler(req, { params: { companyId: company.id } });

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('/api/citations/[companyId]', () => {
    it('should return citation analysis for company', async () => {
      const company = await prisma.company.create({
        data: mockCompany,
      });

      // Create mock citation data
      await prisma.companyCitation.create({
        data: {
          companyId: company.id,
          source: 'example.com',
          url: 'https://example.com/citation',
          authority: 85,
          relevance: 90,
          context: 'Test citation context',
        },
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { companyId: company.id },
      });

      jest.spyOn(require('next-auth/next'), 'getServerSession').mockResolvedValue({
        user: mockUser,
      });

      const citationHandler = require('@/app/api/citations/[companyId]/route').GET;
      await citationHandler(req, { params: { companyId: company.id } });

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('/api/competitors/[companyId]', () => {
    it('should return competitor analysis', async () => {
      const company = await prisma.company.create({
        data: mockCompany,
      });

      // Create mock competitor data
      await prisma.companyCompetitor.create({
        data: {
          companyId: company.id,
          name: 'Competitor Inc',
          website: 'https://competitor.com',
          visibilityScore: 75,
          marketShare: 15.5,
        },
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { companyId: company.id },
      });

      jest.spyOn(require('next-auth/next'), 'getServerSession').mockResolvedValue({
        user: mockUser,
      });

      const competitorHandler = require('@/app/api/competitors/[companyId]/route').GET;
      await competitorHandler(req, { params: { companyId: company.id } });

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('/api/recommendations/[companyId]', () => {
    it('should return actionable recommendations', async () => {
      const company = await prisma.company.create({
        data: mockCompany,
      });

      // Create mock recommendation data
      await prisma.companyRecommendation.create({
        data: {
          companyId: company.id,
          title: 'Improve Local SEO',
          description: 'Add local business schema markup',
          priority: 'high',
          category: 'technical',
          impact: 85,
          effort: 3,
        },
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { companyId: company.id },
      });

      jest.spyOn(require('next-auth/next'), 'getServerSession').mockResolvedValue({
        user: mockUser,
      });

      const recommendationHandler = require('@/app/api/recommendations/[companyId]/route').GET;
      await recommendationHandler(req, { params: { companyId: company.id } });

      expect(res._getStatusCode()).toBe(200);
    });
  });
});

describe('Company Analysis Plugin Tests', () => {
  let plugin: any;

  beforeEach(() => {
    const { CompanyAnalysisPlugin } = require('@/lib/company-analysis-plugin');
    plugin = new CompanyAnalysisPlugin();
  });

  describe('URL Processing', () => {
    it('should fetch and parse website content', async () => {
      const mockUrl = 'https://example.com';
      const result = await plugin.fetchContent(mockUrl);

      expect(result.success).toBe(true);
      expect(result.data.content).toBeDefined();
      expect(result.data.title).toBeDefined();
    });

    it('should handle invalid URLs gracefully', async () => {
      const invalidUrl = 'invalid-url';
      const result = await plugin.fetchContent(invalidUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Citation Extraction', () => {
    it('should extract citations from content', async () => {
      const mockContent = `
        <div>
          <p>Our company was mentioned in <a href="https://techcrunch.com">TechCrunch</a></p>
          <p>Featured on <a href="https://forbes.com">Forbes</a> as industry leader</p>
        </div>
      `;

      const citations = await plugin.extractCitations(mockContent, 'Test Company');

      expect(Array.isArray(citations)).toBe(true);
      expect(citations.length).toBeGreaterThan(0);
    });
  });

  describe('Authority Scoring', () => {
    it('should calculate OPR metrics', async () => {
      const mockUrl = 'https://example.com';
      const metrics = await plugin.getOPRMetrics(mockUrl);

      expect(metrics).toBeDefined();
      expect(typeof metrics.authority).toBe('number');
    });
  });

  describe('Performance Analysis', () => {
    it('should run Lighthouse audit', async () => {
      const mockUrl = 'https://example.com';
      const audit = await plugin.runLighthouseAudit(mockUrl);

      expect(audit).toBeDefined();
      expect(audit.performance).toBeDefined();
      expect(audit.seo).toBeDefined();
    });
  });
});

describe('Job Queue Tests', () => {
  let queue: any;

  beforeEach(() => {
    const { getQueue } = require('@/lib/job-queue');
    queue = getQueue('company-analysis');
  });

  it('should add company analysis job', async () => {
    const jobData = {
      companyId: 'test-company-1',
      url: 'https://example.com',
      userId: 'test-user-1',
    };

    const job = await queue.add('analyze-company', jobData);

    expect(job.id).toBeDefined();
    expect(job.data).toEqual(jobData);
  });

  it('should process visibility sweep job', async () => {
    const jobData = {
      companyId: 'test-company-1',
      queries: ['test query 1', 'test query 2'],
    };

    const job = await queue.add('visibility-sweep', jobData);

    expect(job.id).toBeDefined();
    expect(job.data.queries).toHaveLength(2);
  });
});

describe('Schema Validation Tests', () => {
  let validator: any;

  beforeEach(() => {
    const { validateCompanyInfo, CompanyInfoSchema } = require('@/lib/company-info-schema');
    validator = validateCompanyInfo;
  });

  it('should validate correct company data', () => {
    const validData = {
      name: 'Test Company',
      website: 'https://testcompany.com',
      industry: 'Technology',
      description: 'A test company',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
      },
      contact: {
        email: 'contact@testcompany.com',
        phone: '+1-555-0123',
      },
    };

    const result = validator(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid company data', () => {
    const invalidData = {
      name: '', // Required field empty
      website: 'invalid-url', // Invalid URL format
      industry: 123, // Should be string
    };

    const result = validator(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
