import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('FlashLearn')
    .setDescription('The FlashLearn API description')
    .setVersion('1.0')
    .addTag('flashlearn')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform incoming data to DTO instances
      whitelist: true, // Remove properties not defined in the DTO
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    }),
  );

  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
