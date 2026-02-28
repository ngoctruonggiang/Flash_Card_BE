import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';

export class AuthResponseDto {
  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsEnum($Enums.Role)
  role: $Enums.Role;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  lastLoginAt: Date;
}
