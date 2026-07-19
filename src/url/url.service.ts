import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CreateUrlDto } from './dto/create-url.dto';
import { UrlRepository } from './repositories/url.repository';

@Injectable()
export class UrlService {
  constructor(private readonly urlRepository: UrlRepository) {}
  create(createUrlDto: CreateUrlDto) {
    return this.urlRepository.create({
      ...createUrlDto,
      code: randomUUID(),
      clicks: 0,
    });
  }

  async findOne(code: string): Promise<string> {
    const record = await this.urlRepository.findOne(
      { code },
      { longUrl: 1, _id: 0 },
    );
    return record.longUrl;
  }
}
