import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RouteConfig } from 'src/utils/route.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @RouteConfig({
    message: 'Root endpoint',
  })
  getHello(): any {
    // throw new HttpException('Not implemented', 501);
    return {
      statusCode: 200,
      message: 'Welcome to FlashLearn API',
      data: null,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}
