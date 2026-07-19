import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CREATED_URL, LONG_URL } from 'src/common/constants';

import { CreateUrlDto } from './dto/create-url.dto';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';

describe('UrlController', () => {
  let controller: UrlController;
  let service: jest.Mocked<UrlService>;

  const mockUrlService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService,
        },
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    service = module.get(UrlService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call urlService.create with the dto and return the result', async () => {
      const dto: CreateUrlDto = { longUrl: LONG_URL };
      const createdUrl = CREATED_URL;

      service.create.mockResolvedValue(createdUrl as any);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(createdUrl);
    });
  });

  describe('redirect', () => {
    it('should call urlService.findOne with the code and return redirect object', async () => {
      const code = CREATED_URL.code;
      const longUrl = CREATED_URL.longUrl;

      service.findOne.mockResolvedValue(longUrl);

      const result = await controller.redirect(code);

      expect(service.findOne).toHaveBeenCalledWith(code);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ url: longUrl, statusCode: HttpStatus.FOUND });
    });

    it('should propagate NotFoundException when service throws', async () => {
      const code = 'invalid-code';
      const error = new Error('Document was not found');

      service.findOne.mockRejectedValue(error);

      await expect(controller.redirect(code)).rejects.toThrow(error);
      expect(service.findOne).toHaveBeenCalledWith(code);
    });
  });
});
