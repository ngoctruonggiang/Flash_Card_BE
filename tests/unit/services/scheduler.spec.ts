import {
  AnkiScheduler,
  SchedulerCard,
  DEFAULT_SETTINGS,
} from 'src/services/scheduler';

describe('AnkiScheduler', () => {
  let scheduler: AnkiScheduler;
  // Mock settings to disable fuzz for deterministic testing
  const settings = { ...DEFAULT_SETTINGS, useFuzz: false };

  beforeEach(() => {
    scheduler = new AnkiScheduler(settings);
  });

  const baseCard: SchedulerCard = {
    status: 'new',
    stepIndex: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: null,
  };

  describe('Learning Phase', () => {
    it('should handle New -> Again (stay at step 0)', () => {
      const card = { ...baseCard, status: 'new' as const };
      const result = scheduler.calculateNext(card, 'Again');

      expect(result.status).toBe('learning');
      expect(result.stepIndex).toBe(0);
      expect(result.interval).toBe(settings.learningSteps[0]); // 1 min
    });

    it('should handle New -> Hard (stay at step 0)', () => {
      const card = { ...baseCard, status: 'new' as const };
      const result = scheduler.calculateNext(card, 'Hard');

      expect(result.status).toBe('learning');
      expect(result.stepIndex).toBe(0);
      expect(result.interval).toBe(settings.learningSteps[0]); // 1 min
    });

    it('should handle New -> Good (advance to step 1)', () => {
      const card = { ...baseCard, status: 'new' as const };
      const result = scheduler.calculateNext(card, 'Good');

      expect(result.status).toBe('learning');
      expect(result.stepIndex).toBe(1);
      expect(result.interval).toBe(settings.learningSteps[1]); // 10 min
    });

    it('should handle New -> Easy (graduate immediately)', () => {
      const card = { ...baseCard, status: 'new' as const };
      const result = scheduler.calculateNext(card, 'Easy');

      expect(result.status).toBe('review');
      expect(result.stepIndex).toBe(0);
      expect(result.interval).toBe(settings.easyInterval); // 4 days
      expect(result.easeFactor).toBe(2.5);
    });

    it('should graduate after completing all learning steps', () => {
      // Assuming we are at the last step (index 1 for [1, 10])
      const card: SchedulerCard = {
        ...baseCard,
        status: 'learning',
        stepIndex: 1,
        interval: 10,
      };
      const result = scheduler.calculateNext(card, 'Good');

      expect(result.status).toBe('review');
      expect(result.stepIndex).toBe(0);
      expect(result.interval).toBe(settings.graduatingInterval); // 1 day
      expect(result.easeFactor).toBe(2.5);
    });
  });

  describe('Review Phase', () => {
    const reviewCard: SchedulerCard = {
      status: 'review',
      stepIndex: 0,
      easeFactor: 2.5,
      interval: 10, // 10 days
      nextReviewDate: new Date(),
    };

    it('should handle Review -> Good (standard growth)', () => {
      const result = scheduler.calculateNext(reviewCard, 'Good');

      expect(result.status).toBe('review');
      // New Interval = Current Interval * Ease Factor = 10 * 2.5 = 25
      expect(result.interval).toBe(25);
      expect(result.easeFactor).toBe(2.5); // Unchanged
    });

    it('should handle Review -> Hard (reduced growth, ease penalty)', () => {
      const result = scheduler.calculateNext(reviewCard, 'Hard');

      expect(result.status).toBe('review');
      // New Interval = Current Interval * HardFactor = 10 * 1.2 = 12
      expect(result.interval).toBe(12);
      // Ease Factor = 2.5 - 0.15 = 2.35
      expect(result.easeFactor).toBeCloseTo(2.35);
    });

    it('should handle Review -> Easy (bonus growth, ease bonus)', () => {
      const result = scheduler.calculateNext(reviewCard, 'Easy');

      expect(result.status).toBe('review');
      // New Interval = Current Interval * Ease Factor * EasyBonus = 10 * 2.5 * 1.3 = 32.5 -> floor(32.5) = 32
      expect(result.interval).toBe(32);
      // Ease Factor = 2.5 + 0.15 = 2.65
      expect(result.easeFactor).toBeCloseTo(2.65);
    });

    it('should handle Review -> Again (lapse to relearning)', () => {
      const result = scheduler.calculateNext(reviewCard, 'Again');

      expect(result.status).toBe('relearning');
      expect(result.stepIndex).toBe(0);
      expect(result.interval).toBe(settings.relearningSteps[0]); // 10 min
      // Ease Factor = 2.5 - 0.2 = 2.3
      expect(result.easeFactor).toBeCloseTo(2.3);
    });

    it('should enforce minimum ease factor', () => {
      const lowEaseCard: SchedulerCard = { ...reviewCard, easeFactor: 1.3 };
      const result = scheduler.calculateNext(lowEaseCard, 'Again');

      // Ease Factor should not drop below 1.3
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('Relearning Phase', () => {
    const relearningCard: SchedulerCard = {
      status: 'relearning',
      stepIndex: 0,
      easeFactor: 2.3,
      interval: 10,
      nextReviewDate: new Date(),
    };

    it('should handle Relearning -> Again (reset step)', () => {
      const card = { ...relearningCard, stepIndex: 0 }; // Assuming multi-step relearning if configured, but default is [10]
      const result = scheduler.calculateNext(card, 'Again');

      expect(result.status).toBe('relearning');
      expect(result.stepIndex).toBe(0);
      expect(result.interval).toBe(settings.relearningSteps[0]);
    });

    it('should handle Relearning -> Good (graduate)', () => {
      // Default relearning steps is [10], so index 0 is the last step
      const result = scheduler.calculateNext(relearningCard, 'Good');

      expect(result.status).toBe('review');
      expect(result.stepIndex).toBe(0);
      expect(result.interval).toBe(settings.graduatingInterval); // 1 day
    });
  });
});
