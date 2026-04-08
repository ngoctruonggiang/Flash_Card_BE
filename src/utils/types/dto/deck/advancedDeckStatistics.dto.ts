import { ApiProperty } from '@nestjs/swagger';

export class AdvancedDeckStatisticsDto {
  @ApiProperty({
    description: 'Total number of cards in the deck',
    example: 150,
  })
  totalCards: number;

  @ApiProperty({
    description: 'Number of new cards (never studied)',
    example: 25,
  })
  newCards: number;

  @ApiProperty({
    description: 'Number of cards in learning state',
    example: 30,
  })
  learningCards: number;

  @ApiProperty({
    description: 'Number of cards in review state',
    example: 85,
  })
  reviewCards: number;

  @ApiProperty({
    description: 'Number of cards in relearning state',
    example: 10,
  })
  relearningCards: number;

  @ApiProperty({
    description: 'Number of mature cards (interval >= 21 days)',
    example: 45,
  })
  matureCards: number;

  @ApiProperty({
    description: 'Number of young cards (interval < 21 days)',
    example: 40,
  })
  youngCards: number;

  @ApiProperty({
    description: 'Cards due today',
    example: 15,
  })
  cardsDueToday: number;

  @ApiProperty({
    description: 'Cards due in next 7 days',
    example: 42,
  })
  cardsDueNextWeek: number;

  @ApiProperty({
    description: 'Overall retention rate for the deck',
    example: 87.5,
  })
  retentionRate: number;

  @ApiProperty({
    description: 'Average ease factor across all cards',
    example: 2.45,
  })
  averageEaseFactor: number;

  @ApiProperty({
    description: 'Average interval across review cards (in days)',
    example: 18.5,
  })
  averageInterval: number;

  @ApiProperty({
    description: 'Total reviews performed on this deck',
    example: 2450,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Correct review percentage',
    example: 85.2,
  })
  correctPercentage: number;

  @ApiProperty({
    description: 'Date of the last study session',
    example: '2024-12-03T10:30:00.000Z',
    nullable: true,
  })
  lastStudiedDate: Date | null;

  @ApiProperty({
    description: 'Consecutive days studied',
    example: 12,
  })
  consecutiveDaysStudied: number;

  @ApiProperty({
    description: 'Card distribution by status',
    example: {
      new: 25,
      learning: 30,
      review: 85,
      relearning: 10,
    },
  })
  cardDistribution: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };

  @ApiProperty({
    description: 'Quality distribution across all reviews',
    example: {
      Again: 245,
      Hard: 490,
      Good: 1470,
      Easy: 245,
    },
  })
  qualityDistribution: {
    Again: number;
    Hard: number;
    Good: number;
    Easy: number;
  };

  @ApiProperty({
    description: 'Average cards reviewed per day (last 30 days)',
    example: 15.5,
  })
  averageReviewsPerDay: number;

  @ApiProperty({
    description: 'Estimated time to complete all due reviews (in minutes)',
    example: 25,
  })
  estimatedReviewTime: number;

  @ApiProperty({
    description: 'Deck completion percentage',
    example: 83.3,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Maturity percentage (mature cards / total cards)',
    example: 30.0,
  })
  maturityPercentage: number;
}
