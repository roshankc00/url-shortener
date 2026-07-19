import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The long URL to be shortened',
    example: 'https://www.google.com',
  })
  @IsString({ message: 'Long URL must be a string' })
  @IsNotEmpty({ message: 'Long URL is required' })
  @IsUrl({}, { message: 'Long URL must be a valid URL' })
  longUrl: string;
}
