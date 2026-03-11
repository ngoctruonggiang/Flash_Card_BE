import { CardReview, ReviewQuality } from '@prisma/client';
import { applySm2 } from './sm2Algo';
import { SubmitReviewItemDto } from 'src/utils/types/dto/review/submitReview.dto';

describe('SM-2 Algorithm (applySm2)', () => {
  const baseReviewedAt = new Date('2025-01-01T00:00:00.000Z');

  /**
   * Helper function to create a SubmitReviewItemDto
   */
  const createSubmitReview = (
    cardId: number,
    quality: ReviewQuality,
  ): SubmitReviewItemDto => ({
    cardId,
    quality,
  });

  /**
   * Helper function to create a previous CardReview state
   */
  const createPreviousReview = (
    cardId: number,
    repetitions: number,
    interval: number,
    eFactor: number,
    reviewedAt: Date,
  ): CardReview => ({
    id: 1,
    cardId,
    quality: 'Good' as ReviewQuality,
    repetitions,
    interval,
    eFactor,
    nextReviewDate: new Date(
      reviewedAt.getTime() + interval * 24 * 60 * 60 * 1000,
    ),
    reviewedAt,
  });

  describe('Quality Mapping', () => {
    it('should map "Again" to quality 2', () => {
      const submitReview = createSubmitReview(1, 'Again');
      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result.quality).toBe('Again');
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should map "Hard" to quality 3', () => {
      const submitReview = createSubmitReview(1, 'Hard');
      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result.quality).toBe('Hard');
      expect(result.repetitions).toBe(1);
    });

    it('should map "Good" to quality 4', () => {
      const submitReview = createSubmitReview(1, 'Good');
      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result.quality).toBe('Good');
      expect(result.repetitions).toBe(1);
    });

    it('should map "Easy" to quality 5', () => {
      const submitReview = createSubmitReview(1, 'Easy');
      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result.quality).toBe('Easy');
      expect(result.repetitions).toBe(1);
    });
  });

  describe('Case 1: Failure (quality < 3 → "Again")', () => {
    it('should reset repetitions to 0 on "Again"', () => {
      const prevReview = createPreviousReview(
        1,
        3,
        10,
        2.5,
        new Date('2024-12-20'),
      );
      const submitReview = createSubmitReview(1, 'Again');

      const result = applySm2(submitReview, baseReviewedAt, prevReview);

      expect(result.repetitions).toBe(0);
    });

    it('should set interval to 1 on "Again"', () => {
      const prevReview = createPreviousReview(
        1,
        3,
        10,
        2.5,
        new Date('2024-12-20'),
      );
      const submitReview = createSubmitReview(1, 'Again');

      const result = applySm2(submitReview, baseReviewedAt, prevReview);

      expect(result.interval).toBe(1);
    });

    it('should set next review date to tomorrow on "Again"', () => {
      const submitReview = createSubmitReview(1, 'Again');
      const reviewDate = new Date(baseReviewedAt);

      const result = applySm2(submitReview, reviewDate, null);

      const expectedDate = new Date(baseReviewedAt);
      expectedDate.setDate(expectedDate.getDate() + 1);

      expect(result.nextReviewDate.toISOString()).toBe(
        expectedDate.toISOString(),
      );
    });

    it('should NOT change eFactor on "Again"', () => {
      const prevReview = createPreviousReview(
        1,
        3,
        10,
        2.5,
        new Date('2024-12-20'),
      );
      const submitReview = createSubmitReview(1, 'Again');

      const result = applySm2(submitReview, baseReviewedAt, prevReview);

      expect(result.eFactor).toBe(2.5);
    });

    it('should handle "Again" on a new card (no previous review)', () => {
      const submitReview = createSubmitReview(1, 'Again');

      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.eFactor).toBe(2.5); // default eFactor unchanged
    });
  });

  describe('Case 2: Success (quality ≥ 3 → "Hard/Good/Easy")', () => {
    describe('First successful review (repetitions = 1)', () => {
      it('should set interval to 3 days on first "Good" review', () => {
        const submitReview = createSubmitReview(1, 'Good');

        const result = applySm2(submitReview, baseReviewedAt, null);

        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(3);
      });

      it('should set interval to 1 day on first "Hard" review', () => {
        const submitReview = createSubmitReview(1, 'Hard');

        const result = applySm2(submitReview, baseReviewedAt, null);

        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
      });

      it('should set interval to 5 days on first "Easy" review', () => {
        const submitReview = createSubmitReview(1, 'Easy');

        const result = applySm2(submitReview, baseReviewedAt, null);

        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(5);
      });
    });

    describe('Second successful review (repetitions = 2)', () => {
      it('should set interval to 6 days on second "Good" review', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          2.5,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Good');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        expect(result.repetitions).toBe(2);
        expect(result.interval).toBe(6);
      });

      it('should set interval to 6 days on second "Hard" review', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          2.36,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Hard');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        expect(result.repetitions).toBe(2);
        expect(result.interval).toBe(6);
      });

      it('should set interval to 6 days on second "Easy" review', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          2.6,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Easy');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        expect(result.repetitions).toBe(2);
        expect(result.interval).toBe(6);
      });
    });

    describe('Third+ successful review (repetitions ≥ 3)', () => {
      it('should calculate interval as round(previous_interval * eFactor)', () => {
        const prevReview = createPreviousReview(
          1,
          2,
          6,
          2.5,
          new Date('2024-12-26'),
        );
        const submitReview = createSubmitReview(1, 'Good');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        expect(result.repetitions).toBe(3);
        // 6 * 2.5 = 15
        expect(result.interval).toBe(15);
      });

      it('should round interval correctly', () => {
        const prevReview = createPreviousReview(
          1,
          2,
          6,
          2.36,
          new Date('2024-12-26'),
        );
        const submitReview = createSubmitReview(1, 'Good');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        // 6 * 2.36 = 14.16 → rounds to 14
        expect(result.interval).toBe(14);
      });

      it('should ensure minimum interval of 1 day', () => {
        const prevReview = createPreviousReview(
          1,
          2,
          6,
          1.3,
          new Date('2024-12-26'),
        );
        // Manipulate to create a very small interval
        prevReview.interval = 0; // edge case

        const submitReview = createSubmitReview(1, 'Good');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        // Should be at least 1
        expect(result.interval).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Ease Factor (eFactor) updates', () => {
      it('should update eFactor correctly for "Hard" (quality=3)', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          2.5,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Hard');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        // e' = e + (0.1 - (5 - 3) * (0.08 + (5 - 3) * 0.02))
        // e' = 2.5 + (0.1 - 2 * (0.08 + 2 * 0.02))
        // e' = 2.5 + (0.1 - 2 * (0.08 + 0.04))
        // e' = 2.5 + (0.1 - 2 * 0.12)
        // e' = 2.5 + (0.1 - 0.24)
        // e' = 2.5 + (-0.14)
        // e' = 2.36
        expect(result.eFactor).toBeCloseTo(2.36, 2);
      });

      it('should update eFactor correctly for "Good" (quality=4)', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          2.5,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Good');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        // e' = e + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))
        // e' = 2.5 + (0.1 - 1 * (0.08 + 1 * 0.02))
        // e' = 2.5 + (0.1 - 1 * 0.10)
        // e' = 2.5 + 0.0
        // e' = 2.5
        expect(result.eFactor).toBeCloseTo(2.5, 2);
      });

      it('should update eFactor correctly for "Easy" (quality=5)', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          2.5,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Easy');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        // e' = e + (0.1 - (5 - 5) * (0.08 + (5 - 5) * 0.02))
        // e' = 2.5 + (0.1 - 0 * (0.08 + 0 * 0.02))
        // e' = 2.5 + 0.1
        // e' = 2.6
        expect(result.eFactor).toBeCloseTo(2.6, 2);
      });

      it('should enforce minimum eFactor of 1.3', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          1.3,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Hard');

        const result = applySm2(submitReview, baseReviewedAt, prevReview);

        // Even if calculation goes below 1.3, it should be clamped
        expect(result.eFactor).toBeGreaterThanOrEqual(1.3);
      });

      it('should handle eFactor decrease without going below minimum', () => {
        let prevReview = createPreviousReview(
          1,
          2,
          6,
          2.5,
          new Date('2024-12-26'),
        );

        // Multiple "Hard" reviews to decrease eFactor
        for (let i = 0; i < 10; i++) {
          const submitReview = createSubmitReview(1, 'Hard');
          const result = applySm2(submitReview, baseReviewedAt, prevReview);

          expect(result.eFactor).toBeGreaterThanOrEqual(1.3);

          // Update for next iteration
          prevReview = result;
        }
      });
    });

    describe('Next review date calculation', () => {
      it('should calculate next review date correctly for interval=3', () => {
        const submitReview = createSubmitReview(1, 'Good');
        const reviewDate = new Date(baseReviewedAt);

        const result = applySm2(submitReview, reviewDate, null);

        const expectedDate = new Date(baseReviewedAt);
        expectedDate.setDate(expectedDate.getDate() + 3);

        expect(result.nextReviewDate.toISOString()).toBe(
          expectedDate.toISOString(),
        );
      });

      it('should calculate next review date correctly for interval=6', () => {
        const prevReview = createPreviousReview(
          1,
          1,
          1,
          2.5,
          new Date('2024-12-31'),
        );
        const submitReview = createSubmitReview(1, 'Good');
        const reviewDate = new Date(baseReviewedAt);

        const result = applySm2(submitReview, reviewDate, prevReview);

        const expectedDate = new Date(baseReviewedAt);
        expectedDate.setDate(expectedDate.getDate() + 6);

        expect(result.nextReviewDate.toISOString()).toBe(
          expectedDate.toISOString(),
        );
      });

      it('should calculate next review date correctly for larger intervals', () => {
        const prevReview = createPreviousReview(
          1,
          2,
          6,
          2.5,
          new Date('2024-12-26'),
        );
        const submitReview = createSubmitReview(1, 'Good');
        const reviewDate = new Date(baseReviewedAt);

        const result = applySm2(submitReview, reviewDate, prevReview);

        const expectedDate = new Date(baseReviewedAt);
        expectedDate.setDate(expectedDate.getDate() + 15); // interval=15

        expect(result.nextReviewDate.toISOString()).toBe(
          expectedDate.toISOString(),
        );
      });
    });
  });

  describe('Complete Learning Flow Examples', () => {
    it('should handle a typical learning progression: New → Good → Good → Easy → Good', () => {
      let prevReview: CardReview | null = null;
      const reviewDate = new Date(baseReviewedAt);

      // First review: "Good"
      let submitReview = createSubmitReview(1, 'Good');
      let result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(3);
      expect(result.eFactor).toBeCloseTo(2.5, 2);

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Second review: "Good"
      submitReview = createSubmitReview(1, 'Good');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
      expect(result.eFactor).toBeCloseTo(2.5, 2);

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Third review: "Easy"
      submitReview = createSubmitReview(1, 'Easy');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(20); // round(6 * 2.5 * 1.3) = 20
      expect(result.eFactor).toBeCloseTo(2.6, 2);

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Fourth review: "Good"
      submitReview = createSubmitReview(1, 'Good');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(4);
      expect(result.interval).toBe(52); // round(20 * 2.6) = 52
      expect(result.eFactor).toBeCloseTo(2.6, 2);
    });

    it('should handle progression with failure: Good → Good → Again → Good', () => {
      let prevReview: CardReview | null = null;
      const reviewDate = new Date(baseReviewedAt);

      // First review: "Good"
      let submitReview = createSubmitReview(1, 'Good');
      let result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(3);

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Second review: "Good"
      submitReview = createSubmitReview(1, 'Good');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Third review: "Again" (failure - reset)
      submitReview = createSubmitReview(1, 'Again');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.eFactor).toBeCloseTo(2.5, 2); // unchanged

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Fourth review: "Good" (starting over)
      submitReview = createSubmitReview(1, 'Good');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(3);
    });

    it('should handle difficulty variation: Good → Hard → Hard → Good', () => {
      let prevReview: CardReview | null = null;
      const reviewDate = new Date(baseReviewedAt);

      // First review: "Good"
      let submitReview = createSubmitReview(1, 'Good');
      let result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(3);
      expect(result.eFactor).toBeCloseTo(2.5, 2);

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Second review: "Hard"
      submitReview = createSubmitReview(1, 'Hard');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
      expect(result.eFactor).toBeCloseTo(2.36, 2); // decreased

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Third review: "Hard"
      submitReview = createSubmitReview(1, 'Hard');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(7); // round(6 * 1.2) = 7
      expect(result.eFactor).toBeCloseTo(2.22, 2); // further decreased

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Fourth review: "Good"
      submitReview = createSubmitReview(1, 'Good');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(4);
      expect(result.interval).toBe(16); // round(7 * 2.22) = 16
      expect(result.eFactor).toBeCloseTo(2.22, 2); // stays same for "Good"
    });

    it('should handle all "Easy" reviews for mastery', () => {
      let prevReview: CardReview | null = null;
      const reviewDate = new Date(baseReviewedAt);

      // First review: "Easy"
      let submitReview = createSubmitReview(1, 'Easy');
      let result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(5);
      expect(result.eFactor).toBeCloseTo(2.6, 2);

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Second review: "Easy"
      submitReview = createSubmitReview(1, 'Easy');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6);
      expect(result.eFactor).toBeCloseTo(2.7, 2); // increased

      prevReview = result;
      reviewDate.setDate(reviewDate.getDate() + result.interval);

      // Third review: "Easy"
      submitReview = createSubmitReview(1, 'Easy');
      result = applySm2(submitReview, reviewDate, prevReview);

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(21); // round(6 * 2.7 * 1.3) = 21
      expect(result.eFactor).toBeCloseTo(2.8, 2); // increased

      // Intervals should grow quickly with "Easy"
      expect(result.interval).toBeGreaterThan(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle card with no previous review (new card)', () => {
      const submitReview = createSubmitReview(1, 'Good');

      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(3);
      expect(result.eFactor).toBe(2.5);
      expect(result.cardId).toBe(1);
    });

    it('should handle minimum eFactor boundary correctly', () => {
      const prevReview = createPreviousReview(
        1,
        5,
        20,
        1.3,
        new Date('2024-12-12'),
      );
      const submitReview = createSubmitReview(1, 'Hard');

      const result = applySm2(submitReview, baseReviewedAt, prevReview);

      expect(result.eFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should handle very large repetition counts', () => {
      const prevReview = createPreviousReview(
        1,
        100,
        365,
        2.5,
        new Date('2024-01-01'),
      );
      const submitReview = createSubmitReview(1, 'Good');

      const result = applySm2(submitReview, baseReviewedAt, prevReview);

      expect(result.repetitions).toBe(101);
      expect(result.interval).toBeGreaterThan(365);
    });

    it('should produce consistent results for same inputs', () => {
      const prevReview = createPreviousReview(
        1,
        2,
        6,
        2.5,
        new Date('2024-12-26'),
      );
      const submitReview = createSubmitReview(1, 'Good');

      const result1 = applySm2(submitReview, baseReviewedAt, prevReview);
      const result2 = applySm2(submitReview, baseReviewedAt, prevReview);

      expect(result1.repetitions).toBe(result2.repetitions);
      expect(result1.interval).toBe(result2.interval);
      expect(result1.eFactor).toBe(result2.eFactor);
      expect(result1.nextReviewDate).toEqual(result2.nextReviewDate);
    });

    it('should handle reviewedAt dates at different times of day', () => {
      const morning = new Date('2025-01-01T08:00:00.000Z');
      const evening = new Date('2025-01-01T20:00:00.000Z');

      const submitReview = createSubmitReview(1, 'Good');

      const result1 = applySm2(submitReview, morning, null);
      const result2 = applySm2(submitReview, evening, null);

      // Intervals should be the same
      expect(result1.interval).toBe(result2.interval);

      // But next review dates should differ by the time difference
      const diff =
        result2.nextReviewDate.getTime() - result1.nextReviewDate.getTime();
      expect(diff).toBe(12 * 60 * 60 * 1000); // 12 hours in milliseconds
    });
  });

  describe('Return Value Structure', () => {
    it('should return a valid CardReview object', () => {
      const submitReview = createSubmitReview(1, 'Good');

      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('cardId');
      expect(result).toHaveProperty('quality');
      expect(result).toHaveProperty('repetitions');
      expect(result).toHaveProperty('interval');
      expect(result).toHaveProperty('eFactor');
      expect(result).toHaveProperty('nextReviewDate');
      expect(result).toHaveProperty('reviewedAt');
    });

    it('should maintain cardId from input', () => {
      const submitReview = createSubmitReview(42, 'Good');

      const result = applySm2(submitReview, baseReviewedAt, null);

      expect(result.cardId).toBe(42);
    });

    it('should set reviewedAt to the provided date', () => {
      const reviewDate = new Date('2025-06-15T14:30:00.000Z');
      const submitReview = createSubmitReview(1, 'Good');

      const result = applySm2(submitReview, reviewDate, null);

      expect(result.reviewedAt).toEqual(reviewDate);
    });

    it('should return quality matching input', () => {
      const qualities: ReviewQuality[] = ['Again', 'Hard', 'Good', 'Easy'];

      qualities.forEach((quality) => {
        const submitReview = createSubmitReview(1, quality);
        const result = applySm2(submitReview, baseReviewedAt, null);

        expect(result.quality).toBe(quality);
      });
    });
  });
});
