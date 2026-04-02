import { ApiProperty } from '@nestjs/swagger';

export class TimeRangeStatisticsDto {
  @ApiProperty({
    description: 'Start date of the time range',
    example: '2024-11-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the time range',
    example: '2024-11-30T23:59:59.999Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Total cards reviewed in this time range',
    example: 450,
  })
  totalCardsReviewed: number;

  @ApiProperty({
    description: 'Total study sessions in this time range',
    example: 25,
  })
  totalSessions: number;

  @ApiProperty({
    description: 'Total study time in seconds',
    example: 12000,
  })
  totalStudyTime: number;

  @ApiProperty({
    description: 'Average study time per session (in seconds)',
    example: 480,
  })
  averageSessionTime: number;

  @ApiProperty({
    description: 'Number of days studied in this range',
    example: 23,
  })
  daysStudied: number;

  @ApiProperty({
    description: 'Total number of days in the range',
    example: 30,
  })
  totalDaysInRange: number;

  @ApiProperty({
    description: 'Study consistency percentage',
    example: 76.7,
  })
  consistencyPercentage: number;

  @ApiProperty({
    description: 'Total correct reviews',
    example: 380,
  })
  correctReviews: number;

  @ApiProperty({
    description: 'Total incorrect reviews',
    example: 70,
  })
  incorrectReviews: number;

  @ApiProperty({
    description: 'Overall accuracy percentage',
    example: 84.4,
  })
  accuracyPercentage: number;

  @ApiProperty({
    description: 'New cards introduced in this range',
    example: 60,
  })
  newCardsIntroduced: number;

  @ApiProperty({
    description: 'Cards matured (reached review status) in this range',
    example: 45,
  })
  cardsMatured: number;

  @ApiProperty({
    description: 'Average reviews per day',
    example: 15.0,
  })
  averageReviewsPerDay: number;

  @ApiProperty({
    description: 'Quality distribution',
    example: {
      Again: 70,
      Hard: 50,
      Good: 280,
      Easy: 50,
    },
  })
  qualityDistribution: {
    Again: number;
    Hard: number;
    Good: number;
    Easy: number;
  };

  @ApiProperty({
    description: 'Daily breakdown of reviews',
    example: [
      { date: '2024-11-01', reviewCount: 15, studyTime: 400 },
      { date: '2024-11-02', reviewCount: 18, studyTime: 480 },
    ],
  })
  dailyBreakdown: Array<{
    date: string;
    reviewCount: number;
    studyTime: number;
  }>;

  @ApiProperty({
    description: 'Current study streak in days',
    example: 12,
  })
  currentStreak: number;

  @ApiProperty({
    description: 'Longest study streak in this time range',
    example: 15,
  })
  longestStreak: number;
}
