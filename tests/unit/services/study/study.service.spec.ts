import { Test, TestingModule } from '@nestjs/testing';
import { StudyService } from 'src/services/study/study.service';
import { PrismaService } from 'src/services/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('StudyService', () => {
  let service: StudyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    deck: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StudyService>(StudyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCramCards', () => {
    it('should return cram cards', async () => {
      const mockDeck = { id: 1, userId: 1 };
      const mockCards = [{ id: 1 }, { id: 2 }];

      mockPrismaService.deck.findFirst.mockResolvedValue(mockDeck);
      mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

      const result = await service.getCramCards(1, 1, 10);

      expect(result).toEqual(mockCards);
      expect(prismaService.deck.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should throw NotFoundException if deck not found', async () => {
      mockPrismaService.deck.findFirst.mockResolvedValue(null);

      await expect(service.getCramCards(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
