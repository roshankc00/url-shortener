import { Injectable, Logger } from '@nestjs/common';

import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { AnyBulkWriteOperation } from 'mongoose';

import { IdGeneratorService } from 'src/common/id-generator';
import { convertToBase62 } from 'src/common/lib';
import { CLICK_KEY_PREFIX } from 'src/common/queue';

import { CreateUrlDto } from './dto/create-url.dto';
import { Url } from './entities/url.entity';
import { UrlRepository } from './repositories/url.repository';

@Injectable()
export class UrlService {
  private readonly logger = new Logger(UrlService.name);

  constructor(
    private readonly urlRepository: UrlRepository,
    @InjectRedis() private readonly redis: Redis,
    private readonly idGeneratorService: IdGeneratorService,
  ) {}

  async create(createUrlDto: CreateUrlDto) {
    const id = await this.idGeneratorService.nextId();
    const code = convertToBase62(id);
    return this.urlRepository.create({
      ...createUrlDto,
      code,
      clicks: 0,
    });
  }

  async getUrl(code: string): Promise<string> {
    const record = await this.urlRepository.findOne(
      { code },
      { longUrl: 1, _id: 0 },
    );
    this.redis.incr(`${CLICK_KEY_PREFIX}${code}`).catch((err) => {
      this.logger.error(`Failed to increment click for code=${code}`, err);
    });
    return record.longUrl;
  }

  async findOne(code: string) {
    const record = await this.urlRepository.findOne({ code });
    return record;
  }

  async bulkIncrementClicks(
    batch: { code: string; count: number }[],
  ): Promise<{ matched: number; modified: number }> {
    if (!batch.length) {
      return { matched: 0, modified: 0 };
    }

    const ops: AnyBulkWriteOperation<Url>[] = batch.map(({ code, count }) => ({
      updateOne: {
        filter: { code },
        update: { $inc: { clicks: count } },
      },
    }));

    try {
      const result = await this.urlRepository.model.bulkWrite(ops, {
        ordered: false,
      });

      const matched = result.matchedCount ?? 0;
      const modified = result.modifiedCount ?? 0;

      if (matched < batch.length) {
        this.logger.warn(
          `bulkIncrementClicks: ${batch.length - matched} of ${batch.length} codes matched no document`,
        );
      }

      return { matched, modified };
    } catch (err) {
      this.logger.error('bulkIncrementClicks failed', err as Error);
      throw err;
    }
  }
}
