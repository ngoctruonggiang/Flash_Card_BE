import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'username can only contain alphanumeric characters',
  })
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: $Enums.Role, required: false })
  @IsOptional()
  @IsEnum($Enums.Role)
  role?: $Enums.Role;
}
