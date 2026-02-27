// import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { EmailService } from '../email/email.service';
// import { UserService } from '../user/user.service';
// import { JwtPayload } from 'src/utils/types/JWTTypes';
// interface VerificationTokenPayload {
//   email: string;
// }

// @Injectable()
// export class EmailVerificationService {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly configService: ConfigService,
//     private readonly emailService: EmailService,
//     private readonly usersService: UserService,
//   ) {}

//   public sendVerificationLink(email: string) {
//     const payload: VerificationTokenPayload = { email };
//     const token = this.jwtService.sign(payload, {
//       secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
//       expiresIn: `${this.configService.get('JWT_VERIFICATION_TOKEN_EXPIRATION_TIME')}s`,
//     });

//     const url = `${this.configService.get('EMAIL_VERIFICATION_URL')}?token=${token}`;

//     const text = `Welcome to the application. To confirm the email address, click here: ${url}`;

//     return this.emailService.sendMail({
//       to: email,
//       subject: 'Email Verification',
//       text,
//     });
//   }

//   public async confirmEmail(token: string) {
//     const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
//       secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
//     });

//     const user = await this.usersService.findOne(payload.id);
//     if (!user || user.isEmailConfirmed) {
//       throw new HttpException(
//         'Email already confirmed',
//         HttpStatus.BAD_REQUEST,
//       );
//     }
//     await this.usersService.markEmailAsConfirmed(payload.id);
//   }
// }
