import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IdParamDto } from '../../IDParam.dto';

export class CreateCardDto {
  @ApiProperty()
  @ValidateNested()
  deckId: IdParamDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  front: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  back: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  tags?: string;
}
