import { ApiProperty } from '@nestjs/swagger';

export class DeckStatisticsDto {
  @ApiProperty({
    description: 'Total number of reviews for all cards in the deck',
    example: 150,
  })
  totalReviews: number;

  @ApiProperty({
    description:
      'Number of correct reviews (quality >= 3: Hard, Good, or Easy)',
    example: 120,
  })
  correctReviews: number;

  @ApiProperty({
    description: 'Percentage of correct reviews',
    example: 80.0,
    type: Number,
  })
  correctPercentage: number;

  @ApiProperty({
    description: 'Number of reviews by quality - Again (quality = 2)',
    example: 30,
  })
  againCount: number;

  @ApiProperty({
    description: 'Number of reviews by quality - Hard (quality = 3)',
    example: 25,
  })
  hardCount: number;

  @ApiProperty({
    description: 'Number of reviews by quality - Good (quality = 4)',
    example: 70,
  })
  goodCount: number;

  @ApiProperty({
    description: 'Number of reviews by quality - Easy (quality = 5)',
    example: 25,
  })
  easyCount: number;
}
