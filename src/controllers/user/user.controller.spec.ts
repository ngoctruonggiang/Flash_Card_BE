import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from 'src/services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let authService: AuthService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Removed because of how badly i prompted
  it('/signup', async () => {
    const createDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockJwtToken = {
      accessToken: 'mocked_jwt_token',
    };
    mockAuthService.signUp.mockResolvedValue(mockJwtToken);

    await expect(controller.signUp(createDto)).resolves.toEqual(mockJwtToken);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.signUp).toHaveBeenCalledWith(createDto);
  });

  it('/signin', async () => {
    const createDto = {
      username: 'testuser',
      password: 'password123',
    };
    const mockJwtToken = {
      accessToken: 'mocked_jwt_token',
    };

    mockAuthService.signIn.mockResolvedValue(mockJwtToken);

    await expect(controller.signIn(createDto)).resolves.toEqual(mockJwtToken);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authService.signIn).toHaveBeenCalledWith(createDto);
  });
});
