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
    it('TC-001: should create deck when valid name and description provided, returns deck with id', async () => {
      const createDto = { name: 'New Deck', description: 'Description' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      const result = await controller.create(mockUser as any, createDto as any);

      expect(result).toHaveProperty('id');
      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('TC-002: should create deck when languageMode is BIDIRECTIONAL, returns deck with languageMode', async () => {
      const createDto = {
        name: 'Language Deck',
        description: 'For learning',
        languageMode: 'BIDIRECTIONAL',
      };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('TC-003: should create deck when description is omitted, returns deck without description', async () => {
      const createDto = { name: 'Simple Deck' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('TC-004: should create deck when name contains unicode characters, returns deck with unicode name', async () => {
      const createDto = { name: 'Bộ thẻ Tiếng Việt', description: 'Mô tả' };
      mockDeckService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(deckService.create).toHaveBeenCalledWith(mockUser.id, createDto);
    });

    it('TC-005: should throw error when service fails, returns error message', async () => {
      const createDto = { name: 'Error Deck' };
      mockDeckService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(
        controller.create(mockUser as any, createDto as any),
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('findAllByUser (Admin)', () => {
    it('TC-006: should return decks when valid userId provided, returns array of decks', async () => {
      const decks = [mockDeck, { ...mockDeck, id: 2, name: 'Deck 2' }];
      mockDeckService.findByUser.mockResolvedValue(decks);

      const result = await controller.findAllByUser(1);

      expect(result).toEqual(decks);
      expect(deckService.findByUser).toHaveBeenCalledWith(1);
    });

    it('TC-007: should return all decks when userId is undefined, returns all decks', async () => {
      const allDecks = [mockDeck, { ...mockDeck, id: 2, userId: 2 }];
      mockDeckService.findAll.mockResolvedValue(allDecks);

      const result = await controller.findAllByUser(undefined);

      expect(result).toEqual(allDecks);
      expect(deckService.findAll).toHaveBeenCalled();
    });

    it('TC-008: should return empty array when user has no decks, returns empty array', async () => {
      mockDeckService.findByUser.mockResolvedValue([]);

      const result = await controller.findAllByUser(999);

      expect(result).toEqual([]);
    });
  });

  describe('UC-07: View Deck Library', () => {
    it('TC-009: should return decks when current user has decks, returns array of user decks', async () => {
      const decks = [mockDeck];
      mockDeckService.findByUser.mockResolvedValue(decks);

      const result = await controller.findAllCurrentUser(mockUser as any);

      expect(result).toEqual(decks);
      expect(deckService.findByUser).toHaveBeenCalledWith(mockUser.id);
    });

    it('TC-010: should return empty array when current user has no decks, returns empty array', async () => {
      mockDeckService.findByUser.mockResolvedValue([]);

      const result = await controller.findAllCurrentUser(mockUser as any);

      expect(result).toEqual([]);
    });

    it('TC-011: should call findByUser when user id is 42, returns decks for user 42', async () => {
      const user = { ...mockUser, id: 42 };
      mockDeckService.findByUser.mockResolvedValue([]);

      await controller.findAllCurrentUser(user as any);

      expect(deckService.findByUser).toHaveBeenCalledWith(42);
    });
  });

  describe('findOne', () => {
    it('TC-012: should return deck when valid id provided, returns deck object', async () => {
      mockDeckService.findOne.mockResolvedValue(mockDeck);

      const result = await controller.findOne(mockUser as any, { id: 1 });

      expect(result).toEqual(mockDeck);
      expect(deckService.findOne).toHaveBeenCalledWith(1, mockUser.id);
    });

    it('TC-013: should throw NotFoundException when deck id does not exist, returns 404 error', async () => {
      mockDeckService.findOne.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.findOne(mockUser as any, { id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-014: should return deck when id is 100, returns deck with id 100', async () => {
      const deck = { ...mockDeck, id: 100 };
      mockDeckService.findOne.mockResolvedValue(deck);

      const result = await controller.findOne(mockUser as any, { id: 100 });

      expect(result).toEqual(deck);
      expect(deckService.findOne).toHaveBeenCalledWith(100, mockUser.id);
    });
  });

  describe('UC-09: Edit Deck', () => {
    it('TC-015: should update deck when new name provided, returns deck with updated name', async () => {
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

    it('TC-016: should update deck when new description provided, returns deck with updated description', async () => {
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

    it('TC-017: should update deck when languageMode is EN_VN, returns deck with updated languageMode', async () => {
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

    it('TC-018: should update deck when multiple fields provided, returns deck with all fields updated', async () => {
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

    it('TC-019: should update deck when empty dto provided, returns unchanged deck', async () => {
      const updateDto = {};
      mockDeckService.update.mockResolvedValue(mockDeck);

      await controller.update(mockUser as any, { id: 1 }, updateDto as any);

      expect(deckService.update).toHaveBeenCalledWith(
        1,
        updateDto,
        mockUser.id,
      );
    });

    it('TC-020: should throw NotFoundException when deck id does not exist, returns 404 error', async () => {
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
    it('TC-021: should delete deck when valid id provided, returns deleted confirmation', async () => {
      mockDeckService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(mockUser as any, { id: 1 });

      expect(result).toEqual({ deleted: true });
      expect(deckService.remove).toHaveBeenCalledWith(1, mockUser.id);
    });

    it('TC-022: should throw NotFoundException when deck id does not exist, returns 404 error', async () => {
      mockDeckService.remove.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.remove(mockUser as any, { id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-023: should delete deck when id is 42, returns deleted confirmation', async () => {
      mockDeckService.remove.mockResolvedValue({ deleted: true });

      await controller.remove(mockUser as any, { id: 42 });

      expect(deckService.remove).toHaveBeenCalledWith(42, mockUser.id);
    });
  });

  describe('getReviewedCountInDay', () => {
    it('TC-024: should return count when no date specified, returns today reviewed count', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(10);

      const result = await controller.getReviewedCountInDay({ id: 1 });

      expect(result).toBe(10);
      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalled();
    });

    it('TC-025: should return count when specific date provided, returns reviewed count for that date', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(5);

      await controller.getReviewedCountInDay({ id: 1 }, '2025-01-15');

      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalledWith(
        1,
        expect.any(Date),
      );
    });

    it('TC-026: should return 0 when no reviews exist, returns zero count', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(0);

      const result = await controller.getReviewedCountInDay({ id: 1 });

      expect(result).toBe(0);
    });

    it('TC-027: should handle invalid date string, returns count without error', async () => {
      mockDeckService.getReviewedCardsCountInDay.mockResolvedValue(0);

      await controller.getReviewedCountInDay({ id: 1 }, 'invalid-date');

      expect(deckService.getReviewedCardsCountInDay).toHaveBeenCalled();
    });
  });

  describe('getCardsDueToday', () => {
    it('TC-028: should return cards when cards are due today, returns array of due cards', async () => {
      const dueCards = [
        { id: 1, front: 'Card 1' },
        { id: 2, front: 'Card 2' },
      ];
      mockDeckService.getCardsDueToday.mockResolvedValue(dueCards);

      const result = await controller.getCardsDueToday({ id: 1 });

      expect(result).toEqual(dueCards);
      expect(deckService.getCardsDueToday).toHaveBeenCalledWith(1);
    });

    it('TC-029: should return empty array when no cards are due, returns empty array', async () => {
      mockDeckService.getCardsDueToday.mockResolvedValue([]);

      const result = await controller.getCardsDueToday({ id: 1 });

      expect(result).toEqual([]);
    });

    it('TC-030: should throw NotFoundException when deck id does not exist, returns 404 error', async () => {
      mockDeckService.getCardsDueToday.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getCardsDueToday({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UC-11: View Deck Statistics', () => {
    it('TC-031: should return statistics when deck has reviews, returns complete stats object', async () => {
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

    it('TC-032: should return zero stats when deck has no reviews, returns stats with all zeros', async () => {
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

    it('TC-033: should throw NotFoundException when deck id does not exist, returns 404 error', async () => {
      mockDeckService.getDeckStatistics.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getDeckStatistics({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLastStudiedDate', () => {
    it('TC-034: should return date when deck has been studied, returns last studied date', async () => {
      const lastStudied = { lastStudied: new Date('2025-01-15') };
      mockDeckService.getLastStudiedDate.mockResolvedValue(lastStudied);

      const result = await controller.getLastStudiedDate({ id: 1 });

      expect(result).toEqual(lastStudied);
      expect(deckService.getLastStudiedDate).toHaveBeenCalledWith(1);
    });

    it('TC-035: should return null when deck has never been studied, returns null lastStudied', async () => {
      mockDeckService.getLastStudiedDate.mockResolvedValue({
        lastStudied: null,
      });

      const result = await controller.getLastStudiedDate({ id: 1 });

      expect(result.lastStudied).toBeNull();
    });

    it('TC-036: should throw NotFoundException when deck id does not exist, returns 404 error', async () => {
      mockDeckService.getLastStudiedDate.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getLastStudiedDate({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Controller instantiation', () => {
    it('TC-037: should be defined when module is compiled, returns defined controller', () => {
      expect(controller).toBeDefined();
    });

    it('TC-038: should have deckService injected when module is compiled, returns defined service', () => {
      expect(deckService).toBeDefined();
    });
  });
});
