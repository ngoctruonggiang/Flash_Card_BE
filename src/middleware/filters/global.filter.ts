import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Request, Response } from 'express';
import { ApiResponseDto } from 'src/utils/types/dto/api-response.dto';

@Catch(Error, HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  // This method handles exceptions thrown in the application

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let message = exception.message;

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const responseMessage = (exceptionResponse as any).message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage.join(', ');
        } else if (typeof responseMessage === 'string') {
          message = responseMessage;
        }
      }

      // Log client errors as warnings, not errors
      if (status >= 500) {
        this.logger.error(
          `${request.method} ${request.url} ${status} - ${message}`,
          exception.stack,
          'ExceptionFilter',
        );
      } else {
        this.logger.warn(
          `${request.method} ${request.url} ${status} - ${message}`,
          'ExceptionFilter',
        );
      }

      response.status(status).json({
        statusCode: status,
        message: message,
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      } as ApiResponseDto<null>);
    } else {
      // Unhandled / non-HTTP errors — always log with full stack trace
      const status = HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.error(
        `${request.method} ${request.url} ${status} - ${exception.message}`,
        exception.stack,
        'ExceptionFilter',
      );

      // Never leak internal error details to the client
      response.status(status).json({
        statusCode: status,
        message: 'Internal server error',
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      } as ApiResponseDto<null>);
    }
  }
}
