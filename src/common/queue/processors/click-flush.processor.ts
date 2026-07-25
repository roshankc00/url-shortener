import { Processor, WorkerHost } from '@nestjs/bullmq';

import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';

import { UrlService } from 'src/url/url.service';

import {
  CLICK_FLUSH_QUEUE,
  CLICK_KEY_PREFIX,
  CLICK_SCAN_COUNT,
} from '../constants';

@Processor(CLICK_FLUSH_QUEUE)
export class ClickFlushProcessor extends WorkerHost {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly urlService: UrlService,
  ) {
    super();
  }

  async process() {
    let cursor = '0';
    const batch: { code: string; count: number }[] = [];

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        `${CLICK_KEY_PREFIX}*`,
        'COUNT',
        CLICK_SCAN_COUNT,
      );
      cursor = nextCursor;

      if (keys.length) {
        const pipeline = this.redis.pipeline();
        keys.forEach((k) => pipeline.getdel(k));
        const results = await pipeline.exec();

        results?.forEach((res, i) => {
          const [err, val] = res ?? [];
          if (!err && val) {
            const code = keys[i].replace(CLICK_KEY_PREFIX, '');
            batch.push({ code, count: parseInt(val as string, 10) });
          }
        });
      }
    } while (cursor !== '0');

    if (batch.length) {
      await this.urlService.bulkIncrementClicks(batch);
    }
  }
}
