import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { Queue } from 'bullmq';

import { CLICK_FLUSH_JOB, CLICK_FLUSH_QUEUE } from '../constants';

@Injectable()
export class ClickSchedulerService implements OnModuleInit {
  constructor(
    @InjectQueue(CLICK_FLUSH_QUEUE) private readonly clickQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.clickQueue.add(
      CLICK_FLUSH_JOB,
      {},
      {
        repeat: { every: 5000 },
        jobId: 'click-flush-repeatable',
      },
    );
  }
}
