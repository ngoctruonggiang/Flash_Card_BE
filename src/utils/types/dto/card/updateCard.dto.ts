import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCardDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  front?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  back?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tags?: string;
}
