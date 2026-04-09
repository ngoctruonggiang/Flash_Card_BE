import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Matches,
} from 'class-validator';

export enum LanguageMode {
  VN_EN = 'VN_EN',
  EN_VN = 'EN_VN',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

export class CreateDeckDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'title cannot be empty or whitespace only' })
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: 'Icon name for the deck' })
  @IsString()
  @IsOptional()
  iconName?: string;

  @ApiProperty({
    required: false,
    description: 'Color code in hex format (e.g., #FF5733)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'colorCode must be a valid hex color (e.g., #FF5733 or #FFF)',
  })
  colorCode?: string;

  @ApiProperty({
    required: false,
    enum: LanguageMode,
    default: LanguageMode.VN_EN,
    description:
      'Language mode: VN_EN (Vietnamese to English), EN_VN (English to Vietnamese), or BIDIRECTIONAL (both directions with auto-generated reverse cards)',
  })
  @IsEnum(LanguageMode)
  @IsOptional()
  languageMode?: LanguageMode;
}
