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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(
    @Body()
    createUserDto: {
      username: string;
      email: string;
      passwordHash: string;
      lastLoginAt: string;
    },
  ) {
    return this.userService.create({
      ...createUserDto,
      lastLoginAt: new Date(createUserDto.lastLoginAt),
    });
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

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
