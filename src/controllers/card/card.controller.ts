import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CardService } from '../../services/card/card.service';
import { CreateCardDto } from 'src/utils/types/dto/card/createCard.dto';
import { IdParamDto } from 'src/utils/types/IDParam.dto';

@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  create(
    @Body()
    createCardDto: CreateCardDto,
  ) {
    return this.cardService.create({
      deckId: createCardDto.deckId.id,
      front: createCardDto.front,
      back: createCardDto.back,
      tags: createCardDto.tags,
    });
  }

  @Get()
  findAll(@Query('deckId', ParseIntPipe) deckId?: number) {
    if (deckId) {
      return this.cardService.findByDeck(deckId);
    }
    return this.cardService.findAll();
  }

  @Get(':id')
  findOne(@Param() params: IdParamDto) {
    return this.cardService.findOne(params.id);
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body()
    updateCardDto: {
      front?: string;
      back?: string;
      tags?: string;
    },
  ) {
    return this.cardService.update(params.id, updateCardDto);
  }

  @Delete(':id')
  remove(@Param() params: IdParamDto) {
    return this.cardService.remove(params.id);
  }
}
