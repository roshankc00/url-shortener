import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { UrlModule } from 'src/url/url.module';

import { CLICK_FLUSH_QUEUE } from '../constants';
import { ClickFlushProcessor } from '../processors/click-flush.processor';

import { ClickSchedulerService } from './click-scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CLICK_FLUSH_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
    UrlModule,
  ],
  providers: [ClickFlushProcessor, ClickSchedulerService],
  exports: [BullModule],
})
export class ClickModule {}
