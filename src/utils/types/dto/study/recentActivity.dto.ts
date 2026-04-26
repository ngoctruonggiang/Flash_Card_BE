import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecentActivityQueryDto {
  @ApiProperty({
    description: 'Number of activities to return',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;
}

export type ActivityType = 'study' | 'deck_created' | 'cards_added';

export class RecentActivityItemDto {
  @ApiProperty({
    description: 'Unique activity identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Activity type: study, deck_created, or cards_added',
    example: 'study',
    enum: ['study', 'deck_created', 'cards_added'],
  })
  type: ActivityType;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the activity',
    example: '2025-12-23T09:30:00.000Z',
  })
  date: string;

  @ApiProperty({
    description: 'ID of the related deck',
    example: 5,
  })
  deckId: number;

  @ApiProperty({
    description: 'Name of the related deck',
    example: 'Từ vựng IELTS',
  })
  deckName: string;

  @ApiProperty({
    description: 'Cards reviewed (for study sessions)',
    example: 23,
  })
  cardsReviewed: number;

  @ApiProperty({
    description: 'Accuracy percentage (for study sessions)',
    example: 89.0,
  })
  accuracy: number;

  @ApiProperty({
    description: 'Time spent in seconds (for study sessions)',
    example: 900,
  })
  studyTime: number;

  @ApiProperty({
    description: 'New cards introduced (for study sessions)',
    example: 5,
  })
  newCards: number;

  @ApiProperty({
    description: 'Review cards studied (for study sessions)',
    example: 18,
  })
  reviewCards: number;
}
