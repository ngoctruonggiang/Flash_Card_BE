import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CardModule } from 'src/modules/card.module';
import { DeckModule } from 'src/modules/deck.module';
import { UserModule } from 'src/modules/user.module';
import { SeederModule } from './seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    DeckModule,
    CardModule,
    SeederModule,
  ],
})
export class AppSeederModule {}
