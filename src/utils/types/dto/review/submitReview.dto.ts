import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewQuality } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
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
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitReviewItemDto)
  CardReviews: SubmitReviewItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reviewedAt?: Date;
}
