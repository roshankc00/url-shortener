import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { AbstractRepository } from 'src/common/database/abstract.repository';

import { Url } from '../entities/url.entity';

@Injectable()
export class UrlRepository extends AbstractRepository<Url> {
  protected readonly logger = new Logger(UrlRepository.name);
  constructor(@InjectModel(Url.name) urlModel: Model<Url>) {
    super(urlModel);
  }
}
