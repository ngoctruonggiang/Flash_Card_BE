import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCardDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  deckId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  front: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  back: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  tags?: string;
}
