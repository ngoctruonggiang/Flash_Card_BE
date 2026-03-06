import { ApiProperty } from '@nestjs/swagger';
import { ReviewQuality } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  ValidateNested,
} from 'class-validator';

export class SubmitReviewItemDto {
  @ApiProperty()
  @IsInt()
  cardId: number;

  @ApiProperty({ enum: ReviewQuality })
  @IsEnum(ReviewQuality)
  quality: ReviewQuality;
}

export class SubmitReviewDto {
  @ApiProperty({ type: [SubmitReviewItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitReviewItemDto)
  CardReviews: SubmitReviewItemDto[];

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  reviewedAt: Date;
}
