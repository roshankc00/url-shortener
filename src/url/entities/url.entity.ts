import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { AbstractEntity } from 'src/common/database/abstract.entity.ts';

@Schema({ versionKey: false })
export class Url extends AbstractEntity {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  longUrl: string;

  @Prop({ default: 0 })
  clicks: number;
}

export const UrlSchema = SchemaFactory.createForClass(Url);
