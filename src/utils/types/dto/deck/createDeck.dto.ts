import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IdParamDto } from '../../IDParam.dto';

export class CreateDeckDto {
  @ApiProperty()
  @ValidateNested()
  userId: IdParamDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
