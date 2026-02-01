import { Module } from '@nestjs/common';
import { CardController } from 'src/controllers/card/card.controller';
import { CardService } from 'src/services/card/card.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  imports: [],
  controllers: [CardController],
  providers: [CardService, PrismaService],
})
export class CardModule {}
