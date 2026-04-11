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
import { DeckStatisticsDto } from 'src/utils/types/dto/deck/deckStatistics.dto';
import { AdvancedDeckStatisticsDto } from 'src/utils/types/dto/deck/advancedDeckStatistics.dto';
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
  @ApiResponse({
    status: 200,
    description: 'Returns all decks or decks by user ID',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Returns all decks for the current user',
  })
  @RouteConfig({
    message: 'Get All Decks By User',
    requiresAuth: true,
  })
  findAllCurrentUser(@GetUser() user: client.User) {
    return this.deckService.findByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deck by id' })
  @ApiResponse({
    status: 200,
    description: 'Returns the deck with the specified ID',
  })
  @RouteConfig({
    message: 'Get Deck By ID',
    requiresAuth: true,
  })
  findOne(@GetUser() user: client.User, @Param() params: IdParamDto) {
    return this.deckService.findOne(params.id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deck' })
  @ApiResponse({ status: 200, description: 'Deck updated successfully' })
  @RouteConfig({
    message: 'Update Deck By ID',
    requiresAuth: true,
  })
  update(
    @GetUser() user: client.User,
    @Param() params: IdParamDto,
    @Body()
    updateDeckDto: UpdateDeckDto,
  ) {
    return this.deckService.update(params.id, updateDeckDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deck' })
  @ApiResponse({ status: 200, description: 'Deck deleted successfully' })
  @RouteConfig({
    message: 'Delete Deck By ID',
    requiresAuth: true,
  })
  remove(@GetUser() user: client.User, @Param() params: IdParamDto) {
    return this.deckService.remove(params.id, user.id);
  }

  @Get(':id/reviewed-count-day')
  @ApiOperation({
    summary: 'Get number of cards reviewed in a deck on a specific day',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Date in YYYY-MM-DD format (defaults to today)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of reviewed cards for the specified day',
  })
  @RouteConfig({
    message: 'Get Reviewed Cards Count In Day',
    requiresAuth: true,
  })
  getReviewedCountInDay(
    @Param() params: IdParamDto,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.deckService.getReviewedCardsCountInDay(params.id, targetDate);
  }

  @Get(':id/due-today')
  @ApiOperation({ summary: 'Get cards due for review today in a deck' })
  @ApiResponse({
    status: 200,
    description: 'Returns cards that are due for review today',
  })
  @RouteConfig({
    message: 'Get Cards Due Today',
    requiresAuth: true,
  })
  async getCardsDueToday(@Param() params: IdParamDto) {
    return await this.deckService.getCardsDueToday(params.id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get review statistics for a deck' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the percentage of correct reviews and detailed statistics',
    type: DeckStatisticsDto,
  })
  @RouteConfig({
    message: 'Get Deck Statistics',
    requiresAuth: true,
  })
  async getDeckStatistics(@Param() params: IdParamDto) {
    return await this.deckService.getDeckStatistics(params.id);
  }

  @Get(':id/last-studied')
  @ApiOperation({ summary: 'Get when the deck was last studied' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the date when the deck was last studied (most recent review)',
  })
  @RouteConfig({
    message: 'Get Deck Last Studied Date',
    requiresAuth: true,
  })
  async getLastStudiedDate(@Param() params: IdParamDto) {
    return await this.deckService.getLastStudiedDate(params.id);
  }

  @Get(':id/advanced-statistics')
  @ApiOperation({ summary: 'Get advanced statistics for a deck' })
  @ApiResponse({
    status: 200,
    description:
      'Returns comprehensive statistics including card distribution, retention rate, maturity data, and more',
    type: AdvancedDeckStatisticsDto,
  })
  @RouteConfig({
    message: 'Get Advanced Deck Statistics',
    requiresAuth: true,
  })
  async getAdvancedStatistics(@Param() params: IdParamDto) {
    return await this.deckService.getAdvancedStatistics(params.id);
  }
}
