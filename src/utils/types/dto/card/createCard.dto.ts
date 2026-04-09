import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExampleSentenceDto {
  @ApiProperty({ description: 'Example sentence' })
  @IsString()
  @IsNotEmpty()
  sentence: string;

  @ApiProperty({ description: 'Translation of the example sentence' })
  @IsString()
  @IsNotEmpty()
  translation: string;
}

export class CreateCardDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  deckId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'front cannot be empty or whitespace only' })
  front: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'back cannot be empty or whitespace only' })
  back: string;

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
