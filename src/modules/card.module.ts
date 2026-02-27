import { Module } from '@nestjs/common';
import { CardController } from 'src/controllers/card/card.controller';
import { CardService } from 'src/services/card/card.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
