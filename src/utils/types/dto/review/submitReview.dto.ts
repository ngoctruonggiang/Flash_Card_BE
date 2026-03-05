import { ApiProperty } from '@nestjs/swagger';
import { ReviewQuality } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class SubmitReviewItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty()
  @IsInt()
  cardId: number;

  @ApiProperty({ enum: ReviewQuality })
  @IsEnum(ReviewQuality)
  quality: ReviewQuality;

  @ApiProperty()
  @IsInt()
  repetitions: number;

  @ApiProperty()
  @IsInt()
  interval: number;

  @ApiProperty()
  @IsNumber()
  eFactor: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  nextReviewDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  reviewedAt: Date;
}

export class SubmitReviewDto {
  @ApiProperty({ type: [SubmitReviewItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitReviewItemDto)
  CardReviews: SubmitReviewItemDto[];
}
