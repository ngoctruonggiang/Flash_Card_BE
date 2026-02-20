import { NestFactory } from '@nestjs/core';
import { SeederService } from './seeder.service';
import { AppSeederModule } from './app.seeder.module';

function bootstrap() {
  NestFactory.createApplicationContext(AppSeederModule)
    .then((appContext) => {
      const seeder = appContext.get(SeederService);
      seeder
        .seed()
        .then(() => {
          console.debug('Seeding complete!');
        })
        .catch((error) => {
          console.error('Seeding failed!');
          throw error;
        })
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .finally(() => appContext.close());
    })
    .catch((error) => {
      throw error;
    });
}
bootstrap();
