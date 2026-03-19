import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReviewService } from 'src/services/review/review.service';
import { StudyService } from 'src/services/study/study.service';
import { RouteConfig } from 'src/utils/decorators/route.decorator';
import { GetUser } from 'src/utils/decorators/user.decorator';
import { IdParamDto } from 'src/utils/types/dto/IDParam.dto';
import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto';
import { ReviewPreviewDto } from 'src/utils/types/dto/review/previewReview.dto';
import { ConsecutiveDaysDto } from 'src/utils/types/dto/review/consecutiveDays.dto';
import type { User } from '@prisma/client';

@ApiTags('Study')
@Controller('study')
export class StudyController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly studyService: StudyService,
  ) {}

  @Get('/start/:id')
  @ApiOperation({ summary: 'Get due reviews for a deck' })
  @ApiResponse({ status: 200, description: 'Return due reviews' })
  @RouteConfig({
    message: 'Start Study Session',
    requiresAuth: true,
  })
  getDueReviews(@Param() params: IdParamDto) {
    return this.reviewService.getDueReviews(params.id);
  }

  @Get('/preview/:id')
  @ApiOperation({ summary: 'Get preview of intervals for all quality options' })
  @ApiResponse({
    status: 200,
    description: 'Returns preview intervals for Again, Hard, Good, and Easy',
    type: ReviewPreviewDto,
  })
  @RouteConfig({
    message: 'Get review interval previews',
    requiresAuth: true,
  })
  getReviewPreview(@Param() params: IdParamDto) {
    return this.reviewService.getReviewPreview(Number(params.id));
  }

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

  @Get('/consecutive-days/:id')
  @ApiOperation({ summary: 'Get consecutive days of studying for a deck' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the number of consecutive days the deck has been studied',
    type: ConsecutiveDaysDto,
  })
  @RouteConfig({
    message: 'Get consecutive study days',
    requiresAuth: true,
  })
  getConsecutiveDays(@Param() params: IdParamDto) {
    return this.reviewService.getConsecutiveStudyDays(Number(params.id));
  }

  @Get('cram/:deckId')
  @ApiOperation({
    summary: 'Get cards for practice (Cram Mode) - Ignores schedule',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @RouteConfig({
    message: 'Start Cram Session',
    requiresAuth: true,
  })
  async startCramSession(
    @GetUser() user: User,
    @Param('deckId') deckId: number,
    @Query('limit') limit?: number,
  ) {
    const cardLimit = limit ? Number(limit) : 50;

    const cards = await this.studyService.getCramCards(
      user.id,
      Number(deckId),
      cardLimit,
    );

    return {
      message: 'Cram session started',
      data: cards,
      total: cards.length,
    };
  }
}
