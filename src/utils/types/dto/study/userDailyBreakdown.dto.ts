import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UserDailyBreakdownQueryDto {
  @ApiProperty({
    description: 'Start date in ISO 8601 format (YYYY-MM-DD)',
    example: '2025-12-16',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date in ISO 8601 format (YYYY-MM-DD)',
    example: '2025-12-23',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

export class DailyBreakdownItemDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2025-12-16',
  })
  date: string;

  @ApiProperty({
    description: 'Day of the week',
    example: 'Monday',
  })
  dayOfWeek: string;

  @ApiProperty({
    description: 'Unique cards reviewed on this day',
    example: 35,
  })
  cardsReviewed: number;

  @ApiProperty({
    description: 'Accuracy percentage for that day',
    example: 89.5,
  })
  accuracy: number;

  @ApiProperty({
    description: 'Study time in seconds',
    example: 350,
  })
  studyTime: number;

  @ApiProperty({
    description: 'Number of different decks studied',
    example: 2,
  })
  decksStudied: number;
}

export class DailyBreakdownSummaryDto {
  @ApiProperty({
    description: 'Total cards reviewed in the range',
    example: 156,
  })
  totalCardsReviewed: number;

  @ApiProperty({
    description: 'Average accuracy across the range',
    example: 88.4,
  })
  averageAccuracy: number;

  @ApiProperty({
    description: 'Total study time in seconds',
    example: 1560,
  })
  totalStudyTime: number;

  @ApiProperty({
    description: 'Number of days with at least one review',
    example: 6,
  })
  daysStudied: number;

  @ApiProperty({
    description: 'Total number of days in the range',
    example: 7,
  })
  totalDaysInRange: number;
}

export class UserDailyBreakdownDto {
  @ApiProperty({
    description: 'Start date of the range',
    example: '2025-12-16',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the range',
    example: '2025-12-23',
  })
  endDate: string;

  @ApiProperty({
    description: 'Array of daily statistics objects',
    type: [DailyBreakdownItemDto],
  })
  dailyBreakdown: DailyBreakdownItemDto[];

  @ApiProperty({
    description: 'Aggregated summary for the entire range',
    type: DailyBreakdownSummaryDto,
  })
  summary: DailyBreakdownSummaryDto;
}
