import { Body, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { bcryptConstants } from 'src/utils/constants';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

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
  }): Promise<{ accessToken: string }> {
    if (await this.userService.findByEmail(signUpDto.email)) {
      throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
    }

    if (await this.userService.findByUsername(signUpDto.username)) {
      throw new HttpException('Username already taken', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(
      signUpDto.password,
      bcryptConstants.saltOrRounds,
    );
    await this.userService.create({
      email: signUpDto.email,
      username: signUpDto.username,
      passwordHash: hashedPassword,
      lastLoginAt: new Date(),
    });
    const payload = { username: signUpDto.username };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async signIn(signInDto: {
    username: string;
    password: string;
  }): Promise<{ accessToken: string }> {
    const user = await this.userService.findByUsername(signInDto.username);

    if (!user) {
      throw new HttpException(
        'Invalid username or password',
        HttpStatus.BAD_REQUEST,
      );
    }

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

    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
