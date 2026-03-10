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
import { IdParamDto } from 'src/utils/types/dto/IDParam.dto';
import { UpdateDeckDto } from 'src/utils/types/dto/deck/updateDeck.dto';
import { GetUser } from 'src/utils/decorators/user.decorator';
import * as client from '@prisma/client';
import { RouteConfig } from 'src/utils/decorators/route.decorator';
import { CardService } from 'src/services/card/card.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Deck')
@Controller('deck')
export class DeckController {
  constructor(
    private readonly deckService: DeckService,
    private readonly cardService: CardService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deck' })
  @ApiResponse({ status: 201, description: 'Deck created successfully' })
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

  @Get('/by')
  @ApiOperation({ summary: 'Get all decks by user ID (Admin)' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @RouteConfig({
    message: 'Get All Decks By UserID or All Decks',
    requiresAuth: true,
    roles: ['ADMIN'],
  })
  findAllByUser(@Query('userId', ParseIntPipe) userId?: number) {
    if (userId) {
      return this.deckService.findByUser(userId);
    }
    return this.deckService.findAll();
  }

  @Get()
  @ApiOperation({ summary: 'Get all decks for current user' })
  @RouteConfig({
    message: 'Get All Decks By User',
    requiresAuth: true,
  })
  findAllCurrentUser(@GetUser() user: client.User) {
    return this.deckService.findByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deck by id' })
  @RouteConfig({
    message: 'Get Deck By ID',
    requiresAuth: true,
  })
  findOne(@Param() params: IdParamDto) {
    return this.deckService.findOne(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deck' })
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
  @ApiOperation({ summary: 'Delete a deck' })
  @RouteConfig({
    message: 'Delete Deck By ID',
    requiresAuth: true,
  })
  remove(@Param() params: IdParamDto) {
    return this.deckService.remove(params.id);
  }
}
