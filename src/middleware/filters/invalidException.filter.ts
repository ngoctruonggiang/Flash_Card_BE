import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from 'src/utils/api-response.dto';

@Catch(Error)
export class InvalidExceptionFilter implements ExceptionFilter {
  // This will just warn the dev to fix their code
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;
    // Still need to send a response to the client
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    } as ApiResponseDto<null>);
    console.error(exception);
    if (exception instanceof HttpException) {
      return;
    }

    console.error('Unhandled Exception: ', exception);
    console.error('Please use HTTP exceptions for proper error handling.');
  }
}
