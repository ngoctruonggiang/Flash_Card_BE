import { ApiProperty } from '@nestjs/swagger';

export class CreateDeckDto {
  @ApiProperty()
  userId: number;
  @ApiProperty()
  title: string;
  @ApiProperty({ required: false })
  description?: string;
}
