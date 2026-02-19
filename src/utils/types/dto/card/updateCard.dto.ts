import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCardDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  front?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  back?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  tags?: string;
}
