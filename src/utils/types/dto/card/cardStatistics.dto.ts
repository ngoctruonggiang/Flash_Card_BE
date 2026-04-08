import { ApiProperty } from '@nestjs/swagger';

export class CardStatisticsDto {
  @ApiProperty({
    description: 'Total number of times this card has been reviewed',
    example: 15,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Number of correct reviews (Good/Easy)',
    example: 12,
  })
  correctReviews: number;

  @ApiProperty({
    description: 'Percentage of correct reviews',
    example: 80.0,
  })
  correctPercentage: number;

  @ApiProperty({
    description: 'Number of times Again was selected',
    example: 2,
  })
  againCount: number;

  @ApiProperty({
    description: 'Number of times Hard was selected',
    example: 1,
  })
  hardCount: number;

  @ApiProperty({
    description: 'Number of times Good was selected',
    example: 10,
  })
  goodCount: number;

  @ApiProperty({
    description: 'Number of times Easy was selected',
    example: 2,
  })
  easyCount: number;

  @ApiProperty({
    description: 'Current interval in days until next review',
    example: 7,
  })
  currentInterval: number;

  @ApiProperty({
    description: 'Current ease factor of the card',
    example: 2.5,
  })
  easeFactor: number;

  @ApiProperty({
    description: 'Date of the next scheduled review',
    example: '2024-12-10T00:00:00.000Z',
  })
  nextReviewDate: Date;

  @ApiProperty({
    description: 'Date of the last review',
    example: '2024-12-03T10:30:00.000Z',
    nullable: true,
  })
  lastReviewDate: Date | null;

  @ApiProperty({
    description: 'Current status of the card',
    example: 'review',
    enum: ['new', 'learning', 'review', 'relearning'],
  })
  status: string;

  @ApiProperty({
    description: 'Average time spent on this card per review (in seconds)',
    example: 8.5,
    nullable: true,
  })
  averageTimePerReview: number | null;

  @ApiProperty({
    description: 'Number of days since the card was created',
    example: 45,
  })
  cardAge: number;

  @ApiProperty({
    description: 'Retention rate for this card',
    example: 85.7,
  })
  retentionRate: number;
}
