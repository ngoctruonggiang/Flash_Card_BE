import { Test, TestingModule } from '@nestjs/testing';
import { DeckService } from './deck.service';

describe('Deck', () => {
  let provider: DeckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeckService],
    }).compile();

    provider = module.get<DeckService>(DeckService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
