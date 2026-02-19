/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeckController } from './deck.controller';
import { DeckService } from 'src/services/deck/deck.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/createDeck.dto';
import { UpdateDeckDto } from 'src/utils/types/dto/deck/updateDeck.dto';

describe('DeckController', () => {
  let controller: DeckController;
  let service: DeckService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeckController],
      providers: [
        {
          provide: DeckService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DeckController>(DeckController);
    service = module.get<DeckService>(DeckService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new deck', async () => {
      const createDeckDto: CreateDeckDto = {
        title: 'JavaScript Basics',
        userId: { id: 1 },
        description: 'Learn JavaScript fundamentals',
      };

      const mockDeck = {
        id: 1,
        name: 'JavaScript Basics',
        userId: 1,
        description: 'Learn JavaScript fundamentals',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.create.mockResolvedValue(mockDeck);

      const result = await controller.create(createDeckDto);

      expect(result).toEqual(mockDeck);
      expect(service.create).toHaveBeenCalledWith(createDeckDto);
    });

    it('should create a deck without description', async () => {
      const createDeckDto: CreateDeckDto = {
        title: 'TypeScript Basics',
        userId: { id: 1 },
      };

      const mockDeck = {
        id: 2,
        name: 'TypeScript Basics',
        userId: 1,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.create.mockResolvedValue(mockDeck);

      const result = await controller.create(createDeckDto);

      expect(result).toEqual(mockDeck);
      expect(service.create).toHaveBeenCalledWith(createDeckDto);
    });
  });

  describe('findAll', () => {
    it('should return all decks when no userId provided', async () => {
      const mockDecks = [
        {
          id: 1,
          name: 'Deck 1',
          userId: 1,
          description: 'Description 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Deck 2',
          userId: 2,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.findAll.mockResolvedValue(mockDecks);

      const result = await controller.findAll();

      expect(result).toEqual(mockDecks);
      expect(service.findAll).toHaveBeenCalled();
      expect(service.findByUser).not.toHaveBeenCalled();
    });

    it('should return decks by user when userId provided', async () => {
      const mockDecks = [
        {
          id: 1,
          name: 'Deck 1',
          userId: 1,
          description: 'Description 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockService.findByUser.mockResolvedValue(mockDecks);

      const result = await controller.findAll(1);

      expect(result).toEqual(mockDecks);
      expect(service.findByUser).toHaveBeenCalledWith(1);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a deck by id', async () => {
      const mockDeck = {
        id: 1,
        name: 'JavaScript Basics',
        userId: 1,
        description: 'Learn JavaScript',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
        cards: [
          {
            id: 1,
            deckId: 1,
            front: 'Question',
            back: 'Answer',
          },
        ],
      };

      mockService.findOne.mockResolvedValue(mockDeck);

      const result = await controller.findOne({ id: 1 });

      expect(result).toEqual(mockDeck);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a deck', async () => {
      const updateDto: UpdateDeckDto = {
        title: 'Updated Deck Title',
        description: 'Updated description',
      };

      const mockUpdatedDeck = {
        id: 1,
        userId: 1,
        name: 'Updated Deck Title',
        description: 'Updated description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.update.mockResolvedValue(mockUpdatedDeck);

      const result = await controller.update({ id: 1 }, updateDto);

      expect(result).toEqual(mockUpdatedDeck);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update only title', async () => {
      const updateDto: UpdateDeckDto = {
        title: 'New Deck Title',
      };

      const mockUpdatedDeck = {
        id: 1,
        userId: 1,
        name: 'New Deck Title',
        description: 'Original description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.update.mockResolvedValue(mockUpdatedDeck);

      const result = await controller.update({ id: 1 }, updateDto);

      expect(result).toEqual(mockUpdatedDeck);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update only description', async () => {
      const updateDto: UpdateDeckDto = {
        description: 'New description',
      };

      const mockUpdatedDeck = {
        id: 1,
        userId: 1,
        name: 'Original Name',
        description: 'New description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.update.mockResolvedValue(mockUpdatedDeck);

      const result = await controller.update({ id: 1 }, updateDto);

      expect(result).toEqual(mockUpdatedDeck);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a deck', async () => {
      const mockDeletedDeck = {
        id: 1,
        name: 'Deck to delete',
        userId: 1,
        description: 'Will be deleted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.remove.mockResolvedValue(mockDeletedDeck);

      const result = await controller.remove({ id: 1 });

      expect(result).toEqual(mockDeletedDeck);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
