import { CardReview, ReviewQuality } from '@prisma/client';
import { SubmitReviewItemDto } from 'src/utils/types/dto/review/submitReview.dto';

/**
 * Map button -> numeric quality (SM-2 variant described)
 * again => 2, hard => 3, good => 4, easy => 5
 */
function toQuality(q: ReviewQuality): number {
  if (typeof q === 'number') return q;
  switch (q) {
    case 'Again':
      return 2;
    case 'Hard':
      return 3;
    case 'Good':
      return 4;
    case 'Easy':
      return 5;
    default:
      return 4;
  }
}

/**
 * Apply simplified SM-2 update rules (per provided spec).
 * - quality < 3 : failure ("again")
 * - quality >= 3: success (hard/good/easy)
 *
 * Returns updated card state (does NOT persist).
 */
export function applySm2(
  submitReview: SubmitReviewItemDto,
  reviewedAt: Date,
  prevCardReview: CardReview | null,
): CardReview {
  const quality = toQuality(submitReview.quality);

  const previousInterval = prevCardReview?.interval || 0;
  let { repetitions, interval, eFactor } = prevCardReview || {
    repetitions: 0,
    interval: 0,
    eFactor: 2.5,
  };

  if (quality < 3) {
    // Failure (Again)
    repetitions = 0;
    interval = 1;
    // eFactor unchanged for simplified variant
  } else {
    // Success
    repetitions = repetitions + 1;

    if (repetitions === 1) {
      // First review - differentiate by quality
      if (quality === 3) {
        // Hard: 1 day
        interval = 1;
      } else if (quality === 4) {
        // Good: 3 days
        interval = 3;
      } else {
        // Easy (quality === 5): 5 days
        interval = 5;
      }
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      // Differentiate intervals based on quality when repetitions > 2
      const prev = previousInterval > 0 ? previousInterval : 1;

      if (quality === 3) {
        // Hard: Fixed growth of 1.2x
        interval = Math.round(prev * 1.2);
      } else if (quality === 4) {
        // Good: Standard growth using E-Factor
        interval = Math.round(prev * eFactor);
      } else {
        // Easy (quality === 5): Bonus growth using E-Factor * 1.3
        interval = Math.round(prev * eFactor * 1.3);
      }

      // ensure at least 1 day
      interval = Math.max(1, interval);
    }

    // update ease factor:
    // e' = e + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const diff = 5 - quality;
    const newE = eFactor + (0.1 - diff * (0.08 + diff * 0.02));
    eFactor = Math.max(newE, 1.3);
  }

  const nextReviewDate = reviewedAt;
  nextReviewDate.setDate(reviewedAt.getDate() + interval);

  const result: CardReview = {
    id: 0, // placeholder, not used
    cardId: submitReview.cardId,
    quality: submitReview.quality,
    repetitions,
    interval,
    eFactor,
    nextReviewDate,
    reviewedAt,
  };

  return result;
}

/*
Example usage:

import { applySm2 } from 'src/utils/algorithms/sm2';

const card = { repetitions: 0, interval: 0, eFactor: 2.5 };
const updated = applySm2(card, 'good'); // quality=4
*/
