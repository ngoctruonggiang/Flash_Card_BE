import { PrismaClient, LanguageMode } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillReverseRichFields() {
  const decks = await prisma.deck.findMany({
    where: { languageMode: LanguageMode.BIDIRECTIONAL },
    include: { cards: true },
  });

  let updatedCount = 0;

  for (const deck of decks) {
    const index = new Map<string, (typeof deck.cards)[number]>();
    for (const card of deck.cards) {
      index.set(`${card.front}|||${card.back}`, card);
    }

    for (const primary of deck.cards) {
      const reverseKey = `${primary.back}|||${primary.front}`;
      const reverse = index.get(reverseKey);
      if (!reverse) continue;

      const needsUpdate =
        (reverse.wordType == null && primary.wordType != null) ||
        (reverse.pronunciation == null && primary.pronunciation != null) ||
        (reverse.examples == null && primary.examples != null);

      if (needsUpdate) {
        await prisma.card.update({
          where: { id: reverse.id },
          data: {
            wordType: reverse.wordType ?? primary.wordType ?? undefined,
            pronunciation:
              reverse.pronunciation ?? primary.pronunciation ?? undefined,
            examples: reverse.examples ?? primary.examples ?? undefined,
          },
        });
        updatedCount++;
      }
    }
  }

  return updatedCount;
}

backfillReverseRichFields()
  .then((count) => {
    console.log(`Backfilled reverse cards: ${count}`);
  })
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
