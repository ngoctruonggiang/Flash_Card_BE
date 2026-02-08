import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { RouteConfig } from 'src/utils/route.decorator';
import express from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
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
