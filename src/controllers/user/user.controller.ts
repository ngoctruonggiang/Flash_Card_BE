import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Request,
  Get,
} from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { SignInDto } from 'src/utils/types/dto/user/signIn.dto';
import { JwtTokenReturn } from 'src/utils/types/JWTTypes';
import { RouteConfig } from 'src/utils/decorators/route.decorator';
import { GetUser } from 'src/utils/decorators/user.decorator';
import type { User } from '@prisma/client';
import { IdParamDto } from 'src/utils/types/IDParam.dto';
import { UpdateUserDto } from 'src/utils/types/dto/user/updateUser.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  // User Login and Registration
  @Post('/signup')
  signUp(
    @Body()
    createUserDto: SignUpDto,
  ): Promise<JwtTokenReturn> {
    return this.authService.signUp(createUserDto);
  }

  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  signIn(
    @Body()
    signInDto: SignInDto,
  ): Promise<JwtTokenReturn> {
    return this.authService.signIn(signInDto);
  }

  // User Update and Delete
  // To update or delete own user account,
  // It must know its own id from the JWT token
  // Is this secure enough?
  // Admins can update/delete any user by id

  //#region User Actions

  @Get()
  @RouteConfig({
    requiresAuth: true,
    message: 'Get Current User',
  })
  getCurrentUser(@GetUser() user: User) {
    return this.userService.getUserById(user.id);
  }

  @Patch()
  @RouteConfig({
    requiresAuth: true,
    roles: ['USER'],
    message: 'Update User',
  })
  update(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    const updateData: any = { ...updateUserDto };
    console.log(updateData);
    return this.userService.update(user.id, updateData);
  }

  @Delete()
  @RouteConfig({
    requiresAuth: true,
    roles: ['USER'],
    message: 'Delete User',
  })
  remove(@GetUser() user: User) {
    return this.userService.remove(user.id);
  }

  //#endregion

  //#region Admin Actions
  @Get(':id')
  @RouteConfig({
    requiresAuth: true,
    roles: ['ADMIN'],
    message: 'Get User By Id',
  })
  getUserById(@Param() params: IdParamDto) {
    return this.userService.getUserById(params.id);
  }

  @Get('/all')
  @RouteConfig({
    requiresAuth: true,
    roles: ['ADMIN'],
    message: 'Get All User',
  })
  getAllUser() {
    return this.userService.getAllUsers();
  }

  @Patch(':id')
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
