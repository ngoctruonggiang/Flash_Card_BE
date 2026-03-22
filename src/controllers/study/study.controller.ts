import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReviewService } from 'src/services/review/review.service';
import { RouteConfig } from 'src/utils/decorators/route.decorator';
import { IdParamDto } from 'src/utils/types/dto/IDParam.dto';
import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto';
import { ReviewPreviewDto } from 'src/utils/types/dto/review/previewReview.dto';

@ApiTags('Study')
@Controller('study')
export class StudyController {
  constructor(private readonly reviewService: ReviewService) {}

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
}
