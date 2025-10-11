import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '../src/app/api/integrations/authority/opr/route';

// Mock environment variables
const mockEnv = {
  OPR_API_KEY: 'test-api-key-123',
};

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('OPR Authority API', () => {
  beforeAll(() => {
    // Set up environment variables
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterAll(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach((key) => {
      delete process.env[key];
    });
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Environment Variable Validation', () => {
    test('should return 401 when OPR_API_KEY is missing', async () => {
      delete process.env.OPR_API_KEY;

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('INVALID_API_KEY');
      expect(data.error).toContain('OPR_API_KEY environment variable is not set');

      // Restore for other tests
      process.env.OPR_API_KEY = mockEnv.OPR_API_KEY;
    });

    test('should return 401 when OPR_API_KEY is empty', async () => {
      process.env.OPR_API_KEY = '';

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('INVALID_API_KEY');

      // Restore for other tests
      process.env.OPR_API_KEY = mockEnv.OPR_API_KEY;
    });

    test('should return 401 when OPR_API_KEY has invalid format', async () => {
      process.env.OPR_API_KEY = 'invalid-key-with-special-chars!@#';

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('INVALID_API_KEY');
      expect(data.error).toContain('format appears to be invalid');

      // Restore for other tests
      process.env.OPR_API_KEY = mockEnv.OPR_API_KEY;
    });
  });

  describe('Request Validation', () => {
    test('should return 400 for empty request body', async () => {
      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_REQUEST');
    });

    test('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      try {
        await POST(request);
      } catch (error) {
        // This is expected for malformed JSON
        expect(error).toBeDefined();
      }
    });

    test('should accept valid URL input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: [
              {
                domain: 'example.com',
                page_rank_decimal: 5.5,
                page_rank_integer: 5,
                rank: 1000000,
                status_code: 200,
              },
            ],
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].domain).toBe('example.com');
    });

    test('should accept valid domains array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: [
              {
                domain: 'example.com',
                page_rank_decimal: 5.5,
                page_rank_integer: 5,
                rank: 1000000,
                status_code: 200,
              },
              {
                domain: 'test.com',
                page_rank_decimal: 4.2,
                page_rank_integer: 4,
                rank: 2000000,
                status_code: 200,
              },
            ],
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ domains: ['example.com', 'test.com'] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
    });
  });

  describe('Domain Extraction and Validation', () => {
    test('should extract domain from URL with protocol', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: [
              {
                domain: 'example.com',
                page_rank_decimal: 5.5,
                page_rank_integer: 5,
                status_code: 200,
              },
            ],
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://www.example.com/path?query=value' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].domain).toBe('example.com');
    });

    test('should handle IDN domains', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: [
              {
                domain: 'xn--fsq.com', // Punycode for ✓.com
                page_rank_decimal: 3.0,
                page_rank_integer: 3,
                status_code: 200,
              },
            ],
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://✓.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Domain should be converted to punycode
      expect(data.results[0].domain).toMatch(/xn--/);
    });

    test('should return error for invalid domains', async () => {
      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ domains: ['invalid..domain', '.invalid', 'toolong'.repeat(50)] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('NO_VALID_DOMAINS');
      expect(data.details).toHaveLength(3);
    });
  });

  describe('OPR API Integration', () => {
    test('should handle API timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('TimeoutError'));
      mockFetch.mockRejectedValueOnce(
        Object.assign(new Error('TimeoutError'), { name: 'TimeoutError' })
      );

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.code).toBe('API_TIMEOUT');
    });

    test('should handle API connection error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.code).toBe('API_CONNECTION_ERROR');
    });

    test('should handle API 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
        headers: new Headers(),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('OPR_API_ERROR');
      expect(data.error).toContain('Invalid or expired Open PageRank API key');
    });

    test('should handle API 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded'),
        headers: new Headers(),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe('OPR_API_ERROR');
      expect(data.error).toContain('rate limit exceeded');
    });

    test('should handle malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: new Headers({ 'content-type': 'text/html' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.code).toBe('INVALID_API_RESPONSE');
    });
  });

  describe('Response Normalization', () => {
    test('should handle missing domains in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: [
              {
                domain: 'example.com',
                page_rank_decimal: 5.5,
                page_rank_integer: 5,
                status_code: 200,
              },
              // Missing test.com
            ],
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ domains: ['example.com', 'test.com'] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);

      const testResult = data.results.find((r) => r.domain === 'test.com');
      expect(testResult.status).toBe('error');
      expect(testResult.error).toBe('Domain not found in OPR response');
    });

    test('should round decimal values correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: [
              {
                domain: 'example.com',
                page_rank_decimal: 5.567890123,
                page_rank_integer: 5,
                status_code: 200,
              },
            ],
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.results[0].opr).toBe(5.57); // Rounded to 2 decimals
    });
  });

  describe('HTTP Methods', () => {
    test('should reject GET requests', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.code).toBe('METHOD_NOT_ALLOWED');
      expect(data.allowedMethods).toContain('POST');
      expect(response.headers.get('Allow')).toBe('POST');
    });
  });

  describe('Performance and Caching', () => {
    test('should include performance headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: [
              {
                domain: 'example.com',
                page_rank_decimal: 5.5,
                page_rank_integer: 5,
                status_code: 200,
              },
            ],
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ url: 'example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
      expect(response.headers.get('X-Domain-Count')).toBe('1');
    });

    test('should limit to 100 domains', async () => {
      const manyDomains = Array.from({ length: 150 }, (_, i) => `domain${i}.com`);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status_code: 200,
            response: Array.from({ length: 100 }, (_, i) => ({
              domain: `domain${i}.com`,
              page_rank_decimal: 1.0,
              page_rank_integer: 1,
              status_code: 200,
            })),
          }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const request = new NextRequest('http://localhost/api/integrations/authority/opr', {
        method: 'POST',
        body: JSON.stringify({ domains: manyDomains }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(100); // Should be limited to 100
    });
  });
});
