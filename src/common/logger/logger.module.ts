import { Module } from '@nestjs/common';

import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => {
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
              ],
            },
          },
        };
      },
    }),
  ],
})
export class CustomLoggerModule {}
