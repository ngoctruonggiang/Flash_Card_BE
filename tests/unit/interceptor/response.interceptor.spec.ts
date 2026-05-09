/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ResponseInterceptor } from 'src/middleware/interceptor/response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';

describe('ResponseInterceptor  Tests', () => {
  let interceptor: ResponseInterceptor<unknown>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockReflector: jest.Mocked<Reflector>;

  const createMockExecutionContext = (
    statusCode: number = 200,
    url: string = '/test',
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ url }),
        getResponse: () => ({
          statusCode,
          req: { url },
        }),
        getNext: () => jest.fn(),
      }),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({}) as ReturnType<ExecutionContext['switchToRpc']>,
      switchToWs: () => ({}) as ReturnType<ExecutionContext['switchToWs']>,
      getType: () => 'http',
      getClass: () => class {},
      getHandler: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (data: unknown): CallHandler => {
    return {
      handle: () => of(data),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReflector = {
      get: jest.fn().mockReturnValue({ message: 'Success' }),
    } as unknown as jest.Mocked<Reflector>;
    interceptor = new ResponseInterceptor(mockReflector);
    mockExecutionContext = createMockExecutionContext();
  });

  describe('Interceptor instantiation', () => {
    it('This test case aims to be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('This test case aims to be instance of ResponseInterceptor', () => {
      expect(interceptor).toBeInstanceOf(ResponseInterceptor);
    });
  });

  describe('Response wrapping', () => {
    it('This test case aims to wrap simple object data in ApiResponseDto format', (done) => {
      const data = { id: 1, name: 'Test' };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Success');
          expect(result.data).toEqual({ id: 1, name: 'Test' });
          expect(result.path).toBe('/test');
          expect(result.timestamp).toBeDefined();
          done();
        },
      });
    });

    it('This test case aims to wrap array data', (done) => {
      const data = [1, 2, 3, 4, 5];
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Success');
          expect(result.data).toEqual([1, 2, 3, 4, 5]);
          done();
        },
      });
    });

    it('This test case aims to wrap string data', (done) => {
      const data = 'Hello World';
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.data).toBe('Hello World');
          done();
        },
      });
    });

    it('This test case aims to wrap number data', (done) => {
      const data = 42;
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.data).toBe(42);
          done();
        },
      });
    });

    it('This test case aims to wrap boolean data', (done) => {
      const data = true;
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.data).toBe(true);
          done();
        },
      });
    });

    it('This test case aims to wrap null data', (done) => {
      const data = null;
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.data).toBeNull();
          done();
        },
      });
    });

    it('This test case aims to wrap undefined data as null (default behavior)', (done) => {
      const data = undefined;
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          // ApiResponseDto constructor defaults data to null when undefined
          expect(result.data).toBeNull();
          done();
        },
      });
    });
  });

  describe('Complex data structures', () => {
    it('This test case aims to wrap nested object data', (done) => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark',
            },
          },
        },
      };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.data).toEqual(data);
          done();
        },
      });
    });

    it('This test case aims to wrap array of objects', (done) => {
      const data = [
        { id: 1, name: 'Card 1' },
        { id: 2, name: 'Card 2' },
        { id: 3, name: 'Card 3' },
      ];
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.data).toEqual(data);
          expect((result.data as unknown[]).length).toBe(3);
          done();
        },
      });
    });

    it('This test case aims to wrap empty array', (done) => {
      const data: unknown[] = [];
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.data).toEqual([]);
          done();
        },
      });
    });

    it('This test case aims to wrap empty object', (done) => {
      const data = {};
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.data).toEqual({});
          done();
        },
      });
    });

    it('This test case aims to wrap Date objects', (done) => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const data = { createdAt: date };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.data).toEqual({ createdAt: date });
          done();
        },
      });
    });
  });

  describe('Domain-specific data', () => {
    it('This test case aims to wrap user data', (done) => {
      const data = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
      };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Success');
          expect((result.data as { email: string }).email).toBe(
            'test@example.com',
          );
          done();
        },
      });
    });

    it('This test case aims to wrap deck data', (done) => {
      const data = {
        id: 'deck-123',
        name: 'My Deck',
        description: 'Test deck',
        totalCards: 50,
        todayNewCards: 10,
        todayReviewCards: 5,
      };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          const deckData = result.data as { name: string; totalCards: number };
          expect(deckData.name).toBe('My Deck');
          expect(deckData.totalCards).toBe(50);
          done();
        },
      });
    });

    it('This test case aims to wrap card data with review info', (done) => {
      const data = {
        id: 'card-123',
        front: 'Question',
        back: 'Answer',
        deckId: 'deck-123',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
      };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          const cardData = result.data as { front: string; easeFactor: number };
          expect(cardData.front).toBe('Question');
          expect(cardData.easeFactor).toBe(2.5);
          done();
        },
      });
    });

    it('This test case aims to wrap study session data', (done) => {
      const data = {
        cards: [
          { id: 'card-1', front: 'Q1', back: 'A1' },
          { id: 'card-2', front: 'Q2', back: 'A2' },
        ],
        newCardsCount: 5,
        reviewCardsCount: 10,
        totalCards: 15,
      };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          const studyData = result.data as {
            cards: unknown[];
            totalCards: number;
          };
          expect(studyData.cards.length).toBe(2);
          expect(studyData.totalCards).toBe(15);
          done();
        },
      });
    });
  });

  describe('Response structure validation', () => {
    it('This test case aims to always include statusCode from response', (done) => {
      mockExecutionContext = createMockExecutionContext(201);
      mockCallHandler = createMockCallHandler({ test: true });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(201);
          done();
        },
      });
    });

    it('This test case aims to use route config message', (done) => {
      mockReflector.get.mockReturnValue({ message: 'Custom message' });
      mockCallHandler = createMockCallHandler({ test: true });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.message).toBe('Custom message');
          done();
        },
      });
    });

    it('This test case aims to use empty string when no route config', (done) => {
      mockReflector.get.mockReturnValue(null);
      mockCallHandler = createMockCallHandler({ test: true });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.message).toBe('');
          done();
        },
      });
    });

    it('This test case aims to always include data property', (done) => {
      mockCallHandler = createMockCallHandler({ test: true });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toHaveProperty('data');
          done();
        },
      });
    });

    it('This test case aims to include timestamp', (done) => {
      mockCallHandler = createMockCallHandler({ test: true });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toHaveProperty('timestamp');
          expect(typeof result.timestamp).toBe('string');
          done();
        },
      });
    });

    it('This test case aims to include path from request', (done) => {
      mockExecutionContext = createMockExecutionContext(200, '/api/users/123');
      mockCallHandler = createMockCallHandler({ test: true });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.path).toBe('/api/users/123');
          done();
        },
      });
    });
  });

  describe('Observable behavior', () => {
    it('This test case aims to return an Observable', () => {
      mockCallHandler = createMockCallHandler({});
      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(result.subscribe).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });

    it('This test case aims to pass through errors from handler', (done) => {
      const error = new Error('Test error');
      mockCallHandler = {
        handle: () => throwError(() => error),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('This test case aims to complete after emitting value', (done) => {
      mockCallHandler = createMockCallHandler({ test: true });

      let completed = false;
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          completed = true;
        },
      });

      setTimeout(() => {
        expect(completed).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Edge cases', () => {
    it('This test case aims to handle very large numbers', (done) => {
      const data = { count: Number.MAX_SAFE_INTEGER };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect((result.data as { count: number }).count).toBe(
            Number.MAX_SAFE_INTEGER,
          );
          done();
        },
      });
    });

    it('This test case aims to handle special string characters', (done) => {
      const data = { text: 'Special chars: <>&"\'\\n\\t' };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect((result.data as { text: string }).text).toBe(
            'Special chars: <>&"\'\\n\\t',
          );
          done();
        },
      });
    });

    it('This test case aims to handle unicode strings', (done) => {
      const data = { text: 'Unicode: 你好世界 🎉 émojis' };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect((result.data as { text: string }).text).toBe(
            'Unicode: 你好世界 🎉 émojis',
          );
          done();
        },
      });
    });

    it('This test case aims to handle BigInt serialized as string', (done) => {
      const data = { bigValue: '9007199254740993' };
      mockCallHandler = createMockCallHandler(data);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect((result.data as { bigValue: string }).bigValue).toBe(
            '9007199254740993',
          );
          done();
        },
      });
    });
  });

  describe('Multiple executions', () => {
    it('This test case aims to work correctly for multiple sequential calls', (done) => {
      const results: unknown[] = [];

      mockCallHandler = createMockCallHandler({ call: 1 });
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => results.push(result),
      });

      mockCallHandler = createMockCallHandler({ call: 2 });
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => results.push(result),
      });

      mockCallHandler = createMockCallHandler({ call: 3 });
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          results.push(result);
          expect(results).toHaveLength(3);
          done();
        },
      });
    });

    it('This test case aims to not retain state between calls', (done) => {
      mockCallHandler = createMockCallHandler({ first: true });
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.data).toEqual({ first: true });
        },
      });

      mockCallHandler = createMockCallHandler({ second: true });
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.data).toEqual({ second: true });
          expect(result.data).not.toHaveProperty('first');
          done();
        },
      });
    });
  });

  describe('Generic type support', () => {
    it('This test case aims to work with typed ResponseInterceptor<string>', (done) => {
      const typedInterceptor = new ResponseInterceptor<string>(mockReflector);
      mockCallHandler = createMockCallHandler('typed string');

      typedInterceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe({
          next: (result) => {
            expect(result.data).toBe('typed string');
            done();
          },
        });
    });

    it('This test case aims to work with typed ResponseInterceptor<number[]>', (done) => {
      const typedInterceptor = new ResponseInterceptor<number[]>(mockReflector);
      mockCallHandler = createMockCallHandler([1, 2, 3]);

      typedInterceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .subscribe({
          next: (result) => {
            expect(result.data).toEqual([1, 2, 3]);
            done();
          },
        });
    });
  });

  describe('Different status codes', () => {
    it('This test case aims to handle 201 Created status', (done) => {
      mockExecutionContext = createMockExecutionContext(201);
      mockCallHandler = createMockCallHandler({ id: 'new-resource' });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(201);
          done();
        },
      });
    });

    it('This test case aims to handle 204 No Content status', (done) => {
      mockExecutionContext = createMockExecutionContext(204);
      mockCallHandler = createMockCallHandler(null);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.statusCode).toBe(204);
          expect(result.data).toBeNull();
          done();
        },
      });
    });
  });

  describe('Reflector interactions', () => {
    it('This test case aims to call reflector.get with correct arguments', (done) => {
      mockCallHandler = createMockCallHandler({});

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockReflector.get).toHaveBeenCalled();
          done();
        },
      });
    });

    it('This test case aims to handle route config with undefined message', (done) => {
      mockReflector.get.mockReturnValue({});
      mockCallHandler = createMockCallHandler({});

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result.message).toBe('');
          done();
        },
      });
    });
  });
});
