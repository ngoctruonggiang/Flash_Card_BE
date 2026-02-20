import { Module } from '@nestjs/common';
import { DeckController } from 'src/controllers/deck/deck.controller';
import { DeckService } from 'src/services/deck/deck.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  imports: [],
  controllers: [DeckController],
  providers: [DeckService, PrismaService],
  exports: [DeckService],
})
export class DeckModule {}
