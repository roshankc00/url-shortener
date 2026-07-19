import * as fs from 'fs';
import * as path from 'path';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const logFilePath =
          configService.get('LOG_FILE_PATH') || './logs/app.log';

        const logDirectory = path.dirname(logFilePath);
        if (!fs.existsSync(logDirectory)) {
          fs.mkdirSync(logDirectory, { recursive: true });
        }

        return {
          pinoHttp: {
            transport: {
              targets: [
                {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
                    ignore: 'pid,hostname',
                  },
                  level: 'info',
                },
                {
                  target: 'pino/file',
                  options: {
                    destination: logFilePath,
                    mkdir: true,
                  },
                  level: isProduction ? 'info' : 'debug',
                },
              ],
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class CustomLoggerModule {}
