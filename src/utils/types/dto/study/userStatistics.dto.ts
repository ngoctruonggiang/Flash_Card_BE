import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum TimeRange {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class UserStatisticsQueryDto {
  @ApiProperty({
    description: 'Time range for statistics',
    enum: TimeRange,
    required: false,
    default: TimeRange.WEEK,
  })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange = TimeRange.WEEK;
}

export class UserStatisticsDto {
  @ApiProperty({
    description: 'Total number of cards across all user decks',
    example: 856,
  })
  totalCards: number;

  @ApiProperty({
    description: 'Number of unique cards reviewed today',
    example: 23,
  })
  studiedToday: number;

  @ApiProperty({
    description: 'Number of unique cards reviewed in the last 7 days',
    example: 156,
  })
  studiedThisWeek: number;

  @ApiProperty({
    description: 'Number of unique cards reviewed in the last 30 days',
    example: 623,
  })
  studiedThisMonth: number;

  @ApiProperty({
    description: 'Current consecutive study days across all decks',
    example: 7,
  })
  currentStreak: number;

  @ApiProperty({
    description: 'Longest streak ever achieved',
    example: 15,
  })
  longestStreak: number;

  @ApiProperty({
    description: 'Weighted average accuracy across all reviews (%)',
    example: 87.5,
  })
  averageAccuracy: number;

  @ApiProperty({
    description:
      'Total study time in seconds (estimated: 10 seconds per review)',
    example: 205200,
  })
  totalStudyTime: number;

  @ApiProperty({
    description: 'Average cards studied per day (last 30 days)',
    example: 22.3,
  })
  cardsPerDay: number;

  @ApiProperty({
    description: 'Day of the week with highest average reviews',
    example: 'Monday',
  })
  bestDay: string;

  @ApiProperty({
    description: 'Total number of decks owned by user',
    example: 12,
  })
  totalDecks: number;

  @ApiProperty({
    description: 'Total number of reviews submitted',
    example: 2450,
  })
  totalReviews: number;
}
