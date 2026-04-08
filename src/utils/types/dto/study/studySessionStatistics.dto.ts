import { ApiProperty } from '@nestjs/swagger';

export class StudySessionStatisticsDto {
  @ApiProperty({
    description: 'Total cards reviewed in this session',
    example: 25,
  })
  totalCardsReviewed: number;

  @ApiProperty({
    description: 'Number of new cards introduced',
    example: 5,
  })
  newCardsIntroduced: number;

  @ApiProperty({
    description: 'Number of learning cards reviewed',
    example: 8,
  })
  learningCardsReviewed: number;

  @ApiProperty({
    description: 'Number of review cards reviewed',
    example: 12,
  })
  reviewCardsReviewed: number;

  @ApiProperty({
    description: 'Number of cards answered correctly (Good/Easy)',
    example: 20,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Number of cards answered incorrectly (Again)',
    example: 5,
  })
  incorrectAnswers: number;

  @ApiProperty({
    description: 'Accuracy percentage for the session',
    example: 80.0,
  })
  accuracyPercentage: number;

  @ApiProperty({
    description: 'Total time spent studying (in seconds)',
    example: 450,
  })
  totalStudyTime: number;

  @ApiProperty({
    description: 'Average time per card (in seconds)',
    example: 18.0,
  })
  averageTimePerCard: number;

  @ApiProperty({
    description: 'Number of Again responses',
    example: 5,
  })
  againCount: number;

  @ApiProperty({
    description: 'Number of Hard responses',
    example: 3,
  })
  hardCount: number;

  @ApiProperty({
    description: 'Number of Good responses',
    example: 15,
  })
  goodCount: number;

  @ApiProperty({
    description: 'Number of Easy responses',
    example: 2,
  })
  easyCount: number;

  @ApiProperty({
    description: 'Session start time',
    example: '2024-12-03T10:00:00.000Z',
  })
  sessionStartTime: Date;

  @ApiProperty({
    description: 'Session end time',
    example: '2024-12-03T10:15:00.000Z',
  })
  sessionEndTime: Date;

  @ApiProperty({
    description: 'Deck ID for this session',
    example: 'deck-123',
  })
  deckId: string;

  @ApiProperty({
    description: 'Deck name',
    example: 'Spanish Vocabulary',
  })
  deckName: string;
}
