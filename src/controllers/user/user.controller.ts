import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Get,
  Res,
  Req,
} from '@nestjs/common';
import express from 'express';
import { UserService } from '../../services/user/user.service';

import { RouteConfig } from 'src/utils/decorators/route.decorator';
import { GetUser } from 'src/utils/decorators/user.decorator';
import type { User } from '@prisma/client';
import { IdParamDto } from 'src/utils/types/dto/IDParam.dto';
import { UpdateUserDto } from 'src/utils/types/dto/user/updateUser.dto';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // User Update and Delete
  // To update or delete own user account,
  // It must know its own id from the JWT token
  // Is this secure enough?
  // Admins can update/delete any user by id

  //#region User Actions

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @RouteConfig({
    requiresAuth: true,
    message: 'Get Current User',
  })
  async getCurrentUser(@GetUser() user: User) {
    return await this.userService.getUserById(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @RouteConfig({
    requiresAuth: true,
    roles: ['USER', 'ADMIN'],
    message: 'Update User',
  })
  update(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    const updateData: any = { ...updateUserDto };
    return this.userService.update(user.id, updateData);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete current user account' })
  @RouteConfig({
    requiresAuth: true,
    roles: ['USER', 'ADMIN'],
    message: 'Delete User',
  })
  remove(@GetUser() user: User) {
    return this.userService.remove(user.id);
  }

  //#endregion

  //#region Admin Actions
  @Get('/all')
  @ApiOperation({ summary: 'Get all users (Admin)' })
  @RouteConfig({
    requiresAuth: true,
    roles: ['ADMIN'],
    message: 'Get All User',
  })
  getAllUser() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  @RouteConfig({
    requiresAuth: true,
    roles: ['ADMIN'],
    message: 'Get User By Id',
  })
  getUserById(@Param() params: IdParamDto) {
    return this.userService.getUserById(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID (Admin)' })
  @RouteConfig({
    requiresAuth: true,
    roles: ['ADMIN'],
    message: 'Admin Update User',
  })
  updateAdmin(
    @Param() params: IdParamDto,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(params.id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID (Admin)' })
  @RouteConfig({
    requiresAuth: true,
    roles: ['ADMIN'],
    message: 'Admin Delete User',
  })
  removeAdmin(@Param() params: IdParamDto) {
    return this.userService.remove(params.id);
  }

  //#endregion
}
