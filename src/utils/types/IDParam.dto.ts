import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class IdParamDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id: number;
}
