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
    it('TC-039: should create card when valid front and back provided, returns card with id', async () => {
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

    it('TC-040: should create card when all optional fields provided, returns card with all fields', async () => {
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

    it('TC-041: should create card when examples array is empty, returns card with empty examples', async () => {
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

    it('TC-042: should create card when content contains unicode, returns card with unicode content', async () => {
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

    it('TC-043: should create card when content is very long, returns card with long content', async () => {
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

    it('TC-044: should throw NotFoundException when deck does not exist, returns 404 error', async () => {
      const createDto = { deckId: 999, front: 'Test', back: 'Test' };
      mockCardService.create.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.create(mockUser as any, createDto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-045: should create card when multiple tags provided, returns card with all tags', async () => {
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
    it('TC-046: should return all cards when no deckId provided, returns array of all cards', async () => {
      const cards = [mockCard, { ...mockCard, id: 2 }];
      mockCardService.findAll.mockResolvedValue(cards);

      const result = await controller.findAll();

      expect(result).toEqual(cards);
      expect(cardService.findAll).toHaveBeenCalled();
    });

    it('TC-047: should return cards when deckId provided, returns cards for that deck', async () => {
      const cards = [mockCard];
      mockCardService.findByDeck.mockResolvedValue(cards);

      const result = await controller.findAll(1);

      expect(result).toEqual(cards);
      expect(cardService.findByDeck).toHaveBeenCalledWith(1);
    });

    it('TC-048: should return empty array when no cards exist globally, returns empty array', async () => {
      mockCardService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('TC-049: should return empty array when deck has no cards, returns empty array', async () => {
      mockCardService.findByDeck.mockResolvedValue([]);

      const result = await controller.findAll(999);

      expect(result).toEqual([]);
    });

    it('TC-050: should call findAll when deckId is undefined, returns all cards', async () => {
      mockCardService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined);

      expect(cardService.findAll).toHaveBeenCalled();
      expect(cardService.findByDeck).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('TC-051: should return card when valid id provided, returns card object', async () => {
      mockCardService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne({ id: 1 });

      expect(result).toEqual(mockCard);
      expect(cardService.findOne).toHaveBeenCalledWith(1);
    });

    it('TC-052: should throw NotFoundException when card id does not exist, returns 404 error', async () => {
      mockCardService.findOne.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.findOne({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-053: should return card when id is 100, returns card with id 100', async () => {
      const card = { ...mockCard, id: 100 };
      mockCardService.findOne.mockResolvedValue(card);

      const result = await controller.findOne({ id: 100 });

      expect(result).toEqual(card);
      expect(cardService.findOne).toHaveBeenCalledWith(100);
    });

    it('TC-054: should return card with all fields when valid id, returns complete card object', async () => {
      mockCardService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne({ id: 1 });

      expect(result).toHaveProperty('front');
      expect(result).toHaveProperty('back');
      expect(result).toHaveProperty('deckId');
      expect(result).toHaveProperty('status');
    });
  });

  describe('UC-15: Edit Card', () => {
    it('TC-055: should update card when new front provided, returns card with updated front', async () => {
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

    it('TC-056: should update card when new back provided, returns card with updated back', async () => {
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

    it('TC-057: should update card when multiple fields provided, returns card with all fields updated', async () => {
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

    it('TC-058: should update card when pronunciation provided, returns card with updated pronunciation', async () => {
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

    it('TC-059: should update card when examples provided, returns card with updated examples', async () => {
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

    it('TC-060: should update card when wordType provided, returns card with updated wordType', async () => {
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

    it('TC-061: should update card when empty dto provided, returns unchanged card', async () => {
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

    it('TC-062: should throw NotFoundException when card id does not exist, returns 404 error', async () => {
      mockCardService.update.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(
        controller.update({ id: 999 }, { front: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-063: should update card when content contains unicode, returns card with unicode content', async () => {
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
    it('TC-064: should delete card when valid id provided, returns deleted confirmation', async () => {
      mockCardService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove({ id: 1 });

      expect(result).toEqual({ deleted: true });
      expect(cardService.remove).toHaveBeenCalledWith(1);
    });

    it('TC-065: should throw NotFoundException when card id does not exist, returns 404 error', async () => {
      mockCardService.remove.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.remove({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-066: should delete card when id is 42, returns deleted confirmation', async () => {
      mockCardService.remove.mockResolvedValue({ deleted: true });

      await controller.remove({ id: 42 });

      expect(cardService.remove).toHaveBeenCalledWith(42);
    });
  });

  describe('UC-17: View Card Statistics', () => {
    it('TC-067: should return status when card has been reviewed, returns complete status object', async () => {
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

    it('TC-068: should return null dates when card is new, returns status with null dates', async () => {
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

    it('TC-069: should throw NotFoundException when card id does not exist, returns 404 error', async () => {
      mockCardService.getReviewStatus.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.getReviewStatus({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-070: should return hasBeenReviewed true when card reviewed, returns reviewed status', async () => {
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

    it('TC-071: should return cardId in status object, returns status with cardId', async () => {
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
    it('TC-072: should be defined when module is compiled, returns defined controller', () => {
      expect(controller).toBeDefined();
    });

    it('TC-073: should have cardService injected when module is compiled, returns defined service', () => {
      expect(cardService).toBeDefined();
    });
  });
});
