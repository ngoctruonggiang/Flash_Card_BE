import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExampleSentenceDto {
  @ApiProperty({ description: 'Example sentence' })
  @IsString()
  sentence: string;

  @ApiProperty({ description: 'Translation of the example sentence' })
  @IsString()
  translation: string;
}

export class UpdateCardDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'front cannot be empty or whitespace only' })
  front?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'back cannot be empty or whitespace only' })
  back?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiProperty({
    required: false,
    description: 'Word type (e.g., noun, verb, adjective)',
  })
  @IsString()
  @IsOptional()
  wordType?: string;

  @ApiProperty({ required: false, description: 'Pronunciation guide' })
  @IsString()
  @IsOptional()
  pronunciation?: string;

  @ApiProperty({
    required: false,
    type: [ExampleSentenceDto],
    description: 'Array of example sentences with translations',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExampleSentenceDto)
  examples?: ExampleSentenceDto[];
}
