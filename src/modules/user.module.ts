import { Module } from '@nestjs/common';
import { UserController } from 'src/controllers/user/user.controller';
import { UserService } from 'src/services/user/user.service';

import { PrismaModule } from './prisma.module';
// import { EmailVerificationService } from 'src/services/email-verification/email-verification.service';
// import { EmailService } from 'src/services/email/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
