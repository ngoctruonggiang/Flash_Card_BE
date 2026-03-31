import { ApiProperty } from '@nestjs/swagger';

export class ConsecutiveDaysDto {
  @ApiProperty({
    description: 'Number of consecutive days the deck has been studied',
    example: 7,
    type: Number,
  })
  consecutiveDays: number;

  @ApiProperty({
    description: 'Date of the current streak start',
    example: '2025-11-17T00:00:00.000Z',
    type: String,
    nullable: true,
  })
  streakStartDate: Date | null;

  @ApiProperty({
    description: 'Date of the most recent study session',
    example: '2025-11-24T00:00:00.000Z',
    type: String,
    nullable: true,
  })
  lastStudyDate: Date | null;
}
