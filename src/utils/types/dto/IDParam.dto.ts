import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class IdParamDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id: number;
}
