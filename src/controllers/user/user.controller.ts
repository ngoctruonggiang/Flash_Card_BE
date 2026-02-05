import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('/signup')
  signUp(
    @Body()
    createUserDto: {
      username: string;
      email: string;
      password: string;
    },
  ) {
    return this.authService.signUp(createUserDto);
  }

  @Post('/signin')
  signIn(
    @Body()
    signInDto: {
      username: string;
      password: string;
    },
  ) {
    return this.authService.signIn(signInDto);
  }

  // @Get()
  // findAll() {
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.userService.findOne(+id);
  // }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateUserDto: {
      username?: string;
      email?: string;
      passwordHash?: string;
      lastLoginAt?: string;
    },
  ) {
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.lastLoginAt) {
      updateData.lastLoginAt = new Date(updateUserDto.lastLoginAt);
    }
    return this.userService.update(+id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
