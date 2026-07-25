import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';

import { Url, UrlSchema } from './entities/url.entity';
import { UrlRepository } from './repositories/url.repository';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';

@Module({
  imports: [DatabaseModule.forFeature([{ name: Url.name, schema: UrlSchema }])],
  controllers: [UrlController],
  providers: [UrlService, UrlRepository],
  exports: [UrlService],
})
export class UrlModule {}
