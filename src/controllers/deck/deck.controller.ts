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
import { ReviewService } from 'src/services/review/review.service';
import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto';
import { CardService } from 'src/services/card/card.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Deck')
@Controller('deck')
export class DeckController {
  constructor(
    private readonly deckService: DeckService,
    private readonly reviewService: ReviewService,
    private readonly cardService: CardService,
  ) {}

  // Review
  @Post('/review')
  @ApiOperation({ summary: 'Submit card review' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @RouteConfig({
    message: 'Submitting card review',
    requiresAuth: true,
  })
  submitReview(@Body() cardReview: SubmitReviewDto) {
    return this.reviewService.submitReviews(cardReview);
  }

  @Get('/review/:id')
  @ApiOperation({ summary: 'Get due reviews for a deck' })
  @ApiResponse({ status: 200, description: 'Return due reviews' })
  @RouteConfig({
    message: 'Get Review Deck By ID',
    requiresAuth: true,
  })
  getDueReviews(@Param() params: IdParamDto) {
    return this.reviewService.getDueReviews(params.id);
  }

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
