/**
 * Jest setup file for enhanced brand mention detection tests
 */

import { jest } from '@jest/globals';

// Test setup file for Premium AEO Dashboard
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Node.js environment
Object.assign(global, { TextDecoder, TextEncoder });

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/dashboard/premium-aeo',
    query: {},
    asPath: '/dashboard/premium-aeo',
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard/premium-aeo',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-1',
        email: 'test@example.com',
        subscription: { plan: 'premium', active: true },
      },
    },
    status: 'authenticated',
  }),
  getSession: vi.fn(),
}));

// Mock next-auth server functions
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: 'test-user-1',
      email: 'test@example.com',
      subscription: { plan: 'premium', active: true },
    },
  }),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    company: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    queryResult: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    companyCitation: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    companyCompetitor: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    companyScore: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    companyRecommendation: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mock Redis/BullMQ
vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      ping: vi.fn().mockResolvedValue('PONG'),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      disconnect: vi.fn(),
    })),
  };
});

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job-1' }),
    getJob: vi.fn(),
    clean: vi.fn(),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock environment variables
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.OPR_API_KEY = 'test-opr-key';
process.env.DATABASE_URL = 'file:./test.db';

// Setup and teardown
beforeAll(() => {
  // Global setup
});

afterAll(() => {
  // Global teardown
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
});

// Mock window objects for browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Set test timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';

export {};
