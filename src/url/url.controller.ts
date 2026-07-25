import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Redirect,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CREATED_URL } from 'src/common/constants';

import { CreateUrlDto } from './dto/create-url.dto';
import { UrlService } from './url.service';

@ApiTags('URL Shortener')
@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a shortened URL',
    description:
      'Accepts a long URL and returns a shortened version with a unique code.',
  })
  @ApiBody({ type: CreateUrlDto })
  @ApiCreatedResponse({
    description: 'URL shortened successfully',
    schema: { example: CREATED_URL },
  })
  @ApiBadRequestResponse({
    description: 'Invalid URL supplied',
    schema: {
      example: {
        statusCode: 400,
        message: ['longUrl must be a valid URL'],
        error: 'Bad Request',
      },
    },
  })
  create(@Body() createUrlDto: CreateUrlDto) {
    return this.urlService.create(createUrlDto);
  }

  @Get(':code')
  @Redirect()
  @ApiOperation({
    summary: 'Redirect to the original URL',
    description:
      'Looks up the code and redirects (302) to the associated long URL. Increments the click counter asynchronously via Redis — the counter is flushed to the database in bulk on a fixed interval, so click counts are eventually consistent, not real-time.',
  })
  @ApiParam({
    name: 'code',
    description: 'Unique short URL code',
    example: 'a1b2c3d4',
  })
  @ApiOkResponse({
    description: 'Redirect issued (302 Found) to the original long URL',
  })
  @ApiNotFoundResponse({
    description: 'No URL exists for the given code',
    schema: {
      example: {
        statusCode: 404,
        message: 'No URL found for code: a1b2c3d4',
        error: 'Not Found',
      },
    },
  })
  async redirect(@Param('code') code: string) {
    const longUrl = await this.urlService.getUrl(code);
    return { url: longUrl, statusCode: HttpStatus.FOUND };
  }

  @Get('get-record/:code')
  @ApiOperation({
    summary: 'Get the stored record for a given code',
    description:
      'Looks up the code and returns the full stored record. Does not increment the click counter — this is a lookup, not a visit.',
  })
  @ApiParam({
    name: 'code',
    description: 'Unique short URL code',
    example: 'a1b2c3d4',
  })
  @ApiOkResponse({
    description: 'Returns the record for the given code',
    schema: {
      example: CREATED_URL,
    },
  })
  @ApiNotFoundResponse({
    description: 'No URL exists for the given code',
    schema: {
      example: {
        statusCode: 404,
        message: 'No URL found for code: a1b2c3d4',
        error: 'Not Found',
      },
    },
  })
  async getRecord(@Param('code') code: string) {
    return this.urlService.findOne(code);
  }
}
