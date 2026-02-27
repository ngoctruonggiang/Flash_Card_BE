// import { Body, Controller, Get, Query } from '@nestjs/common';
// import { EmailVerificationService } from 'src/services/email-verification/email-verification.service';

// @Controller('auth')
// export class AuthController {
//   constructor(
//     private readonly emailVerificationService: EmailVerificationService,
//   ) {}

//   @Get('/confirm-email')
//   async confirm(@Query('token') token: string) {
//     await this.emailVerificationService.confirmEmail(token);
//   }
// }
