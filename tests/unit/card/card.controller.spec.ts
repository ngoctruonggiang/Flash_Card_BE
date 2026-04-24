/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CardController } from 'src/controllers/card/card.controller';
import { CardService } from 'src/services/card/card.service';
import { NotFoundException } from '@nestjs/common';
import {
  createMockCardService,
  createMockUser,
  createMockCard,
} from '../__helpers__';

describe('CardController Tests', () => {
  let controller: CardController;
  let cardService: CardService;

  const mockCardService = createMockCardService();

  const mockUser = createMockUser();

  const mockCard = createMockCard({
    examples: ['Hello, how are you?'],
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardController],
      providers: [{ provide: CardService, useValue: mockCardService }],
    }).compile();

    controller = module.get<CardController>(CardController);
    cardService = module.get<CardService>(CardService);
  });

  describe('UC-14: Add Card', () => {
    it('TC-ADDCARD-001: This test case aims to verify successful card creation with minimum required fields', async () => {
      const createDto = {
        deckId: 1,
        front: 'Hello',
        back: 'Xin chào',
      };
      mockCardService.create.mockResolvedValue({ id: 1, ...createDto });

      const result = await controller.create(mockUser as any, createDto as any);

      expect(result).toHaveProperty('id');
      expect(cardService.create).toHaveBeenCalledWith({
        deckId: 1,
        front: 'Hello',
        back: 'Xin chào',
        tags: undefined,
        wordType: undefined,
        pronunciation: undefined,
        examples: undefined,
        userId: mockUser.id,
      });
    });

    it('TC-ADDCARD-002: This test case aims to verify card creation with all optional fields', async () => {
      const createDto = {
        deckId: 1,
        front: 'Hello',
        back: 'Xin chào',
        tags: ['greeting', 'basic'],
        wordType: 'interjection',
        pronunciation: '/həˈloʊ/',
        examples: ['Hello, world!', 'Hello there!'],
      };
      mockCardService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(cardService.create).toHaveBeenCalledWith({
        ...createDto,
        userId: mockUser.id,
      });
    });

    it('TC-ADDCARD-003: This test case aims to verify card creation with empty examples array', async () => {
      const createDto = {
        deckId: 1,
        front: 'Test',
        back: 'Kiểm tra',
        examples: [],
      };
      mockCardService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(cardService.create).toHaveBeenCalledWith({
        deckId: 1,
        front: 'Test',
        back: 'Kiểm tra',
        tags: undefined,
        wordType: undefined,
        pronunciation: undefined,
        examples: [],
        userId: mockUser.id,
      });
    });

    it('TC-ADDCARD-004: This test case aims to verify card creation with unicode content', async () => {
      const createDto = {
        deckId: 1,
        front: 'Xin chào',
        back: 'Hello',
        pronunciation: '/sin tʃào/',
      };
      mockCardService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(cardService.create).toHaveBeenCalled();
    });

    it('TC-ADDCARD-005: This test case aims to verify card creation with very long content', async () => {
      const longText = 'A'.repeat(5000);
      const createDto = {
        deckId: 1,
        front: longText,
        back: longText,
      };
      mockCardService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(cardService.create).toHaveBeenCalled();
    });

    it('TC-ADDCARD-006: This test case aims to verify service error propagation during card creation', async () => {
      const createDto = { deckId: 999, front: 'Test', back: 'Test' };
      mockCardService.create.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.create(mockUser as any, createDto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-ADDCARD-007: This test case aims to verify card creation with multiple tags', async () => {
      const createDto = {
        deckId: 1,
        front: 'Test',
        back: 'Test',
        tags: ['tag1', 'tag2', 'tag3', 'tag4'],
      };
      mockCardService.create.mockResolvedValue({ id: 1, ...createDto });

      await controller.create(mockUser as any, createDto as any);

      expect(cardService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['tag1', 'tag2', 'tag3', 'tag4'] }),
      );
    });
  });

  describe('UC-13: Browse Deck Cards', () => {
    it('TC-BROWSECARDS-001: This test case aims to verify retrieval of all cards', async () => {
      const cards = [mockCard, { ...mockCard, id: 2 }];
      mockCardService.findAll.mockResolvedValue(cards);

      const result = await controller.findAll();

      expect(result).toEqual(cards);
      expect(cardService.findAll).toHaveBeenCalled();
    });

    it('TC-BROWSECARDS-002: This test case aims to verify retrieval of cards filtered by deck id', async () => {
      const cards = [mockCard];
      mockCardService.findByDeck.mockResolvedValue(cards);

      const result = await controller.findAll(1);

      expect(result).toEqual(cards);
      expect(cardService.findByDeck).toHaveBeenCalledWith(1);
    });

    it('TC-BROWSECARDS-003: This test case aims to verify empty array is returned when no cards exist', async () => {
      mockCardService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('TC-BROWSECARDS-004: This test case aims to verify empty array is returned when deck has no cards', async () => {
      mockCardService.findByDeck.mockResolvedValue([]);

      const result = await controller.findAll(999);

      expect(result).toEqual([]);
    });

    it('TC-BROWSECARDS-005: This test case aims to verify findAll is called when deckId is undefined', async () => {
      mockCardService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined);

      expect(cardService.findAll).toHaveBeenCalled();
      expect(cardService.findByDeck).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find card by id', async () => {
      mockCardService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne({ id: 1 });

      expect(result).toEqual(mockCard);
      expect(cardService.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException', async () => {
      mockCardService.findOne.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.findOne({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle different card ids', async () => {
      const card = { ...mockCard, id: 100 };
      mockCardService.findOne.mockResolvedValue(card);

      const result = await controller.findOne({ id: 100 });

      expect(result).toEqual(card);
      expect(cardService.findOne).toHaveBeenCalledWith(100);
    });

    it('should return card with all fields', async () => {
      mockCardService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne({ id: 1 });

      expect(result).toHaveProperty('front');
      expect(result).toHaveProperty('back');
      expect(result).toHaveProperty('deckId');
      expect(result).toHaveProperty('status');
    });
  });

  describe('UC-15: Edit Card', () => {
    it('TC-EDITCARD-001: This test case aims to verify successful card front text update', async () => {
      const updateDto = { front: 'Updated Front' };
      const updatedCard = { ...mockCard, front: 'Updated Front' };
      mockCardService.update.mockResolvedValue(updatedCard);

      const result = await controller.update({ id: 1 }, updateDto as any);

      expect(result.front).toBe('Updated Front');
      expect(cardService.update).toHaveBeenCalledWith(1, {
        front: 'Updated Front',
        back: undefined,
        tags: undefined,
        wordType: undefined,
        pronunciation: undefined,
        examples: undefined,
      });
    });

    it('TC-EDITCARD-002: This test case aims to verify successful card back text update', async () => {
      const updateDto = { back: 'Updated Back' };
      mockCardService.update.mockResolvedValue({
        ...mockCard,
        back: 'Updated Back',
      });

      await controller.update({ id: 1 }, updateDto as any);

      expect(cardService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ back: 'Updated Back' }),
      );
    });

    it('TC-EDITCARD-003: This test case aims to verify updating multiple card fields simultaneously', async () => {
      const updateDto = {
        front: 'New Front',
        back: 'New Back',
        tags: ['new-tag'],
      };
      mockCardService.update.mockResolvedValue({ ...mockCard, ...updateDto });

      await controller.update({ id: 1 }, updateDto as any);

      expect(cardService.update).toHaveBeenCalledWith(1, {
        front: 'New Front',
        back: 'New Back',
        tags: ['new-tag'],
        wordType: undefined,
        pronunciation: undefined,
        examples: undefined,
      });
    });

    it('TC-EDITCARD-004: This test case aims to verify successful card pronunciation update', async () => {
      const updateDto = { pronunciation: '/njuː/' };
      mockCardService.update.mockResolvedValue({
        ...mockCard,
        pronunciation: '/njuː/',
      });

      await controller.update({ id: 1 }, updateDto as any);

      expect(cardService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ pronunciation: '/njuː/' }),
      );
    });

    it('TC-EDITCARD-005: This test case aims to verify successful card examples update', async () => {
      const updateDto = { examples: ['New example 1', 'New example 2'] };
      mockCardService.update.mockResolvedValue({
        ...mockCard,
        examples: updateDto.examples,
      });

      await controller.update({ id: 1 }, updateDto as any);

      expect(cardService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          examples: ['New example 1', 'New example 2'],
        }),
      );
    });

    it('TC-EDITCARD-006: This test case aims to verify successful card wordType update', async () => {
      const updateDto = { wordType: 'verb' };
      mockCardService.update.mockResolvedValue({
        ...mockCard,
        wordType: 'verb',
      });

      await controller.update({ id: 1 }, updateDto as any);

      expect(cardService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ wordType: 'verb' }),
      );
    });

    it('TC-EDITCARD-007: This test case aims to verify handling of empty update data object', async () => {
      const updateDto = {};
      mockCardService.update.mockResolvedValue(mockCard);

      await controller.update({ id: 1 }, updateDto as any);

      expect(cardService.update).toHaveBeenCalledWith(1, {
        front: undefined,
        back: undefined,
        tags: undefined,
        wordType: undefined,
        pronunciation: undefined,
        examples: undefined,
      });
    });

    it('TC-EDITCARD-008: This test case aims to verify NotFoundException for non-existent card', async () => {
      mockCardService.update.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(
        controller.update({ id: 999 }, { front: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-EDITCARD-009: This test case aims to verify card update with unicode content', async () => {
      const updateDto = { front: 'Tiếng Việt', back: 'Vietnamese' };
      mockCardService.update.mockResolvedValue({
        ...mockCard,
        ...updateDto,
      });

      await controller.update({ id: 1 }, updateDto as any);

      expect(cardService.update).toHaveBeenCalled();
    });
  });

  describe('UC-16: Delete Card', () => {
    it('TC-DELETECARD-001: This test case aims to verify successful card deletion by id', async () => {
      mockCardService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove({ id: 1 });

      expect(result).toEqual({ deleted: true });
      expect(cardService.remove).toHaveBeenCalledWith(1);
    });

    it('TC-DELETECARD-002: This test case aims to verify NotFoundException when deleting non-existent card', async () => {
      mockCardService.remove.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.remove({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-DELETECARD-003: This test case aims to verify card deletion with various card ids', async () => {
      mockCardService.remove.mockResolvedValue({ deleted: true });

      await controller.remove({ id: 42 });

      expect(cardService.remove).toHaveBeenCalledWith(42);
    });
  });

  describe('UC-17: View Card Statistics', () => {
    it('TC-CARDSTATS-001: This test case aims to verify retrieval of review status for card', async () => {
      const status = {
        cardId: 1,
        lastReviewedAt: new Date('2025-01-14'),
        nextReviewDate: new Date('2025-01-21'),
        hasBeenReviewed: true,
      };
      mockCardService.getReviewStatus.mockResolvedValue(status);

      const result = await controller.getReviewStatus({ id: 1 });

      expect(result).toEqual(status);
      expect(cardService.getReviewStatus).toHaveBeenCalledWith(1);
    });

    it('TC-CARDSTATS-002: This test case aims to verify null dates are returned for new unreviewed card', async () => {
      const status = {
        cardId: 1,
        lastReviewedAt: null,
        nextReviewDate: null,
        hasBeenReviewed: false,
      };
      mockCardService.getReviewStatus.mockResolvedValue(status);

      const result = await controller.getReviewStatus({ id: 1 });

      expect(result.lastReviewedAt).toBeNull();
      expect(result.hasBeenReviewed).toBe(false);
    });

    it('TC-CARDSTATS-003: This test case aims to verify NotFoundException for statistics of non-existent card', async () => {
      mockCardService.getReviewStatus.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.getReviewStatus({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-CARDSTATS-004: This test case aims to verify hasBeenReviewed flag for reviewed card', async () => {
      const status = {
        cardId: 1,
        lastReviewedAt: new Date(),
        nextReviewDate: new Date(),
        hasBeenReviewed: true,
      };
      mockCardService.getReviewStatus.mockResolvedValue(status);

      const result = await controller.getReviewStatus({ id: 1 });

      expect(result.hasBeenReviewed).toBe(true);
    });

    it('TC-CARDSTATS-005: This test case aims to verify cardId is included in status response', async () => {
      const status = {
        cardId: 1,
        lastReviewedAt: new Date(),
        nextReviewDate: new Date(),
        hasBeenReviewed: true,
      };
      mockCardService.getReviewStatus.mockResolvedValue(status);

      const result = await controller.getReviewStatus({ id: 1 });

      expect(result.cardId).toBe(1);
    });
  });

  describe('Controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have cardService injected', () => {
      expect(cardService).toBeDefined();
    });
  });
});
