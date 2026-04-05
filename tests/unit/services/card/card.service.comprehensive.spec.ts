/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from 'src/services/card/card.service';
import { PrismaService } from 'src/services/prisma.service';

describe('CardService - Comprehensive Tests', () => {
  let provider: CardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    card: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deck: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    provider = module.get<CardService>(CardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Basic card creation', () => {
      it('should create card with minimum required fields', async () => {
        const createDto = {
          deckId: 1,
          front: 'Q',
          back: 'A',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result).toEqual(mockCard);
      });

      it('should create card with all optional fields', async () => {
        const createDto = {
          deckId: 1,
          front: 'Hello',
          back: 'Xin chao',
          tags: 'greeting,common',
          wordType: 'noun',
          pronunciation: 'həˈloʊ',
          examples: [
            { sentence: 'Hello world', translation: 'Xin chao the gioi' },
          ],
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = {
          id: 1,
          ...createDto,
          examples: JSON.stringify(createDto.examples),
        };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.examples).toEqual(createDto.examples);
      });

      it('should throw error if deck not found', async () => {
        mockPrismaService.deck.findUnique.mockResolvedValue(null);

        await expect(
          provider.create({ deckId: 999, front: 'Q', back: 'A' }),
        ).rejects.toThrow('Deck not found');
      });

      it('should handle empty front text', async () => {
        const createDto = { deckId: 1, front: '', back: 'Answer' };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.front).toBe('');
      });

      it('should handle empty back text', async () => {
        const createDto = { deckId: 1, front: 'Question', back: '' };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.back).toBe('');
      });

      it('should handle very long front text', async () => {
        const longFront = 'A'.repeat(10000);
        const createDto = { deckId: 1, front: longFront, back: 'A' };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.front).toBe(longFront);
      });

      it('should handle very long back text', async () => {
        const longBack = 'B'.repeat(10000);
        const createDto = { deckId: 1, front: 'Q', back: longBack };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.back).toBe(longBack);
      });

      it('should handle special characters in front and back', async () => {
        const createDto = {
          deckId: 1,
          front: 'Hello <script>alert("xss")</script>',
          back: '日本語 🎉 €£¥',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.front).toBe('Hello <script>alert("xss")</script>');
        expect(result.back).toBe('日本語 🎉 €£¥');
      });

      it('should handle HTML in card content', async () => {
        const createDto = {
          deckId: 1,
          front: '<b>Bold Question</b>',
          back: '<img src="image.png">',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.front).toContain('<b>');
      });

      it('should handle newlines in card content', async () => {
        const createDto = {
          deckId: 1,
          front: 'Line 1\nLine 2\nLine 3',
          back: 'Answer\n\nMultiple lines',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.front).toContain('\n');
      });
    });

    describe('Bidirectional card creation', () => {
      it('should create reverse card for BIDIRECTIONAL deck', async () => {
        const createDto = { deckId: 1, front: 'Hello', back: 'Xin chao' };
        const mockDeck = { id: 1, languageMode: 'BIDIRECTIONAL' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        await provider.create(createDto);

        expect(prismaService.card.create).toHaveBeenCalledTimes(2);
        expect(prismaService.card.create).toHaveBeenNthCalledWith(1, {
          data: expect.objectContaining({
            front: 'Hello',
            back: 'Xin chao',
          }),
        });
        expect(prismaService.card.create).toHaveBeenNthCalledWith(2, {
          data: expect.objectContaining({
            front: 'Xin chao',
            back: 'Hello',
          }),
        });
      });

      it('should NOT create reverse card for VN_EN deck', async () => {
        const createDto = { deckId: 1, front: 'Hello', back: 'Xin chao' };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        await provider.create(createDto);

        expect(prismaService.card.create).toHaveBeenCalledTimes(1);
      });

      it('should NOT create reverse card for EN_VN deck', async () => {
        const createDto = { deckId: 1, front: 'Xin chao', back: 'Hello' };
        const mockDeck = { id: 1, languageMode: 'EN_VN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        await provider.create(createDto);

        expect(prismaService.card.create).toHaveBeenCalledTimes(1);
      });

      it('should copy rich content fields to reverse card', async () => {
        const createDto = {
          deckId: 1,
          front: 'Hello',
          back: 'Xin chao',
          tags: 'greeting',
          wordType: 'interjection',
          pronunciation: 'həˈloʊ',
          examples: [{ sentence: 'Hello!', translation: 'Xin chao!' }],
        };
        const mockDeck = { id: 1, languageMode: 'BIDIRECTIONAL' };
        const mockCard = {
          id: 1,
          ...createDto,
          examples: JSON.stringify(createDto.examples),
        };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        await provider.create(createDto);

        expect(prismaService.card.create).toHaveBeenNthCalledWith(2, {
          data: expect.objectContaining({
            tags: 'greeting',
            wordType: 'interjection',
            pronunciation: 'həˈloʊ',
          }),
        });
      });
    });

    describe('Tags handling', () => {
      it('should handle single tag', async () => {
        const createDto = {
          deckId: 1,
          front: 'Q',
          back: 'A',
          tags: 'single',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.tags).toBe('single');
      });

      it('should handle multiple tags', async () => {
        const createDto = {
          deckId: 1,
          front: 'Q',
          back: 'A',
          tags: 'tag1,tag2,tag3',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.tags).toBe('tag1,tag2,tag3');
      });

      it('should handle empty tags', async () => {
        const createDto = {
          deckId: 1,
          front: 'Q',
          back: 'A',
          tags: '',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.tags).toBe('');
      });

      it('should handle undefined tags', async () => {
        const createDto = {
          deckId: 1,
          front: 'Q',
          back: 'A',
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, tags: null, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.tags).toBeNull();
      });
    });

    describe('Examples handling', () => {
      it('should handle single example', async () => {
        const createDto = {
          deckId: 1,
          front: 'Q',
          back: 'A',
          examples: [{ sentence: 'Example', translation: 'Vi du' }],
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = {
          id: 1,
          ...createDto,
          examples: JSON.stringify(createDto.examples),
        };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.examples).toEqual(createDto.examples);
      });

      it('should handle multiple examples', async () => {
        const examples = [
          { sentence: 'Example 1', translation: 'Vi du 1' },
          { sentence: 'Example 2', translation: 'Vi du 2' },
          { sentence: 'Example 3', translation: 'Vi du 3' },
        ];
        const createDto = { deckId: 1, front: 'Q', back: 'A', examples };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = {
          id: 1,
          ...createDto,
          examples: JSON.stringify(examples),
        };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.examples).toHaveLength(3);
      });

      it('should handle empty examples array', async () => {
        const createDto = {
          deckId: 1,
          front: 'Q',
          back: 'A',
          examples: [],
        };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: '[]' };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.examples).toEqual([]);
      });

      it('should handle undefined examples', async () => {
        const createDto = { deckId: 1, front: 'Q', back: 'A' };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = { id: 1, ...createDto, examples: null };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.examples).toBeNull();
      });

      it('should handle examples with special characters', async () => {
        const examples = [
          { sentence: 'Hello <b>World</b>', translation: '日本語 🎉' },
        ];
        const createDto = { deckId: 1, front: 'Q', back: 'A', examples };
        const mockDeck = { id: 1, languageMode: 'VN_EN' };
        const mockCard = {
          id: 1,
          ...createDto,
          examples: JSON.stringify(examples),
        };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
        mockPrismaService.card.create.mockResolvedValue(mockCard);

        const result = await provider.create(createDto);

        expect(result.examples[0].sentence).toContain('<b>');
        expect(result.examples[0].translation).toContain('🎉');
      });
    });
  });

  describe('findAll', () => {
    it('should return all cards with deck and reviews', async () => {
      const mockCards = [
        {
          id: 1,
          front: 'Q1',
          back: 'A1',
          examples: null,
          deck: { id: 1 },
          reviews: [],
        },
        {
          id: 2,
          front: 'Q2',
          back: 'A2',
          examples: null,
          deck: { id: 1 },
          reviews: [{ id: 1 }],
        },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findAll();

      expect(result).toHaveLength(2);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        include: { deck: true, reviews: true },
      });
    });

    it('should return empty array when no cards exist', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await provider.findAll();

      expect(result).toEqual([]);
    });

    it('should parse examples JSON for each card', async () => {
      const mockCards = [
        {
          id: 1,
          front: 'Q1',
          examples: JSON.stringify([{ sentence: 'Ex1', translation: 'Tr1' }]),
          deck: { id: 1 },
          reviews: [],
        },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findAll();

      expect(result[0].examples).toEqual([
        { sentence: 'Ex1', translation: 'Tr1' },
      ]);
    });

    it('should handle cards with null examples', async () => {
      const mockCards = [
        { id: 1, front: 'Q1', examples: null, deck: { id: 1 }, reviews: [] },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findAll();

      expect(result[0].examples).toBeNull();
    });

    it('should handle many cards', async () => {
      const mockCards = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        front: `Q${i + 1}`,
        back: `A${i + 1}`,
        examples: null,
        deck: { id: 1 },
        reviews: [],
      }));
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findAll();

      expect(result).toHaveLength(1000);
    });
  });

  describe('findOne', () => {
    it('should find card by id with all relations', async () => {
      const mockCard = {
        id: 1,
        front: 'Q1',
        back: 'A1',
        examples: null,
        deck: {
          id: 1,
          user: { id: 1, username: 'testuser' },
        },
        reviews: [{ id: 1, reviewedAt: new Date() }],
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await provider.findOne(1);

      expect(result).toEqual(mockCard);
      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          deck: { include: { user: true } },
          reviews: { orderBy: { reviewedAt: 'desc' } },
        },
      });
    });

    it('should return null for non-existent card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      const result = await provider.findOne(999);

      expect(result).toBeNull();
    });

    it('should handle id = 0', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      const result = await provider.findOne(0);

      expect(result).toBeNull();
    });

    it('should handle negative id', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      const result = await provider.findOne(-1);

      expect(result).toBeNull();
    });

    it('should parse examples JSON', async () => {
      const mockCard = {
        id: 1,
        front: 'Q1',
        examples: JSON.stringify([{ sentence: 'Ex', translation: 'Tr' }]),
        deck: { id: 1, user: { id: 1 } },
        reviews: [],
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await provider.findOne(1);

      expect(result?.examples).toEqual([{ sentence: 'Ex', translation: 'Tr' }]);
    });

    it('should order reviews by reviewedAt desc', async () => {
      const mockCard = {
        id: 1,
        front: 'Q1',
        examples: null,
        deck: { id: 1, user: { id: 1 } },
        reviews: [
          { id: 2, reviewedAt: new Date('2025-12-02') },
          { id: 1, reviewedAt: new Date('2025-12-01') },
        ],
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      await provider.findOne(1);

      expect(prismaService.card.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            reviews: { orderBy: { reviewedAt: 'desc' } },
          }),
        }),
      );
    });
  });

  describe('findByDeck', () => {
    it('should find all cards in deck', async () => {
      const mockCards = [
        { id: 1, deckId: 1, front: 'Q1', examples: null, reviews: [] },
        { id: 2, deckId: 1, front: 'Q2', examples: null, reviews: [] },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findByDeck(1);

      expect(result).toHaveLength(2);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
        include: {
          reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
        },
      });
    });

    it('should return empty array for deck with no cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await provider.findByDeck(999);

      expect(result).toEqual([]);
    });

    it('should return only the latest review per card', async () => {
      const mockCards = [
        {
          id: 1,
          deckId: 1,
          examples: null,
          reviews: [{ id: 2, reviewedAt: new Date('2025-12-02') }],
        },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      await provider.findByDeck(1);

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
          }),
        }),
      );
    });

    it('should parse examples JSON for each card', async () => {
      const mockCards = [
        {
          id: 1,
          deckId: 1,
          examples: JSON.stringify([{ sentence: 'Ex', translation: 'Tr' }]),
          reviews: [],
        },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findByDeck(1);

      expect(result[0].examples).toEqual([
        { sentence: 'Ex', translation: 'Tr' },
      ]);
    });
  });

  describe('update', () => {
    describe('Update individual fields', () => {
      it('should update only front', async () => {
        const updateDto = { front: 'New Question' };
        const mockUpdated = { id: 1, front: 'New Question', examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.front).toBe('New Question');
      });

      it('should update only back', async () => {
        const updateDto = { back: 'New Answer' };
        const mockUpdated = { id: 1, back: 'New Answer', examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.back).toBe('New Answer');
      });

      it('should update only tags', async () => {
        const updateDto = { tags: 'new,tags' };
        const mockUpdated = { id: 1, tags: 'new,tags', examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.tags).toBe('new,tags');
      });

      it('should update only wordType', async () => {
        const updateDto = { wordType: 'verb' };
        const mockUpdated = { id: 1, wordType: 'verb', examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.wordType).toBe('verb');
      });

      it('should update only pronunciation', async () => {
        const updateDto = { pronunciation: '/test/' };
        const mockUpdated = { id: 1, pronunciation: '/test/', examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.pronunciation).toBe('/test/');
      });

      it('should update only examples', async () => {
        const updateDto = {
          examples: [{ sentence: 'New', translation: 'Moi' }],
        };
        const mockUpdated = {
          id: 1,
          examples: JSON.stringify(updateDto.examples),
        };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.examples).toEqual(updateDto.examples);
      });
    });

    describe('Update multiple fields', () => {
      it('should update front and back together', async () => {
        const updateDto = { front: 'New Q', back: 'New A' };
        const mockUpdated = { id: 1, ...updateDto, examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.front).toBe('New Q');
        expect(result.back).toBe('New A');
      });

      it('should update all fields at once', async () => {
        const updateDto = {
          front: 'New Q',
          back: 'New A',
          tags: 'new',
          wordType: 'noun',
          pronunciation: '/n/',
          examples: [{ sentence: 'Ex', translation: 'Tr' }],
        };
        const mockUpdated = {
          id: 1,
          ...updateDto,
          examples: JSON.stringify(updateDto.examples),
        };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.front).toBe('New Q');
        expect(result.examples).toEqual(updateDto.examples);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string updates', async () => {
        const updateDto = { front: '', back: '' };
        const mockUpdated = { id: 1, front: '', back: '', examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.front).toBe('');
        expect(result.back).toBe('');
      });

      it('should throw error for non-existent card', async () => {
        mockPrismaService.card.update.mockRejectedValue(
          new Error('Record not found'),
        );

        await expect(provider.update(999, { front: 'Test' })).rejects.toThrow(
          'Record not found',
        );
      });

      it('should handle very long content updates', async () => {
        const updateDto = { front: 'A'.repeat(10000) };
        const mockUpdated = { id: 1, front: 'A'.repeat(10000), examples: null };
        mockPrismaService.card.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.front.length).toBe(10000);
      });
    });
  });

  describe('remove', () => {
    it('should delete card by id', async () => {
      const mockDeleted = { id: 1, front: 'Q', back: 'A' };
      mockPrismaService.card.delete.mockResolvedValue(mockDeleted);

      const result = await provider.remove(1);

      expect(result).toEqual(mockDeleted);
      expect(prismaService.card.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error for non-existent card', async () => {
      mockPrismaService.card.delete.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(provider.remove(999)).rejects.toThrow('Record not found');
    });
  });

  describe('getReviewStatus', () => {
    it('should return review status for reviewed card', async () => {
      const reviewedAt = new Date('2025-12-01');
      const nextReviewDate = new Date('2025-12-05');
      const mockCard = {
        id: 1,
        reviews: [{ reviewedAt, nextReviewDate }],
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await provider.getReviewStatus(1);

      expect(result).toEqual({
        cardId: 1,
        lastReviewedAt: reviewedAt,
        nextReviewDate: nextReviewDate,
        hasBeenReviewed: true,
      });
    });

    it('should return status for never-reviewed card', async () => {
      const mockCard = { id: 1, reviews: [] };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await provider.getReviewStatus(1);

      expect(result).toEqual({
        cardId: 1,
        lastReviewedAt: null,
        nextReviewDate: null,
        hasBeenReviewed: false,
      });
    });

    it('should throw error for non-existent card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(provider.getReviewStatus(999)).rejects.toThrow(
        'Card not found',
      );
    });

    it('should return latest review only', async () => {
      const latestReview = {
        reviewedAt: new Date('2025-12-02'),
        nextReviewDate: new Date('2025-12-10'),
      };
      const mockCard = {
        id: 1,
        reviews: [latestReview], // Already ordered by desc
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await provider.getReviewStatus(1);

      expect(result.lastReviewedAt).toEqual(latestReview.reviewedAt);
      expect(result.nextReviewDate).toEqual(latestReview.nextReviewDate);
    });

    it('should call findUnique with correct query', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue({
        id: 1,
        reviews: [],
      });

      await provider.getReviewStatus(1);

      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
        },
      });
    });
  });
});
