/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeckService } from './deck.service';
import { PrismaService } from '../prisma.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/createDeck.dto';

describe('Deck', () => {
  let provider: DeckService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    deck: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    cardReview: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeckService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    provider = module.get<DeckService>(DeckService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('Create', () => {
    it('should create a new deck', async () => {
      const userId = 1;
      const mockDeck: CreateDeckDto = {
        title: 'Test Deck',
        description: 'Test Description',
      };
      const mockCreatedDeck = {
        id: 1,
        title: 'Test Deck',
        description: 'Test Description',
        iconName: undefined,
        colorCode: undefined,
        languageMode: 'VN_EN',
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.deck.create.mockResolvedValue(mockCreatedDeck);
      const result = await provider.create(userId, mockDeck);
      expect(result).not.toBeNull();
      expect(prismaService.deck.create).toHaveBeenCalledWith({
        data: {
          title: mockDeck.title,
          description: mockDeck.description,
          iconName: undefined,
          colorCode: undefined,
          languageMode: 'VN_EN',
          userId: userId,
        },
      });
    });
  });

  describe('Remove', () => {
    it('should remove a deck', async () => {
      const mockDeck = { id: 1, name: 'Test Deck', userId: 1 };
      const mockCards = [{ id: 1 }, { id: 2 }];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);
      mockPrismaService.cardReview.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.card.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.deck.delete.mockResolvedValue(mockDeck);
      const result = await provider.remove(1);
      expect(result).toEqual(mockDeck);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
        select: { id: true },
      });
      expect(prismaService.card.deleteMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
      });
      expect(prismaService.deck.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('Update', () => {
    it('should update a deck', async () => {
      const mockDeck = { id: 1, name: 'Updated Deck', userId: 1 };

      mockPrismaService.deck.update.mockResolvedValue(mockDeck);
      const result = await provider.update(1, { title: 'Updated Deck' });

      expect(result).toEqual(mockDeck);
      expect(prismaService.deck.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated Deck' },
      });
    });

    it('should throw an error if deck not found', async () => {
      mockPrismaService.deck.update.mockRejectedValue(
        new Error('Deck not found'),
      );
      await expect(
        provider.update(999, { title: 'Non-existent Deck' }),
      ).rejects.toThrow('Deck not found');
      expect(prismaService.deck.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: { title: 'Non-existent Deck' },
      });
    });
  });

  describe('Query', () => {
    describe('findAll', () => {
      it('should return all decks', async () => {
        const mockDecks = [
          { id: 1, name: 'Deck 1', userId: 1, cards: [] },
          { id: 2, name: 'Deck 2', userId: 1, cards: [] },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

        const result = await provider.findAll();

        expect(result).toEqual(mockDecks);
        expect(prismaService.deck.findMany).toHaveBeenCalledWith({
          include: {
            user: true,
            cards: true,
          },
        });
      });
    });

    describe('findByUser', () => {
      it('should return decks by userId', async () => {
        const mockDecks = [
          { id: 1, name: 'Deck 1', userId: 1, cards: [] },
          { id: 2, name: 'Deck 2', userId: 1, cards: [] },
        ];
        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

        const result = await provider.findByUser(1);

        expect(result).toEqual(mockDecks);
        expect(prismaService.deck.findMany).toHaveBeenCalledWith({
          where: { userId: 1 },
          include: {
            cards: true,
          },
        });
      });
    });

    describe('findOne', () => {
      it('should return a single deck by id', async () => {
        const mockDeck = { id: 1, name: 'Deck 1', userId: 1, cards: [] };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

        const result = await provider.findOne(1);

        expect(result).toEqual(mockDeck);
        expect(prismaService.deck.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: {
            user: true,
            cards: {
              include: {
                reviews: true,
              },
            },
          },
        });
      });

      it('should return null if deck not found', async () => {
        mockPrismaService.deck.findUnique.mockResolvedValue(null);

        const result = await provider.findOne(999);

        expect(result).toBeNull();
        expect(prismaService.deck.findUnique).toHaveBeenCalledWith({
          where: { id: 999 },
          include: {
            user: true,
            cards: {
              include: {
                reviews: true,
              },
            },
          },
        });
      });
    });
  });
});
