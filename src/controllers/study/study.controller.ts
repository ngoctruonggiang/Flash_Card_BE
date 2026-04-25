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
import { StudySessionStatisticsDto } from 'src/utils/types/dto/study/studySessionStatistics.dto';
import { TimeRangeStatisticsDto } from 'src/utils/types/dto/study/timeRangeStatistics.dto';
import {
  UserStatisticsDto,
  UserStatisticsQueryDto,
} from 'src/utils/types/dto/study/userStatistics.dto';
import {
  UserDailyBreakdownDto,
  UserDailyBreakdownQueryDto,
} from 'src/utils/types/dto/study/userDailyBreakdown.dto';
import {
  RecentActivityItemDto,
  RecentActivityQueryDto,
} from 'src/utils/types/dto/study/recentActivity.dto';
import type { User } from '@prisma/client';

@ApiTags('Study')
@Controller('study')
export class StudyController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly studyService: StudyService,
  ) {}

  // ==================== STATIC ROUTES (must come before parameterized routes) ====================

  @Get('/user-statistics')
  @ApiOperation({
    summary:
      'Get comprehensive statistics for the current user across all decks',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    enum: ['week', 'month', 'year'],
    description: 'Time range for statistics. Defaults to week.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user statistics aggregated across all decks',
    type: UserStatisticsDto,
  })
  @RouteConfig({
    message: 'Get User Statistics',
    requiresAuth: true,
  })
  async getUserStatistics(
    @GetUser() user: User,
    @Query() query: UserStatisticsQueryDto,
  ) {
    return await this.studyService.getUserStatistics(user.id, query.timeRange);
  }

  @Get('/user-daily-breakdown')
  @ApiOperation({
    summary: 'Get daily statistics for the user within a time range',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in ISO 8601 format (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in ISO 8601 format (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns daily statistics aggregated across all user decks for the specified range',
    type: UserDailyBreakdownDto,
  })
  @RouteConfig({
    message: 'Get User Daily Breakdown',
    requiresAuth: true,
  })
  async getUserDailyBreakdown(
    @GetUser() user: User,
    @Query() query: UserDailyBreakdownQueryDto,
  ) {
    return await this.studyService.getUserDailyBreakdown(
      user.id,
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }

  @Get('/recent-activity')
  @ApiOperation({
    summary: "Get the user's most recent study activities across all decks",
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of activities to return. Default: 10, Max: 50',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns recent study activities sorted by date descending',
    type: [RecentActivityItemDto],
  })
  @RouteConfig({
    message: 'Get Recent Activity',
    requiresAuth: true,
  })
  async getRecentActivity(
    @GetUser() user: User,
    @Query() query: RecentActivityQueryDto,
  ) {
    return await this.studyService.getRecentActivity(user.id, query.limit);
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

  @Post('/cram/review')
  @ApiOperation({
    summary: 'Submit cram session review (does not affect scheduling)',
  })
  @ApiResponse({
    status: 201,
    description: 'Cram review submitted successfully',
  })
  @RouteConfig({
    message: 'Submitting cram review',
    requiresAuth: true,
  })
  submitCramReview(@Body() cardReview: SubmitReviewDto) {
    return this.reviewService.submitCramReviews(cardReview);
  }

  // ==================== PARAMETERIZED ROUTES ====================

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
  @ApiResponse({ status: 200, description: 'Returns cards for cram session' })
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

  @Get('/session-statistics/:deckId')
  @ApiOperation({ summary: 'Get study session statistics for a time range' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Session start date in ISO format',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Session end date in ISO format',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns statistics for the study session',
    type: StudySessionStatisticsDto,
  })
  @RouteConfig({
    message: 'Get Study Session Statistics',
    requiresAuth: true,
  })
  async getSessionStatistics(
    @Param('deckId') deckId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.studyService.calculateSessionStatistics(
      Number(deckId),
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('/time-range-statistics/:deckId')
  @ApiOperation({ summary: 'Get comprehensive statistics for a time range' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Range start date in ISO format',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Range end date in ISO format',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns detailed statistics including daily breakdown, streaks, and quality distribution',
    type: TimeRangeStatisticsDto,
  })
  @RouteConfig({
    message: 'Get Time Range Statistics',
    requiresAuth: true,
  })
  async getTimeRangeStatistics(
    @Param('deckId') deckId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.studyService.getTimeRangeStatistics(
      Number(deckId),
      new Date(startDate),
      new Date(endDate),
    );
  }
}
