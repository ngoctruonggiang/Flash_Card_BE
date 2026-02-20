import { Injectable } from '@nestjs/common';
import { CardService } from 'src/services/card/card.service';
import { DeckService } from 'src/services/deck/deck.service';
import { UserService } from 'src/services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';
import dictionary from 'src/seeders/data/dictionary_alpha_arrays.json';

@Injectable()
export class SeederService {
  constructor(
    private readonly AuthService: AuthService,
    private readonly UserService: UserService,
    private readonly CardService: CardService,
    private readonly DeckService: DeckService,
  ) {}

  admin = {
    username: 'admin',
    password: 'admin123456',
    email: 'admin@example.com',
  };

  async seed() {
    console.log('Seeding database');
    const limit = 10;
    for (const list in dictionary) {
      let wordCount = 0;
      for (const wordPair of Object.keys(dictionary[list])) {
        if (wordCount >= limit) break;
        // console.log(dictionary[list][wordPair]);
        wordCount++;
      }
    }
    if (await this.UserService.findByUsername(this.admin.username)) {
      console.log('Already seeded. Skipping seeding.');
      return;
    }
    await this.AuthService.signUp(this.admin);
    const adminUser = (await this.UserService.findByUsername(
      this.admin.username,
    ))!;
    await this.UserService.update(adminUser.id, { role: 'ADMIN' });
  }
}
