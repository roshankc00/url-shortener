import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RedisModule } from '@songkeys/nestjs-redis';
import * as Joi from 'joi';

import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './common/health/health.module';
import { CustomLoggerModule } from './common/logger/logger.module';
import { ClickModule } from './common/queue';
import { UrlModule } from './url/url.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        SWAGGER_USERNAME: Joi.string().required(),
        SWAGGER_PASSWORD: Joi.string().required(),
        ZOOKEEPER_CONNECTION_STRING: Joi.string().required(),
        ID_BLOCK_SIZE: Joi.number().required(),
      }),
    }),

    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),

    DatabaseModule,
    CustomLoggerModule,
    UrlModule,
    ClickModule,
    HealthModule,
  ],
})
export class AppModule {}
