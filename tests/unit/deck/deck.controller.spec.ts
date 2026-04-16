/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeckController } from 'src/controllers/deck/deck.controller';
import { DeckService } from 'src/services/deck/deck.service';
import { CardService } from 'src/services/card/card.service';
import { NotFoundException } from '@nestjs/common';

describe('DeckController Tests', () => {
  let controller: DeckController;
  let deckService: DeckService;

  const mockDeckService = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getReviewedCardsCountInDay: jest.fn(),
    getCardsDueToday: jest.fn(),
    getDeckStatistics: jest.fn(),
    getLastStudiedDate: jest.fn(),
  };

  const mockCardService = {
    findByDeck: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockDeck = {
    id: 1,
    name: 'Test Deck',
    description: 'Test Description',
    userId: 1,
    languageMode: 'VN_EN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeckController],
      providers: [
        { provide: DeckService, useValue: mockDeckService },
        { provide: CardService, useValue: mockCardService },
      ],
    }).compile();

    controller = module.get<DeckController>(DeckController);
    deckService = module.get<DeckService>(DeckService);
  });

  describe('UC-08: Create Deck', () => {
    it('should create a new deck', async () => {
      const createDto = { name: 'New Deck', description: 'Description' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      const result = await controller.create(mockUser as any, createDto as any);

      expect(result).toHaveProperty('id');
      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('should create deck with languageMode', async () => {
      const createDto = {
        name: 'Language Deck',
        description: 'For learning',
        languageMode: 'BIDIRECTIONAL',
      };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('should create deck without description', async () => {
      const createDto = { name: 'Simple Deck' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('should handle unicode in deck name', async () => {
      const createDto = { name: 'Bộ thẻ Tiếng Việt', description: 'Mô tả' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('should propagate service errors', async () => {
      const createDto = { name: 'Error Deck' };
      mockDeckService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(
        controller.create(mockUser as any, createDto as any),
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('findAllByUser (Admin)', () => {
    it('should find all decks by user id', async () => {
      const decks = [mockDeck, { ...mockDeck, id: 2, name: 'Deck 2' }];
      mockDeckService.findByUser.mockResolvedValue(decks);

      const result = await controller.findAllByUser(1);

      expect(result).toEqual(decks);
      expect(deckService.findByUser).toHaveBeenCalledWith(1);
    });

    it('should find all decks when no userId provided', async () => {
      const allDecks = [mockDeck, { ...mockDeck, id: 2, userId: 2 }];
      mockDeckService.findAll.mockResolvedValue(allDecks);

      const result = await controller.findAllByUser(undefined);

      expect(result).toEqual(allDecks);
      expect(deckService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when user has no decks', async () => {
      mockDeckService.findByUser.mockResolvedValue([]);

      const result = await controller.findAllByUser(999);

      expect(result).toEqual([]);
    });
  });

  describe('UC-07: View Deck Library', () => {
    it('should find all decks for current user', async () => {
      const decks = [mockDeck];
      mockDeckService.findByUser.mockResolvedValue(decks);

      const result = await controller.findAllCurrentUser(mockUser as any);

      expect(result).toEqual(decks);
      expect(deckService.findByUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when user has no decks', async () => {
      mockDeckService.findByUser.mockResolvedValue([]);

      const result = await controller.findAllCurrentUser(mockUser as any);

      expect(result).toEqual([]);
    });

    it('should call findByUser with correct user id', async () => {
      const user = { ...mockUser, id: 42 };
      mockDeckService.findByUser.mockResolvedValue([]);

      await controller.findAllCurrentUser(user as any);

      expect(deckService.findByUser).toHaveBeenCalledWith(42);
    });
  });

  describe('findOne', () => {
    it('should find deck by id', async () => {
      mockDeckService.findOne.mockResolvedValue(mockDeck);

      const result = await controller.findOne(mockUser as any, { id: 1 });

      expect(result).toEqual(mockDeck);
      expect(deckService.findOne).toHaveBeenCalledWith(1, mockUser.id);
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.findOne.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.findOne(mockUser as any, { id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle different deck ids', async () => {
      const deck = { ...mockDeck, id: 100 };
      mockDeckService.findOne.mockResolvedValue(deck);

      const result = await controller.findOne(mockUser as any, { id: 100 });

      expect(result).toEqual(deck);
      expect(deckService.findOne).toHaveBeenCalledWith(100, mockUser.id);
    });
  });

  describe('UC-09: Edit Deck', () => {
    it('should update deck name', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedDeck = { ...mockDeck, name: 'Updated Name' };
      mockDeckService.update.mockResolvedValue(updatedDeck);

      const result = await controller.update(
        mockUser as any,
        { id: 1 },
        updateDto as any,
      );

      expect(result).toEqual(updatedDeck);
      expect(deckService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockUser.id,
      );
    });

    it('should update deck description', async () => {
      const updateDto = { description: 'New description' };
      mockDeckService.update.mockResolvedValue({
        ...mockDeck,
        description: 'New description',
      });

      await controller.update(mockUser as any, { id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockUser.id,
      );
    });

    it('should update languageMode', async () => {
      const updateDto = { languageMode: 'EN_VN' };
      mockDeckService.update.mockResolvedValue({
        ...mockDeck,
        languageMode: 'EN_VN',
      });

      await controller.update(mockUser as any, { id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockUser.id,
      );
    });

    it('should update multiple fields', async () => {
      const updateDto = {
        name: 'New Name',
        description: 'New Desc',
        languageMode: 'BIDIRECTIONAL',
      };
      mockDeckService.update.mockResolvedValue({ ...mockDeck, ...updateDto });

      await controller.update(mockUser as any, { id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockUser.id,
      );
    });

    it('should handle empty update dto', async () => {
      const updateDto = {};
      mockDeckService.update.mockResolvedValue(mockDeck);

      await controller.update(mockUser as any, { id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockUser.id,
      );
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.update.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.update(mockUser as any, { id: 999 }, {
          name: 'Test',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('UC-10: Delete Deck', () => {
    it('should remove deck by id', async () => {
      mockDeckService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(mockUser as any, { id: 1 });

      expect(result).toEqual({ deleted: true });
      expect(deckService.remove).toHaveBeenCalledWith(1, mockUser.id);
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.remove.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.remove(mockUser as any, { id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle different deck ids', async () => {
      mockDeckService.remove.mockResolvedValue({ deleted: true });

      await controller.remove(mockUser as any, { id: 42 });

      expect(deckService.remove).toHaveBeenCalledWith(42, mockUser.id);
    });
  });

  describe('getReviewedCountInDay', () => {
    it('should get reviewed count for today', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(10);

      const result = await controller.getReviewedCountInDay({ id: 1 });

      expect(result).toBe(10);
      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalled();
    });

    it('should get reviewed count for specific date', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(5);

      await controller.getReviewedCountInDay({ id: 1 }, '2025-01-15');

      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalledWith(
        1,
        expect.any(Date),
      );
    });

    it('should return 0 when no reviews', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(0);

      const result = await controller.getReviewedCountInDay({ id: 1 });

      expect(result).toBe(0);
    });

    it('should handle invalid date string', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(0);

      await controller.getReviewedCountInDay({ id: 1 }, 'invalid-date');

      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalled();
    });
  });

  describe('getCardsDueToday', () => {
    it('should get cards due today', async () => {
      const dueCards = [
        { id: 1, front: 'Card 1' },
        { id: 2, front: 'Card 2' },
      ];
      mockDeckService.getCardsDueToday.mockResolvedValue(dueCards);

      const result = await controller.getCardsDueToday({ id: 1 });

      expect(result).toEqual(dueCards);
      expect(deckService.getCardsDueToday).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no cards due', async () => {
      mockDeckService.getCardsDueToday.mockResolvedValue([]);

      const result = await controller.getCardsDueToday({ id: 1 });

      expect(result).toEqual([]);
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.getCardsDueToday.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getCardsDueToday({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UC-11: View Deck Statistics', () => {
    it('should get deck statistics', async () => {
      const stats = {
        totalReviews: 100,
        correctReviews: 85,
        correctPercentage: 85.0,
        againCount: 15,
        hardCount: 20,
        goodCount: 50,
        easyCount: 15,
      };
      mockDeckService.getDeckStatistics.mockResolvedValue(stats);

      const result = await controller.getDeckStatistics({ id: 1 });

      expect(result).toEqual(stats);
      expect(deckService.getDeckStatistics).toHaveBeenCalledWith(1);
    });

    it('should return zero stats for empty deck', async () => {
      const stats = {
        totalReviews: 0,
        correctReviews: 0,
        correctPercentage: 0,
        againCount: 0,
        hardCount: 0,
        goodCount: 0,
        easyCount: 0,
      };
      mockDeckService.getDeckStatistics.mockResolvedValue(stats);

      const result = await controller.getDeckStatistics({ id: 1 });

      expect(result.totalReviews).toBe(0);
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.getDeckStatistics.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getDeckStatistics({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLastStudiedDate', () => {
    it('should get last studied date', async () => {
      const lastStudied = { lastStudied: new Date('2025-01-15') };
      mockDeckService.getLastStudiedDate.mockResolvedValue(lastStudied);

      const result = await controller.getLastStudiedDate({ id: 1 });

      expect(result).toEqual(lastStudied);
      expect(deckService.getLastStudiedDate).toHaveBeenCalledWith(1);
    });

    it('should return null when never studied', async () => {
      mockDeckService.getLastStudiedDate.mockResolvedValue({
        lastStudied: null,
      });

      const result = await controller.getLastStudiedDate({ id: 1 });

      expect(result.lastStudied).toBeNull();
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.getLastStudiedDate.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getLastStudiedDate({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have deckService injected', () => {
      expect(deckService).toBeDefined();
    });
  });
});
