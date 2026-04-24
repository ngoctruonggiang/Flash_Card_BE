/**
 * Common test utilities and helper functions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Type } from '@nestjs/common';

// ============================================
// Module Creation Helper
// ============================================

interface ProviderOverride {
  provide: any;
  useValue: any;
}

/**
 * Helper to create a testing module with common setup
 */
export const createTestModule = async <T>(
  controller: Type<T>,
  providers: ProviderOverride[],
): Promise<{ module: TestingModule; controller: T }> => {
  const module = await Test.createTestingModule({
    controllers: [controller],
    providers,
  }).compile();

  const controllerInstance = module.get<T>(controller);

  return { module, controller: controllerInstance };
};

/**
 * Helper to create a testing module for services
 */
export const createServiceTestModule = async <T>(
  service: Type<T>,
  providers: ProviderOverride[],
): Promise<{ module: TestingModule; service: T }> => {
  const module = await Test.createTestingModule({
    providers: [service, ...providers],
  }).compile();

  const serviceInstance = module.get<T>(service);

  return { module, service: serviceInstance };
};

// ============================================
// Exception Assertion Helpers
// ============================================

/**
 * Helper to assert HttpException with specific status
 */
export const expectHttpException = async (
  promise: Promise<any>,
  status: HttpStatus,
  message?: string,
): Promise<void> => {
  try {
    await promise;
    fail('Expected HttpException to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(status);
    if (message) {
      expect((error as HttpException).message).toContain(message);
    }
  }
};

/**
 * Helper to assert any exception type
 */
export const expectException = async <T extends Error>(
  promise: Promise<any>,
  exceptionType: Type<T>,
  message?: string,
): Promise<void> => {
  await expect(promise).rejects.toThrow(exceptionType);
  if (message) {
    await expect(promise).rejects.toThrow(message);
  }
};

// ============================================
// Mock Reset Helper
// ============================================

/**
 * Helper to reset all mock functions in an object
 */
export const resetMocks = (...mocks: Record<string, jest.Mock>[]): void => {
  mocks.forEach((mock) => {
    Object.values(mock).forEach((fn) => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        fn.mockClear();
      } else if (typeof fn === 'object' && fn !== null) {
        resetMocks(fn);
      }
    });
  });
};

// ============================================
// Date Helpers
// ============================================

/**
 * Create a date relative to now
 */
export const createRelativeDate = (daysFromNow: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

/**
 * Create a fixed date for deterministic tests
 */
export const createFixedDate = (dateString: string = '2025-01-15'): Date => {
  return new Date(dateString);
};

// ============================================
// Validation Helpers
// ============================================

/**
 * Generate a string of specified length
 */
export const generateString = (length: number, char: string = 'A'): string => {
  return char.repeat(length);
};

/**
 * Generate a valid email
 */
export const generateEmail = (prefix: string = 'test'): string => {
  return `${prefix}@example.com`;
};

/**
 * Generate a valid password
 */
export const generatePassword = (): string => {
  return 'Password123!';
};

// ============================================
// Async Helpers
// ============================================

/**
 * Wait for a specified number of milliseconds
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Run multiple async assertions in parallel
 */
export const runParallelTests = async (
  testFns: (() => Promise<any>)[],
): Promise<any[]> => {
  return Promise.all(testFns.map((fn) => fn()));
};
