import { Module } from '@nestjs/common';
import { SeederService } from 'src/seeders/seeder.service';
import { CardModule } from '../modules/card.module';
import { DeckModule } from '../modules/deck.module';
import { UserModule } from '../modules/user.module';
import { AuthModule } from 'src/modules/auth.module';

@Module({
  imports: [CardModule, DeckModule, UserModule, AuthModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
