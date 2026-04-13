/**
 * Centralized mock factory functions for unit tests
 * These factories create jest mock objects for all services
 */

import { ExecutionContext, HttpStatus } from '@nestjs/common';

// ============================================
// Auth Service Mock Factory
// ============================================
export const createMockAuthService = () => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
});

// ============================================
// User Service Mock Factory
// ============================================
export const createMockUserService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

// ============================================
// JWT Service Mock Factory
// ============================================
export const createMockJwtService = () => ({
  sign: jest.fn(),
  signAsync: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
});

// ============================================
// Card Service Mock Factory
// ============================================
export const createMockCardService = () => ({
  create: jest.fn(),
  findByDeck: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getReviewStatus: jest.fn(),
});

// ============================================
// Deck Service Mock Factory
// ============================================
export const createMockDeckService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByUser: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getReviewedCardsCountInDay: jest.fn(),
  getCardsDueToday: jest.fn(),
  getDeckStatistics: jest.fn(),
});

// ============================================
// Study Service Mock Factory
// ============================================
export const createMockStudyService = () => ({
  getStudySession: jest.fn(),
  submitReview: jest.fn(),
  getStudyProgress: jest.fn(),
  getCramSession: jest.fn(),
  getPreviewSession: jest.fn(),
});

// ============================================
// Review Service Mock Factory
// ============================================
export const createMockReviewService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByCard: jest.fn(),
  getLatestReview: jest.fn(),
  submitReview: jest.fn(),
});

// ============================================
// Prisma Service Mock Factory
// ============================================
export const createMockPrismaService = () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  deck: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  card: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  cardReview: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
});

// ============================================
// Reflector Mock Factory
// ============================================
export const createMockReflector = () => ({
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndMerge: jest.fn(),
  getAllAndOverride: jest.fn(),
});

// ============================================
// Execution Context Mock Factory
// ============================================
export const createMockExecutionContext = (
  headers: Record<string, string> = {},
  user?: any,
): ExecutionContext => {
  const mockRequest: any = {
    headers,
    user,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }),
      getNext: () => jest.fn(),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}) as any,
    switchToWs: () => ({}) as any,
    getType: () => 'http',
  } as ExecutionContext;
};

// ============================================
// Argument Host Mock Factory (for filters)
// ============================================
export const createMockArgumentsHost = () => {
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockRequest = {
    url: '/test-url',
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
      getNext: () => jest.fn(),
    }),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}) as any,
    switchToWs: () => ({}) as any,
    getType: () => 'http',
  };
};

// ============================================
// Call Handler Mock Factory (for interceptors)
// ============================================
export const createMockCallHandler = (returnValue: any = {}) => ({
  handle: jest.fn().mockReturnValue({
    pipe: jest.fn().mockReturnValue({
      subscribe: jest.fn(),
    }),
  }),
});
