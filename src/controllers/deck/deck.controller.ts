import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DeckService } from '../../services/deck/deck.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/create-deck.dto';

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
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.deckService.findByUser(+userId);
    }
    return this.deckService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deckService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateDeckDto: {
      title?: string;
      description?: string;
    },
  ) {
    return this.deckService.update(+id, updateDeckDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deckService.remove(+id);
  }
}
