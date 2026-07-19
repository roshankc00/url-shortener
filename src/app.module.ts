import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import * as Joi from 'joi';

import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './common/health/health.module';
import { CustomLoggerModule } from './common/logger/logger.module';
import { UrlModule } from './url/url.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.string().required(),
        SWAGGER_USERNAME: Joi.string().required(),
        SWAGGER_PASSWORD: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    CustomLoggerModule,
    UrlModule,
    HealthModule,
  ],
})
export class AppModule {}
