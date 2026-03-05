import { Module } from '@nestjs/common';
import { DeckController } from 'src/controllers/deck/deck.controller';
import { DeckService } from 'src/services/deck/deck.service';
import { PrismaModule } from './prisma.module';
import { ReviewService } from 'src/services/review/review.service';
import { CardModule } from './card.module';

@Module({
  imports: [PrismaModule, CardModule],
  controllers: [DeckController],
  providers: [DeckService, ReviewService],
  exports: [DeckService, ReviewService],
})
export class DeckModule {}
