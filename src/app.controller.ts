import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { RouteConfig } from 'src/utils/decorators/route.decorator';
import express from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'Root endpoint' })
  @RouteConfig({
    message: 'Root endpoint',
    requiresAuth: false,
  })
  getHello() // @Req() request: express.Request,
  // @Res({ passthrough: true }) response: express.Response,
  : any {
    // console.log(request.cookies);
    // response.cookie('testCookie', 'testValue');
    // throw new HttpException('Not implemented', 501);
    return null;
  }
}
