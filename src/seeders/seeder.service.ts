import { Injectable } from '@nestjs/common';
import { CardService } from 'src/services/card/card.service';
import { DeckService } from 'src/services/deck/deck.service';
import { UserService } from 'src/services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';
import dictionary from 'src/seeders/data/dictionary_alpha_arrays.json';

@Injectable()
export class SeederService {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly cardService: CardService,
    private readonly deckService: DeckService,
  ) {}

  admin = {
    username: 'admin',
    password: 'admin123456',
    email: 'admin@example.com',
  };

  async seed() {
    console.log('Seeding database');
    if (await this.userService.findByUsername(this.admin.username)) {
      console.log('Already seeded. Skipping seeding.');
      return;
    }
    await this.authService.signUp(this.admin);
    const adminUser = (await this.userService.findByUsername(
      this.admin.username,
    ))!;
    await this.userService.update(adminUser.id, { role: 'ADMIN' });

    const deck = await this.deckService.create(adminUser.id, {
      title: 'Sample Deck',
      description: 'This is a sample deck created during seeding.',
    });

    const limit = 10;
    for (const list in dictionary) {
      let wordCount = 0;
      for (const wordPair of Object.keys(dictionary[list])) {
        if (wordCount >= limit) break;
        await this.cardService.create({
          deckId: deck.id,
          front: wordPair,
          back: dictionary[list][wordPair],
        });
        // console.log(dictionary[list][wordPair]);
        wordCount++;
      }
    }
  }
}
