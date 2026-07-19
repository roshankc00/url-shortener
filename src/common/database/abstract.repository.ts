import { Logger, NotFoundException } from '@nestjs/common';

import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

import { AbstractEntity } from './abstract.entity.ts';

export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;
  constructor(public model: Model<T>) {}
  async create(
    document: Omit<T, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<T> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (await createdDocument.save()).toJSON() as unknown as T;
  }

  async findOne(
    filteredQuery: FilterQuery<T>,
    projection?: Record<string, 0 | 1>,
  ): Promise<T> {
    const document = await this.model
      .findOne(filteredQuery, projection)
      .lean<T>(true);

    if (!document) {
      this.logger.warn(
        'Document was not found with the filtered query',
        filteredQuery,
      );
      throw new NotFoundException('Document was not found ');
    }
    return document;
  }

  async findOneAndUpdate(
    filteredQuery: FilterQuery<T>,
    updateQuery: UpdateQuery<T>,
  ): Promise<T> {
    const document = await this.model
      .findOneAndUpdate(filteredQuery, updateQuery, {
        new: true,
      })
      .lean<T>(true);

    if (!document) {
      this.logger.warn(
        'Document was not found with the filtered query',
        filteredQuery,
      );
      throw new NotFoundException('Document was not found ');
    }

    return document;
  }

  async find(filteredQuery: FilterQuery<T>): Promise<T[]> {
    return this.model.find(filteredQuery).lean<T[]>(true);
  }
}
