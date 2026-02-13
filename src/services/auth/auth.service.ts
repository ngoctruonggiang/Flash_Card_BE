import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { bcryptConstants } from 'src/utils/constants';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtTokenReturn } from 'src/utils/types/JWTTypes';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: {
    username: string;
    email: string;
    password: string;
  }): Promise<JwtTokenReturn> {
    // Validate input
    // eslint-disable-next-line no-useless-escape
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    if (signUpDto.email.match(emailRegex) === null)
      throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);

    // Validate input
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/g;
    if (signUpDto.username.match(usernameRegex) === null)
      throw new HttpException(
        'Invalid username format',
        HttpStatus.BAD_REQUEST,
      );

    // Validate input
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/g;
    if (signUpDto.password.match(passwordRegex) === null)
      throw new HttpException(
        'Password must be at least 8 characters long and contain at least one letter and one number',
        HttpStatus.BAD_REQUEST,
      );

    if (await this.userService.findByEmail(signUpDto.email)) {
      throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
    }

    if (await this.userService.findByUsername(signUpDto.username)) {
      throw new HttpException('Username already taken', HttpStatus.BAD_REQUEST);
    }

    // Sign up logic
    const hashedPassword = await bcrypt.hash(
      signUpDto.password,
      bcryptConstants.saltOrRounds,
    );

    const user = await this.userService.create({
      email: signUpDto.email,
      username: signUpDto.username,
      passwordHash: hashedPassword,
      lastLoginAt: new Date(),
    });

    // JWT token generation
    const payload: JwtPayload = { id: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async signIn(signInDto: {
    username: string;
    password: string;
  }): Promise<JwtTokenReturn> {
    const user = await this.userService.findByUsername(signInDto.username);

    if (!user) {
      throw new HttpException(
        'Invalid username or password',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Sign in logic
    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new HttpException(
        'Invalid username or password',
        HttpStatus.BAD_REQUEST,
      );
    }

    // JWT token generation
    const payload: JwtPayload = { id: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
