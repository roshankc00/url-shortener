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
    schema: {
      example: CREATED_URL,
    },
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
      'Looks up the code and redirects (302) to the associated long URL.',
  })
  @ApiParam({
    name: 'code',
    description: 'Unique short URL code',
    example: 'a1b2c3d4',
  })
  @ApiOkResponse({ description: 'Redirects to the original URL' })
  @ApiNotFoundResponse({
    description: 'Code not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Document was not found',
        error: 'Not Found',
      },
    },
  })
  async redirect(@Param('code') code: string) {
    console.log(code);
    const longUrl = await this.urlService.findOne(code);
    return { url: longUrl, statusCode: HttpStatus.FOUND };
  }
}
