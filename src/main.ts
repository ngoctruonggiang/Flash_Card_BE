import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';

async function bootstrap() {
  // Create the Winston logger instance BEFORE the NestJS app
  // so that even bootstrap errors are captured by Winston.
  const logger = WinstonModule.createLogger(winstonConfig);

  const app = await NestFactory.create(AppModule, {
    logger, // Replace the default NestJS logger with Winston
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:3001', 'http://localhost:3002', 'https://localhost:3000', 'http://localhost:3000'],
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('FlashLearn')
    .setDescription('The FlashLearn API description')
    .setVersion('1.0')
    .addTag('flashlearn')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Save Swagger JSON to file
  const swaggerPath = join(process.cwd(), 'swagger.json');
  await writeFile(swaggerPath, JSON.stringify(document, null, 2));
  logger.log(`Swagger documentation saved to: ${swaggerPath}`, 'Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform incoming data to DTO instances
      whitelist: true, // Remove properties not defined in the DTO
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    }),
  );

  app.use(cookieParser());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
