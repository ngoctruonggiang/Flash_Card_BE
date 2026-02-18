import { $Enums, User } from '@prisma/client';

export class UserDto {
  username: string;
  email: string;
  role: $Enums.Role;
  createdAt: Date;
  lastLoginAt: Date;

  constructor(user: User) {
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.lastLoginAt = user.lastLoginAt;
  }
}
