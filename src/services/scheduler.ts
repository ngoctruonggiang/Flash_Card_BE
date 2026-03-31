export type Rating = 'Again' | 'Hard' | 'Good' | 'Easy';
export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

export interface SchedulerCard {
  status: CardStatus;
  stepIndex: number;
  easeFactor: number;
  interval: number;
  nextReviewDate?: Date | null;
}

export interface SchedulerSettings {
  learningSteps: number[];
  relearningSteps: number[];
  graduatingInterval: number;
  easyInterval: number;
  startingEase: number;
  minEase: number;
  hardIntervalFactor: number;
  easyBonus: number;
  useFuzz: boolean;
  intervalModifier: number;
}

export const DEFAULT_SETTINGS: SchedulerSettings = {
  learningSteps: [1, 10], // 1 min, 10 min
  relearningSteps: [10], // 10 min lapse step
  graduatingInterval: 1, // 1 day
  easyInterval: 4, // 4 days
  startingEase: 2.5,
  minEase: 1.3,
  hardIntervalFactor: 1.2,
  easyBonus: 1.3,
  useFuzz: true, // Prevent clumping
  intervalModifier: 1.0,
};

// Helpers
const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

const addDays = (d: Date, days: number) => {
  const newDate = new Date(d);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

// Fuzz: random variance to avoid clumping
const applyFuzz = (days: number, useFuzz: boolean): number => {
  if (days < 3 || !useFuzz) return days;
  const fuzzRange = days < 7 ? 0.15 : days < 30 ? 0.1 : 0.05;
  const fuzz = days * fuzzRange * (Math.random() - 0.5);
  return Math.max(1, Math.round(days + fuzz));
};

export class AnkiScheduler {
  private settings: SchedulerSettings;

  constructor(settings: Partial<SchedulerSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  public calculateNext(card: SchedulerCard, rating: Rating): SchedulerCard {
    // Clone to avoid mutation
    const next = { ...card };
    const now = new Date();

    // Normalize new cards into learning
    if (next.status === 'new') {
      next.status = 'learning';
      next.stepIndex = 0;
      next.interval = 0;
    }

    // --- PHASE 1: Learning & Relearning (minutes) ---
    if (next.status === 'learning' || next.status === 'relearning') {
      const steps =
        next.status === 'relearning'
          ? this.settings.relearningSteps
          : this.settings.learningSteps;

      if (rating === 'Again') {
        next.stepIndex = 0;
        next.interval = steps[0]; // 1 min
        next.nextReviewDate = addMinutes(now, steps[0]);
      } else if (rating === 'Hard') {
        // Repeat current step
        next.interval = Math.floor(steps[next.stepIndex] || steps[0]);
        next.nextReviewDate = addMinutes(now, next.interval);
      } else if (rating === 'Good') {
        const nextStepIdx = next.stepIndex + 1;
        if (nextStepIdx < steps.length) {
          // Still in learning steps
          next.stepIndex = nextStepIdx;
          next.interval = steps[nextStepIdx]; // e.g., 10 min
          next.nextReviewDate = addMinutes(now, next.interval);
        } else {
          // Graduate to review
          next.status = 'review';
          next.stepIndex = 0;
          next.interval = this.settings.graduatingInterval; // 1 day
          next.nextReviewDate = addDays(now, next.interval);
        }
      } else if (rating === 'Easy') {
        // Jump to review
        next.status = 'review';
        next.stepIndex = 0;
        next.interval = this.settings.easyInterval; // 4 days
        next.nextReviewDate = addDays(now, next.interval);
      }
    }

    // --- PHASE 2: Review (days) ---
    else if (next.status === 'review') {
      if (rating === 'Again') {
        // Lapse -> relearning
        next.status = 'relearning';
        next.stepIndex = 0;
        next.easeFactor = Math.max(
          this.settings.minEase,
          next.easeFactor - 0.2,
        );
        next.interval = this.settings.relearningSteps[0]; // minutes
        next.nextReviewDate = addMinutes(now, next.interval);
      } else if (rating === 'Hard') {
        next.interval = Math.max(
          1,
          Math.floor(next.interval * this.settings.hardIntervalFactor),
        );
        next.easeFactor = Math.max(
          this.settings.minEase,
          next.easeFactor - 0.15,
        );
        next.nextReviewDate = addDays(
          now,
          applyFuzz(next.interval, this.settings.useFuzz),
        );
      } else if (rating === 'Good') {
        next.interval = Math.max(
          1,
          Math.floor(next.interval * next.easeFactor),
        );
        next.nextReviewDate = addDays(
          now,
          applyFuzz(next.interval, this.settings.useFuzz),
        );
      } else if (rating === 'Easy') {
        next.interval = Math.max(
          1,
          Math.floor(next.interval * next.easeFactor * this.settings.easyBonus),
        );
        next.easeFactor = next.easeFactor + 0.15;
        next.nextReviewDate = addDays(
          now,
          applyFuzz(next.interval, this.settings.useFuzz),
        );
      }
    }

    return next;
  }
}
