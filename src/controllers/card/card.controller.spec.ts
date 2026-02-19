/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CardController } from './card.controller';
import { CardService } from 'src/services/card/card.service';
import { CreateCardDto } from 'src/utils/types/dto/card/createCard.dto';
import { UpdateCardDto } from 'src/utils/types/dto/card/updateCard.dto';

describe('CardController', () => {
  let controller: CardController;
  let service: CardService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDeck: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardController],
      providers: [
        {
          provide: CardService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CardController>(CardController);
    service = module.get<CardService>(CardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new card', async () => {
      const createCardDto: CreateCardDto = {
        deckId: { id: 1 },
        front: 'What is JavaScript?',
        back: 'A programming language',
        tags: 'programming,js',
      };

      const mockCard = {
        id: 1,
        deckId: 1,
        front: 'What is JavaScript?',
        back: 'A programming language',
        tags: 'programming,js',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.create.mockResolvedValue(mockCard);

      const result = await controller.create(createCardDto);

      expect(result).toEqual(mockCard);
      expect(service.create).toHaveBeenCalledWith({
        deckId: 1,
        front: createCardDto.front,
        back: createCardDto.back,
        tags: createCardDto.tags,
      });
    });

    it('should create a card without tags', async () => {
      const createCardDto = {
        deckId: { id: 2 },
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
      };

      const mockCard = {
        id: 2,
        deckId: 2,
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.create.mockResolvedValue(mockCard);

      const result = await controller.create(createCardDto);

      expect(result).toEqual(mockCard);
      expect(service.create).toHaveBeenCalledWith({
        deckId: 2,
        front: createCardDto.front,
        back: createCardDto.back,
        tags: undefined,
      });
    });
  });

  describe('findAll', () => {
    it('should return all cards when no deckId provided', async () => {
      const mockCards = [
        {
          id: 1,
          deckId: 1,
          front: 'Question 1',
          back: 'Answer 1',
          tags: 'tag1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          deckId: 2,
          front: 'Question 2',
          back: 'Answer 2',
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.findAll.mockResolvedValue(mockCards);

      const result = await controller.findAll();

      expect(result).toEqual(mockCards);
      expect(service.findAll).toHaveBeenCalled();
      expect(service.findByDeck).not.toHaveBeenCalled();
    });

    it('should return cards by deck when deckId provided', async () => {
      const mockCards = [
        {
          id: 1,
          deckId: 1,
          front: 'Question 1',
          back: 'Answer 1',
          tags: 'tag1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.findByDeck.mockResolvedValue(mockCards);

      const result = await controller.findAll(1);

      expect(result).toEqual(mockCards);
      expect(service.findByDeck).toHaveBeenCalledWith(1);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a card by id', async () => {
      const mockCard = {
        id: 1,
        deckId: 1,
        front: 'Question 1',
        back: 'Answer 1',
        tags: 'tag1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deck: {
          id: 1,
          name: 'Deck 1',
          userId: 1,
        },
      };

      mockService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne({ id: 1 });

      expect(result).toEqual(mockCard);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a card', async () => {
      const updateDto: UpdateCardDto = {
        front: 'Updated question',
        back: 'Updated answer',
        tags: 'updated',
      };

      const mockUpdatedCard = {
        id: 1,
        deckId: 1,
        ...updateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.update.mockResolvedValue(mockUpdatedCard);

      const result = await controller.update({ id: 1 }, updateDto);

      expect(result).toEqual(mockUpdatedCard);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update only front', async () => {
      const updateDto: UpdateCardDto = {
        front: 'New question',
      };

      const mockUpdatedCard = {
        id: 1,
        deckId: 1,
        front: 'New question',
        back: 'Original answer',
        tags: 'tags',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.update.mockResolvedValue(mockUpdatedCard);

      const result = await controller.update({ id: 1 }, updateDto);

      expect(result).toEqual(mockUpdatedCard);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a card', async () => {
      const mockDeletedCard = {
        id: 1,
        deckId: 1,
        front: 'Question',
        back: 'Answer',
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.remove.mockResolvedValue(mockDeletedCard);

      const result = await controller.remove({ id: 1 });

      expect(result).toEqual(mockDeletedCard);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
