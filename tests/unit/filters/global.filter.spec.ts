/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { GlobalExceptionFilter } from 'src/middleware/filters/global.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('GlobalExceptionFilter Tests', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    url: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();

    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test/path',
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
        getNext: () => jest.fn(),
      }),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({}) as ReturnType<ArgumentsHost['switchToRpc']>,
      switchToWs: () => ({}) as ReturnType<ArgumentsHost['switchToWs']>,
      getType: () => 'http',
    } as ArgumentsHost;

    // Mock console.error to suppress output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('HttpException handling', () => {
    it('This test case aims to handle BadRequest (400) exception', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Bad Request',
          data: null,
          path: '/test/path',
        }),
      );
    });

    it('This test case aims to handle Unauthorized (401) exception', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized',
        }),
      );
    });

    it('This test case aims to handle Forbidden (403) exception', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Forbidden',
        }),
      );
    });

    it('This test case aims to handle NotFound (404) exception', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not Found',
        }),
      );
    });

    it('This test case aims to handle Conflict (409) exception', () => {
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          message: 'Conflict',
        }),
      );
    });

    it('This test case aims to handle InternalServerError (500) HttpException', () => {
      const exception = new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal Server Error',
        }),
      );
    });
  });

  describe('HttpException with object response', () => {
    it('This test case aims to extract message from object response', () => {
      const exception = new HttpException(
        { message: 'Validation failed', statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        }),
      );
    });

    it('This test case aims to join array messages', () => {
      const exception = new HttpException(
        { message: ['Error 1', 'Error 2', 'Error 3'], statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error 1, Error 2, Error 3',
        }),
      );
    });

    it('This test case aims to handle single item array message', () => {
      const exception = new HttpException(
        { message: ['Single error'], statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Single error',
        }),
      );
    });

    it('This test case aims to handle empty array message', () => {
      const exception = new HttpException(
        { message: [], statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '',
        }),
      );
    });

    it('This test case aims to handle object response without message property', () => {
      const exception = new HttpException(
        { error: 'Some error', statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      // Should use the exception's message property
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('Generic Error handling', () => {
    it('This test case aims to handle generic Error with 500 status', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
          data: null,
        }),
      );
    });

    it('This test case aims to handle TypeError', () => {
      const exception = new TypeError('Cannot read property of undefined');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal server error',
        }),
      );
    });

    it('This test case aims to handle ReferenceError', () => {
      const exception = new ReferenceError('x is not defined');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('This test case aims to handle SyntaxError', () => {
      const exception = new SyntaxError('Unexpected token');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('This test case aims to handle RangeError', () => {
      const exception = new RangeError('Maximum call stack exceeded');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Response format', () => {
    it('This test case aims to include timestamp in response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });

    it('This test case aims to include path in response', () => {
      mockRequest.url = '/api/users/123';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users/123',
        }),
      );
    });

    it('This test case aims to include null data in response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: null,
        }),
      );
    });

    it('This test case aims to format timestamp as ISO string', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const callArg = mockResponse.json.mock.calls[0][0];
      expect(callArg.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });
  });

  describe('Logging', () => {
    it('This test case aims to log HttpException to console.error', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Exception caught by GlobalExceptionFilter:',
        exception,
      );
    });

    it('This test case aims to log generic Error to console.error', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const exception = new Error('Generic Error');

      filter.catch(exception, mockArgumentsHost);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Exception caught by GlobalExceptionFilter:',
        exception,
      );
    });
  });

  describe('Different request paths', () => {
    it('This test case aims to handle root path', () => {
      mockRequest.url = '/';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/',
        }),
      );
    });

    it('This test case aims to handle nested paths', () => {
      mockRequest.url = '/api/v1/users/123/cards/456';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/users/123/cards/456',
        }),
      );
    });

    it('This test case aims to handle paths with query parameters', () => {
      mockRequest.url = '/api/cards?deckId=1&limit=10';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/cards?deckId=1&limit=10',
        }),
      );
    });
  });

  describe('Filter instantiation', () => {
    it('This test case aims to be defined', () => {
      expect(filter).toBeDefined();
    });

    it('This test case aims to be instance of GlobalExceptionFilter', () => {
      expect(filter).toBeInstanceOf(GlobalExceptionFilter);
    });
  });
});
