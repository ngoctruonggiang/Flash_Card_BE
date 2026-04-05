/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeckController } from 'src/controllers/deck/deck.controller';
import { DeckService } from 'src/services/deck/deck.service';
import { CardService } from 'src/services/card/card.service';
import { NotFoundException } from '@nestjs/common';

describe('DeckController - Comprehensive Tests', () => {
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

  describe('create', () => {
    it('should create a new deck', () => {
      const createDto = { name: 'New Deck', description: 'Description' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      const result = controller.create(mockUser as any, createDto as any);

      expect(result).resolves.toHaveProperty('id');
      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('should create deck with languageMode', () => {
      const createDto = {
        name: 'Language Deck',
        description: 'For learning',
        languageMode: 'BIDIRECTIONAL',
      };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('should create deck without description', () => {
      const createDto = { name: 'Simple Deck' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('should handle unicode in deck name', () => {
      const createDto = { name: 'Bộ thẻ Tiếng Việt', description: 'Mô tả' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      controller.create(mockUser as any, createDto as any);

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
    it('should find all decks by user id', () => {
      const decks = [mockDeck, { ...mockDeck, id: 2, name: 'Deck 2' }];
      mockDeckService.findByUser.mockResolvedValue(decks);

      const result = controller.findAllByUser(1);

      expect(result).resolves.toEqual(decks);
      expect(deckService.findByUser).toHaveBeenCalledWith(1);
    });

    it('should find all decks when no userId provided', () => {
      const allDecks = [mockDeck, { ...mockDeck, id: 2, userId: 2 }];
      mockDeckService.findAll.mockResolvedValue(allDecks);

      const result = controller.findAllByUser(undefined);

      expect(result).resolves.toEqual(allDecks);
      expect(deckService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when user has no decks', () => {
      mockDeckService.findByUser.mockResolvedValue([]);

      const result = controller.findAllByUser(999);

      expect(result).resolves.toEqual([]);
    });
  });

  describe('findAllCurrentUser', () => {
    it('should find all decks for current user', () => {
      const decks = [mockDeck];
      mockDeckService.findByUser.mockResolvedValue(decks);

      const result = controller.findAllCurrentUser(mockUser as any);

      expect(result).resolves.toEqual(decks);
      expect(deckService.findByUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when user has no decks', () => {
      mockDeckService.findByUser.mockResolvedValue([]);

      const result = controller.findAllCurrentUser(mockUser as any);

      expect(result).resolves.toEqual([]);
    });

    it('should call findByUser with correct user id', () => {
      const user = { ...mockUser, id: 42 };
      mockDeckService.findByUser.mockResolvedValue([]);

      controller.findAllCurrentUser(user as any);

      expect(deckService.findByUser).toHaveBeenCalledWith(42);
    });
  });

  describe('findOne', () => {
    it('should find deck by id', () => {
      mockDeckService.findOne.mockResolvedValue(mockDeck);

      const result = controller.findOne({ id: 1 });

      expect(result).resolves.toEqual(mockDeck);
      expect(deckService.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.findOne.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.findOne({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle different deck ids', () => {
      const deck = { ...mockDeck, id: 100 };
      mockDeckService.findOne.mockResolvedValue(deck);

      const result = controller.findOne({ id: 100 });

      expect(result).resolves.toEqual(deck);
      expect(deckService.findOne).toHaveBeenCalledWith(100);
    });
  });

  describe('update', () => {
    it('should update deck name', () => {
      const updateDto = { name: 'Updated Name' };
      const updatedDeck = { ...mockDeck, name: 'Updated Name' };
      mockDeckService.update.mockResolvedValue(updatedDeck);

      const result = controller.update({ id: 1 }, updateDto as any);

      expect(result).resolves.toEqual(updatedDeck);
      expect(deckService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update deck description', () => {
      const updateDto = { description: 'New description' };
      mockDeckService.update.mockResolvedValue({
        ...mockDeck,
        description: 'New description',
      });

      controller.update({ id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update languageMode', () => {
      const updateDto = { languageMode: 'EN_VN' };
      mockDeckService.update.mockResolvedValue({
        ...mockDeck,
        languageMode: 'EN_VN',
      });

      controller.update({ id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update multiple fields', () => {
      const updateDto = {
        name: 'New Name',
        description: 'New Desc',
        languageMode: 'BIDIRECTIONAL',
      };
      mockDeckService.update.mockResolvedValue({ ...mockDeck, ...updateDto });

      controller.update({ id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should handle empty update dto', () => {
      const updateDto = {};
      mockDeckService.update.mockResolvedValue(mockDeck);

      controller.update({ id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.update.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.update({ id: 999 }, { name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove deck by id', () => {
      mockDeckService.remove.mockResolvedValue({ deleted: true });

      const result = controller.remove({ id: 1 });

      expect(result).resolves.toEqual({ deleted: true });
      expect(deckService.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException', async () => {
      mockDeckService.remove.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.remove({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle different deck ids', () => {
      mockDeckService.remove.mockResolvedValue({ deleted: true });

      controller.remove({ id: 42 });

      expect(deckService.remove).toHaveBeenCalledWith(42);
    });
  });

  describe('getReviewedCountInDay', () => {
    it('should get reviewed count for today', () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(10);

      const result = controller.getReviewedCountInDay({ id: 1 });

      expect(result).resolves.toBe(10);
      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalled();
    });

    it('should get reviewed count for specific date', () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(5);

      controller.getReviewedCountInDay({ id: 1 }, '2025-01-15');

      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalledWith(
        1,
        expect.any(Date),
      );
    });

    it('should return 0 when no reviews', () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(0);

      const result = controller.getReviewedCountInDay({ id: 1 });

      expect(result).resolves.toBe(0);
    });

    it('should handle invalid date string', () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(0);

      controller.getReviewedCountInDay({ id: 1 }, 'invalid-date');

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

  describe('getDeckStatistics', () => {
    it('should get deck statistics', async () => {
      const stats = {
        totalCards: 100,
        newCards: 20,
        learningCards: 30,
        reviewCards: 50,
        correctPercentage: 85.5,
      };
      mockDeckService.getDeckStatistics.mockResolvedValue(stats);

      const result = await controller.getDeckStatistics({ id: 1 });

      expect(result).toEqual(stats);
      expect(deckService.getDeckStatistics).toHaveBeenCalledWith(1);
    });

    it('should return zero stats for empty deck', async () => {
      const stats = {
        totalCards: 0,
        newCards: 0,
        learningCards: 0,
        reviewCards: 0,
        correctPercentage: 0,
      };
      mockDeckService.getDeckStatistics.mockResolvedValue(stats);

      const result = await controller.getDeckStatistics({ id: 1 });

      expect(result.totalCards).toBe(0);
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
      const lastStudied = { lastStudiedAt: new Date('2025-01-15') };
      mockDeckService.getLastStudiedDate.mockResolvedValue(lastStudied);

      const result = await controller.getLastStudiedDate({ id: 1 });

      expect(result).toEqual(lastStudied);
      expect(deckService.getLastStudiedDate).toHaveBeenCalledWith(1);
    });

    it('should return null when never studied', async () => {
      mockDeckService.getLastStudiedDate.mockResolvedValue({
        lastStudiedAt: null,
      });

      const result = await controller.getLastStudiedDate({ id: 1 });

      expect(result.lastStudiedAt).toBeNull();
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
