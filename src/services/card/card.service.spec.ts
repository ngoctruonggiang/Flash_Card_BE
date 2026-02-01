import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from './card.service';

describe('Card', () => {
  let provider: CardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CardService],
    }).compile();

    provider = module.get<CardService>(CardService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
