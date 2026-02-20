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
import { GetUser } from 'src/utils/decorators/user.decorator';
import * as client from '@prisma/client';
import { RouteConfig } from 'src/utils/decorators/route.decorator';

@Controller('deck')
export class DeckController {
  constructor(private readonly deckService: DeckService) {}

  @Post()
  @RouteConfig({
    message: 'Create Deck',
    requiresAuth: true,
  })
  create(
    @GetUser() user: client.User,
    @Body()
    createDeckDto: CreateDeckDto,
  ) {
    return this.deckService.create(user.id, createDeckDto);
  }

  @Get()
  @RouteConfig({
    message: 'Get All Decks By UserID or All Decks',
    requiresAuth: true,
    roles: ['ADMIN'],
  })
  findAll(@Query('userId', ParseIntPipe) userId?: number) {
    if (userId) {
      return this.deckService.findByUser(userId);
    }
    return this.deckService.findAll();
  }

  @Get(':id')
  @RouteConfig({
    message: 'Get Deck By ID',
    requiresAuth: true,
  })
  findOne(@Param() params: IdParamDto) {
    console.log(params.id);
    return this.deckService.findOne(params.id);
  }

  @Patch(':id')
  @RouteConfig({
    message: 'Update Deck By ID',
    requiresAuth: true,
  })
  update(
    @Param() params: IdParamDto,
    @Body()
    updateDeckDto: UpdateDeckDto,
  ) {
    return this.deckService.update(params.id, updateDeckDto);
  }

  @Delete(':id')
  @RouteConfig({
    message: 'Delete Deck By ID',
    requiresAuth: true,
  })
  remove(@Param() params: IdParamDto) {
    return this.deckService.remove(params.id);
  }
}
