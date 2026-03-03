import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
  });
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:3001', 'https://localhost:3000'],
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
  console.log(`Swagger documentation saved to: ${swaggerPath}`);

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
