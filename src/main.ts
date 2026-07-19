import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as basicAuth from 'express-basic-auth';

import { AppModule } from './app.module';
import { swaggerDetails } from './common/constants';

const swaggerSetup = (app: INestApplication) => {
  const swaggerUsername = app.get(ConfigService).get('SWAGGER_USERNAME');
  const swaggerPassword = app.get(ConfigService).get('SWAGGER_PASSWORD');

  app.use(
    [`/swagger`, `/swagger-json`],
    basicAuth.default({
      challenge: true,
      users: { [swaggerUsername]: swaggerPassword },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle(swaggerDetails.title)
    .setDescription(swaggerDetails.description)
    .setVersion(swaggerDetails.description)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`/swagger`, app, document);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  swaggerSetup(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
