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
import { IdParamDto } from 'src/utils/types/dto/IDParam.dto';
import { UpdateCardDto } from 'src/utils/types/dto/card/updateCard.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RouteConfig } from 'src/utils/decorators/route.decorator';

@ApiTags('Card')
@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new card' })
  @ApiResponse({ status: 201, description: 'Card created successfully' })
  @RouteConfig({
    message: 'Create Card',
    requiresAuth: true,
  })
  create(
    @Body()
    createCardDto: CreateCardDto,
  ) {
    return this.cardService.create({
      deckId: createCardDto.deckId,
      front: createCardDto.front,
      back: createCardDto.back,
      tags: createCardDto.tags,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all cards' })
  @ApiQuery({ name: 'deckId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return all cards' })
  @RouteConfig({
    message: 'Get All Cards',
    requiresAuth: true,
  })
  findAll(@Query('deckId', ParseIntPipe) deckId?: number) {
    if (deckId) {
      return this.cardService.findByDeck(deckId);
    }
    return this.cardService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a card by id' })
  @ApiResponse({ status: 200, description: 'Return a card' })
  @RouteConfig({
    message: 'Get All Cards',
    requiresAuth: true,
  })
  findOne(@Param() params: IdParamDto) {
    return this.cardService.findOne(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a card' })
  @ApiResponse({ status: 200, description: 'Card updated successfully' })
  @RouteConfig({
    message: 'Get All Cards',
    requiresAuth: true,
  })
  update(
    @Param() params: IdParamDto,
    @Body()
    updateCardDto: UpdateCardDto,
  ) {
    return this.cardService.update(params.id, updateCardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a card' })
  @ApiResponse({ status: 200, description: 'Card deleted successfully' })
  @RouteConfig({
    message: 'Get All Cards',
    requiresAuth: true,
  })
  remove(@Param() params: IdParamDto) {
    return this.cardService.remove(params.id);
  }

  @Get(':id/review-status')
  @ApiOperation({ summary: 'Get card review status' })
  @ApiResponse({
    status: 200,
    description:
      'Returns when the card was last reviewed and when it is due next',
  })
  @RouteConfig({
    message: 'Get Card Review Status',
    requiresAuth: true,
  })
  getReviewStatus(@Param() params: IdParamDto) {
    return this.cardService.getReviewStatus(params.id);
  }
}
