import { ApiProperty } from '@nestjs/swagger';

export class ReviewPreviewDto {
  @ApiProperty({
    example: '1 day',
    description: 'Interval if reviewed as Again',
  })
  Again: string;

  @ApiProperty({
    example: '6 days',
    description: 'Interval if reviewed as Hard',
  })
  Hard: string;

  @ApiProperty({
    example: '10 days',
    description: 'Interval if reviewed as Good',
  })
  Good: string;

  @ApiProperty({
    example: '14 days',
    description: 'Interval if reviewed as Easy',
  })
  Easy: string;
}
