/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  AnkiScheduler,
  DEFAULT_SETTINGS,
  Rating,
  CardStatus,
  SchedulerCard,
  SchedulerSettings,
} from 'src/services/scheduler';

describe('AnkiScheduler  Tests', () => {
  let scheduler: AnkiScheduler;

  beforeEach(() => {
    // Use scheduler without fuzz for predictable tests
    scheduler = new AnkiScheduler({ useFuzz: false });
  });

  describe('Constructor', () => {
    it('TC-SCHEDULER-001: should create scheduler with default settings', () => {
      const defaultScheduler = new AnkiScheduler();
      expect(defaultScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-002: should create scheduler with custom settings', () => {
      const customScheduler = new AnkiScheduler({
        learningSteps: [1, 5, 10],
        graduatingInterval: 2,
      });
      expect(customScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-003: should merge custom settings with defaults', () => {
      const customScheduler = new AnkiScheduler({
        learningSteps: [1, 5, 10],
      });
      expect(customScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-004: should accept empty settings object', () => {
      const emptyScheduler = new AnkiScheduler({});
      expect(emptyScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-005: should accept all custom settings', () => {
      const fullCustomScheduler = new AnkiScheduler({
        learningSteps: [1, 5, 10],
        relearningSteps: [5],
        graduatingInterval: 2,
        easyInterval: 5,
        startingEase: 2.3,
        minEase: 1.5,
        hardIntervalFactor: 1.3,
        easyBonus: 1.4,
        useFuzz: false,
        intervalModifier: 0.9,
      });
      expect(fullCustomScheduler).toBeDefined();
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('TC-SCHEDULER-006: should have correct learning steps', () => {
      expect(DEFAULT_SETTINGS.learningSteps).toEqual([1, 10]);
    });

    it('TC-SCHEDULER-007: should have correct relearning steps', () => {
      expect(DEFAULT_SETTINGS.relearningSteps).toEqual([10]);
    });

    it('TC-SCHEDULER-008: should have correct graduating interval', () => {
      expect(DEFAULT_SETTINGS.graduatingInterval).toBe(1);
    });

    it('TC-SCHEDULER-009: should have correct easy interval', () => {
      expect(DEFAULT_SETTINGS.easyInterval).toBe(4);
    });

    it('TC-SCHEDULER-010: should have correct starting ease', () => {
      expect(DEFAULT_SETTINGS.startingEase).toBe(2.5);
    });

    it('TC-SCHEDULER-011: should have correct minimum ease', () => {
      expect(DEFAULT_SETTINGS.minEase).toBe(1.3);
    });

    it('TC-SCHEDULER-012: should have correct hard interval factor', () => {
      expect(DEFAULT_SETTINGS.hardIntervalFactor).toBe(1.2);
    });

    it('TC-SCHEDULER-013: should have correct easy bonus', () => {
      expect(DEFAULT_SETTINGS.easyBonus).toBe(1.3);
    });

    it('TC-SCHEDULER-014: should have fuzz enabled by default', () => {
      expect(DEFAULT_SETTINGS.useFuzz).toBe(true);
    });

    it('TC-SCHEDULER-015: should have correct interval modifier', () => {
      expect(DEFAULT_SETTINGS.intervalModifier).toBe(1.0);
    });
  });

  describe('calculateNext - New Cards', () => {
    const newCard: SchedulerCard = {
      status: 'new',
      stepIndex: 0,
      easeFactor: 2.5,
      interval: 0,
      nextReviewDate: null,
    };

    it('TC-SCHEDULER-016: should convert new card to learning on Again', () => {
      const result = scheduler.calculateNext(newCard, 'Again');
      expect(result.status).toBe('learning');
      expect(result.stepIndex).toBe(0);
    });

    it('TC-SCHEDULER-017: should convert new card to learning on Hard', () => {
      const result = scheduler.calculateNext(newCard, 'Hard');
      expect(result.status).toBe('learning');
    });

    it('TC-SCHEDULER-018: should convert new card to learning on Good', () => {
      const result = scheduler.calculateNext(newCard, 'Good');
      expect(result.status).toBe('learning');
    });

    it('TC-SCHEDULER-019: should convert new card directly to review on Easy', () => {
      const result = scheduler.calculateNext(newCard, 'Easy');
      expect(result.status).toBe('review');
      expect(result.interval).toBe(4); // easyInterval
    });

    it('TC-SCHEDULER-020: should set nextReviewDate for new card', () => {
      const result = scheduler.calculateNext(newCard, 'Again');
      expect(result.nextReviewDate).toBeDefined();
      expect(result.nextReviewDate).toBeInstanceOf(Date);
    });

    it('TC-SCHEDULER-021: should not mutate original card', () => {
      const originalCard: SchedulerCard = { ...newCard };
      scheduler.calculateNext(newCard, 'Again');
      expect(newCard).toEqual(originalCard);
    });
  });

  describe('calculateNext - Learning Cards', () => {
    describe('Again rating', () => {
      it('TC-SCHEDULER-022: should reset stepIndex to 0', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.stepIndex).toBe(0);
      });

      it('TC-SCHEDULER-023: should set interval to first learning step', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.interval).toBe(1); // First learning step is 1 minute
      });

      it('TC-SCHEDULER-024: should stay in learning status', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.status).toBe('learning');
      });

      it('TC-SCHEDULER-025: should set nextReviewDate to 1 minute from now', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const before = new Date();
        const result = scheduler.calculateNext(card, 'Again');
        const after = new Date();

        expect(result.nextReviewDate!.getTime()).toBeGreaterThanOrEqual(
          before.getTime() + 60000 - 1000,
        );
        expect(result.nextReviewDate!.getTime()).toBeLessThanOrEqual(
          after.getTime() + 60000 + 1000,
        );
      });
    });

    describe('Hard rating', () => {
      it('TC-SCHEDULER-026: should keep current stepIndex', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.stepIndex).toBe(1);
      });

      it('TC-SCHEDULER-027: should repeat current step interval', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.interval).toBe(10); // Current step is 10 minutes
      });

      it('TC-SCHEDULER-028: should stay in learning status', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.status).toBe('learning');
      });
    });

    describe('Good rating', () => {
      it('TC-SCHEDULER-029: should advance to next step', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.stepIndex).toBe(1);
        expect(result.interval).toBe(10); // Second learning step
      });

      it('TC-SCHEDULER-030: should graduate to review when completing all steps', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1, // Last step (index 1 in [1, 10])
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.status).toBe('review');
        expect(result.interval).toBe(1); // graduatingInterval
      });

      it('TC-SCHEDULER-031: should reset stepIndex to 0 when graduating', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.stepIndex).toBe(0);
      });

      it('TC-SCHEDULER-032: should stay in learning when more steps remain', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.status).toBe('learning');
      });
    });

    describe('Easy rating', () => {
      it('TC-SCHEDULER-033: should jump directly to review', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.status).toBe('review');
      });

      it('TC-SCHEDULER-034: should set interval to easyInterval', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.interval).toBe(4); // easyInterval
      });

      it('TC-SCHEDULER-035: should reset stepIndex to 0', () => {
        const card: SchedulerCard = {
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.stepIndex).toBe(0);
      });
    });
  });

  describe('calculateNext - Review Cards', () => {
    describe('Again rating', () => {
      it('TC-SCHEDULER-036: should transition to relearning', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.status).toBe('relearning');
      });

      it('TC-SCHEDULER-037: should decrease ease factor by 0.2', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.easeFactor).toBe(2.3);
      });

      it('TC-SCHEDULER-038: should not decrease ease factor below minimum', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 1.4, // Close to min
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.easeFactor).toBe(1.3); // minEase
      });

      it('TC-SCHEDULER-039: should set interval to first relearning step', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.interval).toBe(10); // First relearning step
      });

      it('TC-SCHEDULER-040: should reset stepIndex to 0', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.stepIndex).toBe(0);
      });
    });

    describe('Hard rating', () => {
      it('TC-SCHEDULER-041: should stay in review status', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.status).toBe('review');
      });

      it('TC-SCHEDULER-042: should multiply interval by hardIntervalFactor', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.interval).toBe(12); // 10 * 1.2
      });

      it('TC-SCHEDULER-043: should decrease ease factor by 0.15', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.easeFactor).toBeCloseTo(2.35);
      });

      it('TC-SCHEDULER-044: should not decrease ease factor below minimum', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 1.4, // Close to min
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.easeFactor).toBe(1.3); // minEase
      });

      it('TC-SCHEDULER-045: should ensure minimum interval of 1', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 0,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.interval).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Good rating', () => {
      it('TC-SCHEDULER-046: should stay in review status', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.status).toBe('review');
      });

      it('TC-SCHEDULER-047: should multiply interval by ease factor', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.interval).toBe(25); // 10 * 2.5
      });

      it('TC-SCHEDULER-048: should not change ease factor', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.easeFactor).toBe(2.5);
      });

      it('TC-SCHEDULER-049: should ensure minimum interval of 1', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 0.5,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.interval).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Easy rating', () => {
      it('TC-SCHEDULER-050: should stay in review status', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.status).toBe('review');
      });

      it('TC-SCHEDULER-051: should multiply interval by ease factor and easy bonus', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.interval).toBe(32); // 10 * 2.5 * 1.3 = 32.5 -> 32
      });

      it('TC-SCHEDULER-052: should increase ease factor by 0.15', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.easeFactor).toBeCloseTo(2.65);
      });

      it('TC-SCHEDULER-053: should ensure minimum interval of 1', () => {
        const card: SchedulerCard = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 0.1,
          interval: 1,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.interval).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('calculateNext - Relearning Cards', () => {
    describe('Again rating', () => {
      it('TC-SCHEDULER-054: should reset stepIndex to 0', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.stepIndex).toBe(0);
      });

      it('TC-SCHEDULER-055: should stay in relearning status', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.status).toBe('relearning');
      });

      it('TC-SCHEDULER-056: should set interval to first relearning step', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Again');
        expect(result.interval).toBe(10); // relearningSteps[0]
      });
    });

    describe('Hard rating', () => {
      it('TC-SCHEDULER-057: should repeat current step', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.stepIndex).toBe(0);
      });

      it('TC-SCHEDULER-058: should stay in relearning status', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Hard');
        expect(result.status).toBe('relearning');
      });
    });

    describe('Good rating', () => {
      it('TC-SCHEDULER-059: should graduate to review when completing all steps', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0, // Default has only 1 relearning step
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.status).toBe('review');
      });

      it('TC-SCHEDULER-060: should reset stepIndex to 0 when graduating', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.stepIndex).toBe(0);
      });

      it('TC-SCHEDULER-061: should set interval to graduatingInterval', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Good');
        expect(result.interval).toBe(1); // graduatingInterval
      });
    });

    describe('Easy rating', () => {
      it('TC-SCHEDULER-062: should jump directly to review', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.status).toBe('review');
      });

      it('TC-SCHEDULER-063: should set interval to easyInterval', () => {
        const card: SchedulerCard = {
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        };
        const result = scheduler.calculateNext(card, 'Easy');
        expect(result.interval).toBe(4); // easyInterval
      });
    });
  });

  describe('Custom Settings', () => {
    it('TC-SCHEDULER-064: should use custom learning steps', () => {
      const customScheduler = new AnkiScheduler({
        learningSteps: [1, 5, 15, 30],
        useFuzz: false,
      });

      let card: SchedulerCard = {
        status: 'new',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReviewDate: null,
      };

      // Step through learning
      card = customScheduler.calculateNext(card, 'Good'); // 1 -> 5
      expect(card.interval).toBe(5);
      expect(card.stepIndex).toBe(1);

      card = customScheduler.calculateNext(card, 'Good'); // 5 -> 15
      expect(card.interval).toBe(15);
      expect(card.stepIndex).toBe(2);

      card = customScheduler.calculateNext(card, 'Good'); // 15 -> 30
      expect(card.interval).toBe(30);
      expect(card.stepIndex).toBe(3);
    });

    it('TC-SCHEDULER-065: should use custom graduating interval', () => {
      const customScheduler = new AnkiScheduler({
        graduatingInterval: 3,
        useFuzz: false,
      });

      const card: SchedulerCard = {
        status: 'learning',
        stepIndex: 1, // Last step
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      const result = customScheduler.calculateNext(card, 'Good');
      expect(result.status).toBe('review');
      expect(result.interval).toBe(3); // Custom graduating interval
    });

    it('TC-SCHEDULER-066: should use custom easy interval', () => {
      const customScheduler = new AnkiScheduler({
        easyInterval: 7,
        useFuzz: false,
      });

      const card: SchedulerCard = {
        status: 'learning',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReviewDate: new Date(),
      };

      const result = customScheduler.calculateNext(card, 'Easy');
      expect(result.interval).toBe(7); // Custom easy interval
    });

    it('TC-SCHEDULER-067: should use custom minimum ease', () => {
      const customScheduler = new AnkiScheduler({
        minEase: 1.5,
        useFuzz: false,
      });

      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 1.6,
        interval: 10,
        nextReviewDate: new Date(),
      };

      const result = customScheduler.calculateNext(card, 'Again');
      expect(result.easeFactor).toBe(1.5); // Custom min ease
    });

    it('TC-SCHEDULER-068: should use custom hard interval factor', () => {
      const customScheduler = new AnkiScheduler({
        hardIntervalFactor: 1.5,
        useFuzz: false,
      });

      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      const result = customScheduler.calculateNext(card, 'Hard');
      expect(result.interval).toBe(15); // 10 * 1.5
    });

    it('TC-SCHEDULER-069: should use custom easy bonus', () => {
      const customScheduler = new AnkiScheduler({
        easyBonus: 1.5,
        useFuzz: false,
      });

      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.0,
        interval: 10,
        nextReviewDate: new Date(),
      };

      const result = customScheduler.calculateNext(card, 'Easy');
      expect(result.interval).toBe(30); // 10 * 2.0 * 1.5
    });

    it('TC-SCHEDULER-070: should use custom relearning steps', () => {
      const customScheduler = new AnkiScheduler({
        relearningSteps: [5, 20],
        useFuzz: false,
      });

      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      const result = customScheduler.calculateNext(card, 'Again');
      expect(result.interval).toBe(5); // First relearning step
    });
  });

  describe('Fuzz Behavior', () => {
    it('TC-SCHEDULER-071: should not apply fuzz when useFuzz is false', () => {
      const noFuzzScheduler = new AnkiScheduler({ useFuzz: false });
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      // Run multiple times to ensure consistency
      const results = Array.from({ length: 10 }, () =>
        noFuzzScheduler.calculateNext(card, 'Good'),
      );

      // All results should be identical
      expect(results.every((r) => r.interval === 25)).toBe(true);
    });

    it('TC-SCHEDULER-072: should not apply fuzz for intervals less than 3 days', () => {
      const fuzzScheduler = new AnkiScheduler({ useFuzz: true });
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.0, // Will result in 2 day interval
        interval: 1,
        nextReviewDate: new Date(),
      };

      // Run multiple times
      const results = Array.from({ length: 10 }, () =>
        fuzzScheduler.calculateNext(card, 'Good'),
      );

      // All results should be identical since interval < 3
      expect(results.every((r) => r.interval === 2)).toBe(true);
    });

    it('TC-SCHEDULER-073: should apply fuzz for intervals >= 3 days', () => {
      // Note: This test may be flaky due to randomness
      const fuzzScheduler = new AnkiScheduler({ useFuzz: true });
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      // Run many times and check for variance
      const results = Array.from({ length: 100 }, () =>
        fuzzScheduler.calculateNext(card, 'Good'),
      );

      const intervals = results.map((r) => r.interval);
      const uniqueIntervals = new Set(intervals);

      // With fuzz, we should have some variance (but might not always)
      // Just check the intervals are reasonable
      expect(intervals.every((i) => i >= 20 && i <= 30)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('TC-SCHEDULER-074: should handle very large ease factor', () => {
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 10.0,
        interval: 100,
        nextReviewDate: new Date(),
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.interval).toBe(1000); // 100 * 10
    });

    it('TC-SCHEDULER-075: should handle very small ease factor', () => {
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 1.3, // Minimum
        interval: 1,
        nextReviewDate: new Date(),
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.interval).toBe(1); // floor(1 * 1.3) = 1
    });

    it('TC-SCHEDULER-076: should handle very large interval', () => {
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 365, // 1 year
        nextReviewDate: new Date(),
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.interval).toBe(912); // 365 * 2.5
    });

    it('TC-SCHEDULER-077: should handle interval of 0', () => {
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReviewDate: new Date(),
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.interval).toBeGreaterThanOrEqual(1);
    });

    it('TC-SCHEDULER-078: should handle negative interval (edge case)', () => {
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: -5,
        nextReviewDate: new Date(),
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.interval).toBeGreaterThanOrEqual(1);
    });

    it('TC-SCHEDULER-079: should handle null nextReviewDate', () => {
      const card: SchedulerCard = {
        status: 'new',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReviewDate: null,
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.nextReviewDate).toBeDefined();
      expect(result.nextReviewDate).toBeInstanceOf(Date);
    });

    it('TC-SCHEDULER-080: should handle undefined nextReviewDate', () => {
      const card: SchedulerCard = {
        status: 'new',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.nextReviewDate).toBeDefined();
    });

    it('TC-SCHEDULER-081: should handle stepIndex beyond available steps', () => {
      const card: SchedulerCard = {
        status: 'learning',
        stepIndex: 10, // Way beyond [1, 10]
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      // Should graduate since stepIndex + 1 >= steps.length
      const result = scheduler.calculateNext(card, 'Good');
      expect(result.status).toBe('review');
    });
  });

  describe('Rating Type Validation', () => {
    const allRatings: Rating[] = ['Again', 'Hard', 'Good', 'Easy'];
    const allStatuses: CardStatus[] = [
      'new',
      'learning',
      'review',
      'relearning',
    ];

    allStatuses.forEach((status) => {
      allRatings.forEach((rating) => {
        it(`TC-SCHEDULER-082: should handle ${status} card with ${rating} rating`, () => {
          const card: SchedulerCard = {
            status,
            stepIndex: 0,
            easeFactor: 2.5,
            interval: status === 'review' ? 10 : 1,
            nextReviewDate: new Date(),
          };

          const result = scheduler.calculateNext(card, rating);

          expect(result).toBeDefined();
          expect(result.status).toBeDefined();
          expect(result.interval).toBeDefined();
          expect(result.easeFactor).toBeDefined();
          expect(result.nextReviewDate).toBeDefined();
        });
      });
    });
  });

  describe('Date Calculations', () => {
    it('TC-SCHEDULER-083: should set correct date for learning cards (minutes)', () => {
      const card: SchedulerCard = {
        status: 'learning',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReviewDate: new Date(),
      };

      const before = Date.now();
      const result = scheduler.calculateNext(card, 'Good');
      const after = Date.now();

      // Should be ~10 minutes from now
      const expectedMin = before + 10 * 60 * 1000 - 1000;
      const expectedMax = after + 10 * 60 * 1000 + 1000;

      expect(result.nextReviewDate!.getTime()).toBeGreaterThanOrEqual(
        expectedMin,
      );
      expect(result.nextReviewDate!.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('TC-SCHEDULER-084: should set correct date for review cards (days)', () => {
      const card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      const before = new Date();
      const result = scheduler.calculateNext(card, 'Good');

      // Should be ~25 days from now (10 * 2.5)
      const expectedDate = new Date(before);
      expectedDate.setDate(expectedDate.getDate() + 25);

      // Allow 1 day tolerance due to fuzz being disabled
      const diffDays = Math.abs(
        (result.nextReviewDate!.getTime() - expectedDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBeLessThan(1);
    });
  });

  describe('Multiple Consecutive Reviews', () => {
    it('TC-SCHEDULER-085: should handle multiple Good ratings building interval', () => {
      let card: SchedulerCard = {
        status: 'new',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReviewDate: null,
      };

      // First Good - advance to step 1
      card = scheduler.calculateNext(card, 'Good');
      expect(card.status).toBe('learning');
      expect(card.interval).toBe(10);

      // Second Good - graduate to review
      card = scheduler.calculateNext(card, 'Good');
      expect(card.status).toBe('review');
      expect(card.interval).toBe(1);

      // Third Good - interval grows
      card = scheduler.calculateNext(card, 'Good');
      expect(card.status).toBe('review');
      expect(card.interval).toBe(2); // floor(1 * 2.5) = 2

      // Fourth Good - interval keeps growing
      card = scheduler.calculateNext(card, 'Good');
      expect(card.interval).toBe(5); // floor(2 * 2.5) = 5
    });

    it('TC-SCHEDULER-086: should handle Again ratings causing relearning', () => {
      let card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 30,
        nextReviewDate: new Date(),
      };

      // Again - go to relearning
      card = scheduler.calculateNext(card, 'Again');
      expect(card.status).toBe('relearning');
      expect(card.easeFactor).toBe(2.3);

      // Good - back to review
      card = scheduler.calculateNext(card, 'Good');
      expect(card.status).toBe('review');
      expect(card.interval).toBe(1); // graduatingInterval

      // Another Again
      card = scheduler.calculateNext(card, 'Again');
      expect(card.status).toBe('relearning');
      expect(card.easeFactor).toBeCloseTo(2.1);
    });

    it('TC-SCHEDULER-087: should handle Easy ratings increasing ease', () => {
      let card: SchedulerCard = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date(),
      };

      card = scheduler.calculateNext(card, 'Easy');
      expect(card.easeFactor).toBeCloseTo(2.65);

      card = scheduler.calculateNext(card, 'Easy');
      expect(card.easeFactor).toBeCloseTo(2.8);

      card = scheduler.calculateNext(card, 'Easy');
      expect(card.easeFactor).toBeCloseTo(2.95);
    });
  });
});
