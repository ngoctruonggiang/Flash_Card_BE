import { Module } from '@nestjs/common';
import { StudyController } from 'src/controllers/study/study.controller';
import { ReviewService } from 'src/services/review/review.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudyController],
  providers: [ReviewService],
})
export class StudyModule {}
