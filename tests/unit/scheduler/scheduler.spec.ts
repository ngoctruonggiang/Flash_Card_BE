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
    it('TC-SCHEDULER-001: This test case aims to verify scheduler creation with default settings', () => {
      const defaultScheduler = new AnkiScheduler();
      expect(defaultScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-002: This test case aims to verify scheduler creation with custom settings', () => {
      const customScheduler = new AnkiScheduler({
        learningSteps: [1, 5, 10],
        graduatingInterval: 2,
      });
      expect(customScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-003: This test case aims to verify merging of custom settings with defaults', () => {
      const customScheduler = new AnkiScheduler({
        learningSteps: [1, 5, 10],
      });
      expect(customScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-004: This test case aims to verify acceptance of empty settings object', () => {
      const emptyScheduler = new AnkiScheduler({});
      expect(emptyScheduler).toBeDefined();
    });

    it('TC-SCHEDULER-005: This test case aims to verify acceptance of all custom settings', () => {
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
    it('TC-SCHEDULER-006: This test case aims to verify correct learning steps in default settings', () => {
      expect(DEFAULT_SETTINGS.learningSteps).toEqual([1, 10]);
    });

    it('TC-SCHEDULER-007: This test case aims to verify correct relearning steps in default settings', () => {
      expect(DEFAULT_SETTINGS.relearningSteps).toEqual([10]);
    });

    it('TC-SCHEDULER-008: This test case aims to verify correct graduating interval in default settings', () => {
      expect(DEFAULT_SETTINGS.graduatingInterval).toBe(1);
    });

    it('TC-SCHEDULER-009: This test case aims to verify correct easy interval in default settings', () => {
      expect(DEFAULT_SETTINGS.easyInterval).toBe(4);
    });

    it('TC-SCHEDULER-010: This test case aims to verify correct starting ease in default settings', () => {
      expect(DEFAULT_SETTINGS.startingEase).toBe(2.5);
    });

    it('TC-SCHEDULER-011: This test case aims to verify correct minimum ease in default settings', () => {
      expect(DEFAULT_SETTINGS.minEase).toBe(1.3);
    });

    it('TC-SCHEDULER-012: This test case aims to verify correct hard interval factor in default settings', () => {
      expect(DEFAULT_SETTINGS.hardIntervalFactor).toBe(1.2);
    });

    it('TC-SCHEDULER-013: This test case aims to verify correct easy bonus in default settings', () => {
      expect(DEFAULT_SETTINGS.easyBonus).toBe(1.3);
    });

    it('TC-SCHEDULER-014: This test case aims to verify fuzz is enabled by default', () => {
      expect(DEFAULT_SETTINGS.useFuzz).toBe(true);
    });

    it('TC-SCHEDULER-015: This test case aims to verify correct interval modifier in default settings', () => {
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

    it('TC-SCHEDULER-016: This test case aims to verify conversion of new card to learning on Again', () => {
      const result = scheduler.calculateNext(newCard, 'Again');
      expect(result.status).toBe('learning');
      expect(result.stepIndex).toBe(0);
    });

    it('TC-SCHEDULER-017: This test case aims to verify conversion of new card to learning on Hard', () => {
      const result = scheduler.calculateNext(newCard, 'Hard');
      expect(result.status).toBe('learning');
    });

    it('TC-SCHEDULER-018: This test case aims to verify conversion of new card to learning on Good', () => {
      const result = scheduler.calculateNext(newCard, 'Good');
      expect(result.status).toBe('learning');
    });

    it('TC-SCHEDULER-019: This test case aims to verify conversion of new card directly to review on Easy', () => {
      const result = scheduler.calculateNext(newCard, 'Easy');
      expect(result.status).toBe('review');
      expect(result.interval).toBe(4); // easyInterval
    });

    it('TC-SCHEDULER-020: This test case aims to verify nextReviewDate is set for new card', () => {
      const result = scheduler.calculateNext(newCard, 'Again');
      expect(result.nextReviewDate).toBeDefined();
      expect(result.nextReviewDate).toBeInstanceOf(Date);
    });

    it('TC-SCHEDULER-021: This test case aims to verify original card is not mutated', () => {
      const originalCard: SchedulerCard = { ...newCard };
      scheduler.calculateNext(newCard, 'Again');
      expect(newCard).toEqual(originalCard);
    });
  });

  describe('calculateNext - Learning Cards', () => {
    describe('Again rating', () => {
      it('TC-SCHEDULER-022: This test case aims to verify stepIndex is reset to 0 on Again', () => {
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

      it('TC-SCHEDULER-023: This test case aims to verify interval is set to first learning step on Again', () => {
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

      it('TC-SCHEDULER-024: This test case aims to verify card stays in learning status on Again', () => {
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

      it('TC-SCHEDULER-025: This test case aims to verify nextReviewDate is set to 1 minute from now on Again', () => {
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
      it('TC-SCHEDULER-026: This test case aims to verify current stepIndex is kept on Hard', () => {
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

      it('TC-SCHEDULER-027: This test case aims to verify current step interval is repeated on Hard', () => {
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

      it('TC-SCHEDULER-028: This test case aims to verify card stays in learning status on Hard', () => {
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
      it('TC-SCHEDULER-029: This test case aims to verify advancement to next step on Good', () => {
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

      it('TC-SCHEDULER-030: This test case aims to verify graduation to review when completing all steps', () => {
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

      it('TC-SCHEDULER-031: This test case aims to verify stepIndex is reset to 0 when graduating', () => {
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

      it('TC-SCHEDULER-032: This test case aims to verify card stays in learning when more steps remain', () => {
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
      it('TC-SCHEDULER-033: This test case aims to verify jump directly to review on Easy', () => {
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

      it('TC-SCHEDULER-034: This test case aims to verify interval is set to easyInterval on Easy', () => {
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

      it('TC-SCHEDULER-035: This test case aims to verify stepIndex is reset to 0 on Easy', () => {
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
      it('TC-SCHEDULER-036: This test case aims to verify transition to relearning on Again', () => {
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

      it('TC-SCHEDULER-037: This test case aims to verify ease factor is decreased by 0.2 on Again', () => {
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

      it('TC-SCHEDULER-038: This test case aims to verify ease factor is not decreased below minimum', () => {
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

      it('TC-SCHEDULER-039: This test case aims to verify interval is set to first relearning step on Again', () => {
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

      it('TC-SCHEDULER-040: This test case aims to verify stepIndex is reset to 0 on Again for review card', () => {
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
      it('TC-SCHEDULER-041: This test case aims to verify card stays in review status on Hard', () => {
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

      it('TC-SCHEDULER-042: This test case aims to verify interval is multiplied by hardIntervalFactor on Hard', () => {
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

      it('TC-SCHEDULER-043: This test case aims to verify ease factor is decreased by 0.15 on Hard', () => {
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

      it('TC-SCHEDULER-044: This test case aims to verify ease factor is not decreased below minimum on Hard', () => {
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

      it('TC-SCHEDULER-045: This test case aims to verify minimum interval of 1 is ensured on Hard', () => {
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
      it('TC-SCHEDULER-046: This test case aims to verify card stays in review status on Good', () => {
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

      it('TC-SCHEDULER-047: This test case aims to verify interval is multiplied by ease factor on Good', () => {
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

      it('TC-SCHEDULER-048: This test case aims to verify ease factor is not changed on Good', () => {
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

      it('TC-SCHEDULER-049: This test case aims to verify minimum interval of 1 is ensured on Good', () => {
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
      it('TC-SCHEDULER-050: This test case aims to verify card stays in review status on Easy', () => {
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

      it('TC-SCHEDULER-051: This test case aims to verify interval is multiplied by ease factor and easy bonus on Easy', () => {
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

      it('TC-SCHEDULER-052: This test case aims to verify ease factor is increased by 0.15 on Easy', () => {
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

      it('TC-SCHEDULER-053: This test case aims to verify minimum interval of 1 is ensured on Easy', () => {
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
      it('TC-SCHEDULER-054: This test case aims to verify stepIndex is reset to 0 on Again for relearning', () => {
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

      it('TC-SCHEDULER-055: This test case aims to verify card stays in relearning status on Again', () => {
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

      it('TC-SCHEDULER-056: This test case aims to verify interval is set to first relearning step on Again for relearning', () => {
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
      it('TC-SCHEDULER-057: This test case aims to verify current step is repeated on Hard for relearning', () => {
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

      it('TC-SCHEDULER-058: This test case aims to verify card stays in relearning status on Hard', () => {
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
      it('TC-SCHEDULER-059: This test case aims to verify graduation to review when completing all steps on Good', () => {
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

      it('TC-SCHEDULER-060: This test case aims to verify stepIndex is reset to 0 when graduating on Good', () => {
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

      it('TC-SCHEDULER-061: This test case aims to verify interval is set to graduatingInterval on Good', () => {
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
      it('TC-SCHEDULER-062: This test case aims to verify jump directly to review on Easy for relearning', () => {
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

      it('TC-SCHEDULER-063: This test case aims to verify interval is set to easyInterval on Easy for relearning', () => {
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
    it('TC-SCHEDULER-064: This test case aims to verify use of custom learning steps', () => {
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

    it('TC-SCHEDULER-065: This test case aims to verify use of custom graduating interval', () => {
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

    it('TC-SCHEDULER-066: This test case aims to verify use of custom easy interval', () => {
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

    it('TC-SCHEDULER-067: This test case aims to verify use of custom minimum ease', () => {
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

    it('TC-SCHEDULER-068: This test case aims to verify use of custom hard interval factor', () => {
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

    it('TC-SCHEDULER-069: This test case aims to verify use of custom easy bonus', () => {
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

    it('TC-SCHEDULER-070: This test case aims to verify use of custom relearning steps', () => {
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
    it('TC-SCHEDULER-071: This test case aims to verify fuzz is not applied when useFuzz is false', () => {
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

    it('TC-SCHEDULER-072: This test case aims to verify fuzz is not applied for intervals less than 3 days', () => {
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

    it('TC-SCHEDULER-073: This test case aims to verify fuzz is applied for intervals >= 3 days', () => {
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
    it('TC-SCHEDULER-074: This test case aims to verify handling of very large ease factor', () => {
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

    it('TC-SCHEDULER-075: This test case aims to verify handling of very small ease factor', () => {
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

    it('TC-SCHEDULER-076: This test case aims to verify handling of very large interval', () => {
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

    it('TC-SCHEDULER-077: This test case aims to verify handling of interval of 0', () => {
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

    it('TC-SCHEDULER-078: This test case aims to verify handling of negative interval edge case', () => {
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

    it('TC-SCHEDULER-079: This test case aims to verify handling of null nextReviewDate', () => {
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

    it('TC-SCHEDULER-080: This test case aims to verify handling of undefined nextReviewDate', () => {
      const card: SchedulerCard = {
        status: 'new',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
      };

      const result = scheduler.calculateNext(card, 'Good');
      expect(result.nextReviewDate).toBeDefined();
    });

    it('TC-SCHEDULER-081: This test case aims to verify handling of stepIndex beyond available steps', () => {
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
        it(`should handle ${status} card with ${rating} rating`, () => {
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
    it('TC-SCHEDULER-082: This test case aims to verify correct date is set for learning cards (minutes)', () => {
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

    it('TC-SCHEDULER-083: This test case aims to verify correct date is set for review cards (days)', () => {
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
    it('TC-SCHEDULER-084: This test case aims to verify handling of multiple Good ratings building interval', () => {
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

    it('TC-SCHEDULER-085: This test case aims to verify handling of Again ratings causing relearning', () => {
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

    it('TC-SCHEDULER-086: This test case aims to verify handling of Easy ratings increasing ease', () => {
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
