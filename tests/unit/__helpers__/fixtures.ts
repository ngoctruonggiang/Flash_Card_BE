/**
 * Test data fixtures and builders for unit tests
 * These create consistent test data across all test files
 */

// ============================================
// User Fixtures
// ============================================
export const createMockUser = (
  overrides: Partial<MockUser> = {},
): MockUser => ({
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  role: 'USER',
  createdAt: new Date('2025-01-01'),
  lastLoginAt: new Date('2025-01-15'),
  ...overrides,
});

export interface MockUser {
  id: number;
  email: string;
  username: string;
  role: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// ============================================
// Auth DTO Fixtures
// ============================================
export const createSignUpDto = (
  overrides: Partial<SignUpDto> = {},
): SignUpDto => ({
  email: 'test@example.com',
  username: 'testuser',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  ...overrides,
});

export interface SignUpDto {
  email: string;
  username: string;
  password: string;
  confirmPassword?: string;
}

export const createSignInDto = (
  overrides: Partial<SignInDto> = {},
): SignInDto => ({
  email: 'test@example.com',
  password: 'Password123!',
  ...overrides,
});

export interface SignInDto {
  email: string;
  password: string;
}

export const createAuthResponse = (
  overrides: Partial<AuthResponse> = {},
): AuthResponse => ({
  accessToken: 'jwt-token-12345',
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  role: 'USER',
  createdAt: new Date('2025-01-01'),
  lastLoginAt: new Date('2025-01-15'),
  ...overrides,
});

export interface AuthResponse {
  accessToken: string;
  id: number;
  email: string;
  username: string;
  role: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// ============================================
// Deck Fixtures
// ============================================
export const createMockDeck = (
  overrides: Partial<MockDeck> = {},
): MockDeck => ({
  id: 1,
  title: 'Test Deck',
  description: 'A test deck for unit testing',
  iconName: 'book',
  colorCode: '#FF5733',
  languageMode: 'VN_EN',
  userId: 1,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
  ...overrides,
});

export interface MockDeck {
  id: number;
  title: string;
  description?: string;
  iconName?: string;
  colorCode?: string;
  languageMode: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
  cards?: MockCard[];
  user?: MockUser;
}

export const createCreateDeckDto = (
  overrides: Partial<CreateDeckDto> = {},
): CreateDeckDto => ({
  title: 'Test Deck',
  ...overrides,
});

export interface CreateDeckDto {
  title: string;
  description?: string;
  iconName?: string;
  colorCode?: string;
  languageMode?: string;
}

// ============================================
// Card Fixtures
// ============================================
export const createMockCard = (
  overrides: Partial<MockCard> = {},
): MockCard => ({
  id: 1,
  deckId: 1,
  front: 'Hello',
  back: 'Xin chào',
  tags: ['greeting'],
  wordType: 'noun',
  pronunciation: '/həˈloʊ/',
  examples: null,
  status: 'new',
  easeFactor: 2.5,
  interval: 0,
  stepIndex: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
  ...overrides,
});

export interface MockCard {
  id: number;
  deckId: number;
  front: string;
  back: string;
  tags?: string[];
  wordType?: string;
  pronunciation?: string;
  examples?: any;
  status: string;
  easeFactor: number;
  interval: number;
  stepIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
  reviews?: MockReview[];
  nextReviewDate?: Date | null;
}

export const createCreateCardDto = (
  overrides: Partial<CreateCardDto> = {},
): CreateCardDto => ({
  deckId: 1,
  front: 'Hello',
  back: 'Xin chào',
  ...overrides,
});

export interface CreateCardDto {
  deckId: number;
  front: string;
  back: string;
  tags?: string[];
  wordType?: string;
  pronunciation?: string;
  examples?: any[];
}

// ============================================
// Review Fixtures
// ============================================
export const createMockReview = (
  overrides: Partial<MockReview> = {},
): MockReview => ({
  id: 1,
  cardId: 1,
  quality: 'Good',
  easeFactor: 2.5,
  interval: 1,
  reviewedAt: new Date('2025-01-15'),
  nextReviewDate: new Date('2025-01-16'),
  ...overrides,
});

export interface MockReview {
  id: number;
  cardId: number;
  quality: string;
  easeFactor: number;
  interval: number;
  reviewedAt: Date;
  nextReviewDate: Date;
}

// ============================================
// Scheduler Card Fixtures
// ============================================
export const createSchedulerCard = (
  overrides: Partial<SchedulerCardFixture> = {},
): SchedulerCardFixture => ({
  status: 'new',
  stepIndex: 0,
  easeFactor: 2.5,
  interval: 0,
  nextReviewDate: null,
  ...overrides,
});

export interface SchedulerCardFixture {
  status: 'new' | 'learning' | 'review' | 'relearning';
  stepIndex: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Date | null;
}

// ============================================
// Study Session Fixtures
// ============================================
export const createMockStudySession = (
  overrides: Partial<MockStudySession> = {},
): MockStudySession => ({
  deckId: 1,
  cards: [createMockCard()],
  totalCards: 1,
  newCards: 1,
  reviewCards: 0,
  ...overrides,
});

export interface MockStudySession {
  deckId: number;
  cards: MockCard[];
  totalCards: number;
  newCards: number;
  reviewCards: number;
}

// ============================================
// Review Status Fixtures
// ============================================
export const createMockReviewStatus = (
  overrides: Partial<MockReviewStatus> = {},
): MockReviewStatus => ({
  cardId: 1,
  lastReviewedAt: new Date('2025-01-14'),
  nextReviewDate: new Date('2025-01-21'),
  hasBeenReviewed: true,
  ...overrides,
});

export interface MockReviewStatus {
  cardId: number;
  lastReviewedAt: Date | null;
  nextReviewDate: Date | null;
  hasBeenReviewed: boolean;
}
