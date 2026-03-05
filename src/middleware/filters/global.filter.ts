import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from 'src/utils/types/dto/api-response.dto';

@Catch(Error, HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  // This method handles exceptions thrown in the application

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    console.error('Exception caught by GlobalExceptionFilter:', exception);
    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      response.status(status).json({
        statusCode: status,
        message: exception.message,
        data: null,
        timestamp: new Date().toISOString(),
        path: request.url,
      } as ApiResponseDto<null>);
    } else {
      const status = HttpStatus.INTERNAL_SERVER_ERROR;

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
