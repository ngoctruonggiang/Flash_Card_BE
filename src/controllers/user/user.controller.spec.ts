import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from 'src/services/user/user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createDto = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        lastLoginAt: '2025-10-29T00:00:00.000Z',
      };
      const mockUser = {
        id: 1,
        ...createDto,
        lastLoginAt: new Date(createDto.lastLoginAt),
      };

      mockUserService.create.mockResolvedValue(mockUser);

      const result = await controller.signUp(createDto);

      expect(result).toEqual(mockUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith({
        ...createDto,
        lastLoginAt: new Date(createDto.lastLoginAt),
      });
    });
  });
});
