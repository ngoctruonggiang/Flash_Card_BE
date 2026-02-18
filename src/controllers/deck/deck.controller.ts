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
import { DeckService } from '../../services/deck/deck.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/createDeck.dto';
import { IdParamDto } from 'src/utils/types/IDParam.dto';
import { UpdateDeckDto } from 'src/utils/types/dto/deck/updateDeck.dto';

@Controller('deck')
export class DeckController {
  constructor(private readonly deckService: DeckService) {}

  @Post()
  create(
    @Body()
    createDeckDto: CreateDeckDto,
  ) {
    return this.deckService.create(createDeckDto);
  }

  @Get()
  findAll(@Query('userId', ParseIntPipe) userId?: number) {
    if (userId) {
      return this.deckService.findByUser(userId);
    }
    return this.deckService.findAll();
  }

  @Get(':id')
  findOne(@Param() params: IdParamDto) {
    return this.deckService.findOne(params.id);
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body()
    updateDeckDto: UpdateDeckDto,
  ) {
    return this.deckService.update(params.id, updateDeckDto);
  }

  @Delete(':id')
  remove(@Param() params: IdParamDto) {
    return this.deckService.remove(params.id);
  }
}
