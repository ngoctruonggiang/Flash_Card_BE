import { ApiProperty } from '@nestjs/swagger';

export class CreateCardDto {
  @ApiProperty()
  deckId: number;
  @ApiProperty()
  front: string;
  @ApiProperty()
  back: string;
  @ApiProperty()
  tags?: string;
}
