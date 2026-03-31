# **Backend Specification: Anki Algorithm Service**

## **1. Overview**

The backend is responsible for maintaining the integrity of the Spaced Repetition System (SRS). It must strictly enforce the **Modified SM-2 Algorithm** logic. The backend acts as the single source of truth for calculating `nextReview` dates and `easeFactor`.

## **2. Database Schema**

The Card entity requires specific fields to support the state machine.

| Field Name  | Type      | Description                                         | Initial Value |
| ----------- | --------- | --------------------------------------------------- | ------------- |
| id          | UUID      | Unique Identifier                                   | —             |
| deck_id     | UUID      | Parent Deck ID                                      | —             |
| status      | Enum      | `new`, `learning`, `review`, `relearning`           | new           |
| step_index  | Integer   | Tracks intraday learning steps (index of `[1, 10]`) | 0             |
| ease_factor | Float     | Multiplier for interval growth (min 1.3)            | 2.5           |
| interval    | Integer   | **Review:** Days. **Learning:** Minutes.            | 0             |
| due_date    | Timestamp | Absolute timestamp of next review                   | NOW()         |

---

## **3. Core Algorithm Implementation (TypeScript)**

This module contains the pure business logic. It should be extracted into a shared service/library (`/src/services/scheduler.ts`).

```ts
/**
 * Anki Scheduler (Modified SM-2)
 * Pure business logic for calculating next intervals.
 */

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

export interface Card {
  id: string;
  status: CardStatus;
  stepIndex: number; // Index in learningSteps array
  easeFactor: number; // Multiplier (min 1.3)
  interval: number; // Days (Review) or Minutes (Learning)
  dueDate: Date; // Next review timestamp
}

export interface SchedulerSettings {
  learningSteps: number[]; // [1, 10] minutes
  relearningSteps: number[]; // [10] minutes
  graduatingInterval: number; // 1 day
  easyInterval: number; // 4 days
  startingEase: number; // 2.5
  minEase: number; // 1.3
  hardIntervalFactor: number; // 1.2
  easyBonus: number; // 1.3
  intervalModifier: number; // 1.0
  useFuzz: boolean; // true
}

export const DEFAULT_SETTINGS: SchedulerSettings = {
  learningSteps: [1, 10],
  relearningSteps: [10],
  graduatingInterval: 1,
  easyInterval: 4,
  startingEase: 2.5,
  minEase: 1.3,
  hardIntervalFactor: 1.2,
  easyBonus: 1.3,
  intervalModifier: 1.0,
  useFuzz: true,
};

// --- Helpers ---
const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60 * 1000);

const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const applyFuzz = (interval: number): number => {
  if (interval < 3) return interval;

  const fuzzRange = interval < 7 ? 0.15 : interval < 30 ? 0.1 : 0.05;
  const fuzzVector = Math.random() * fuzzRange;
  const fuzzDirection = Math.random() > 0.5 ? 1 : -1;

  return Math.round(interval + interval * fuzzVector * fuzzDirection);
};

// --- Main Class ---
export class AnkiScheduler {
  private settings: SchedulerSettings;

  constructor(settings: Partial<SchedulerSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  public calculateNextReview(currentCard: Card, rating: Rating): Card {
    let card = { ...currentCard };
    const now = new Date();

    if (['new', 'learning', 'relearning'].includes(card.status)) {
      this.handleLearningCard(card, rating, now);
    } else if (card.status === 'review') {
      this.handleReviewCard(card, rating, now);
    }

    return card;
  }

  private handleLearningCard(card: Card, rating: Rating, now: Date) {
    const steps =
      card.status === 'relearning'
        ? this.settings.relearningSteps
        : this.settings.learningSteps;

    switch (rating) {
      case 'again':
        card.stepIndex = 0;
        card.interval = steps[0];
        card.dueDate = addMinutes(now, steps[0]);
        break;

      case 'hard':
        card.interval = Math.floor(steps[card.stepIndex] || steps[0]);
        card.dueDate = addMinutes(now, card.interval);
        break;

      case 'good':
        const nextIndex = card.stepIndex + 1;
        if (nextIndex < steps.length) {
          card.stepIndex = nextIndex;
          card.interval = steps[nextIndex];
          card.dueDate = addMinutes(now, card.interval);
        } else {
          this.graduateCard(card, now);
        }
        break;

      case 'easy':
        this.graduateCard(card, now, true);
        break;
    }
  }

  private graduateCard(card: Card, now: Date, isEasyJump: boolean = false) {
    card.status = 'review';
    card.stepIndex = 0;

    const nextInterval = isEasyJump
      ? this.settings.easyInterval
      : this.settings.graduatingInterval;

    card.interval = nextInterval;
    card.dueDate = addDays(now, nextInterval);

    if (!card.easeFactor || card.easeFactor < 1.3) {
      card.easeFactor = this.settings.startingEase;
    }
  }

  private handleReviewCard(card: Card, rating: Rating, now: Date) {
    let newInterval = card.interval;
    let newEase = card.easeFactor;

    switch (rating) {
      case 'again':
        card.status = 'relearning';
        card.stepIndex = 0;
        newEase = Math.max(this.settings.minEase, newEase - 0.2);
        card.easeFactor = newEase;
        card.interval = this.settings.relearningSteps[0];
        card.dueDate = addMinutes(now, this.settings.relearningSteps[0]);
        return;

      case 'hard':
        newInterval = Math.floor(
          card.interval * this.settings.hardIntervalFactor,
        );
        newEase = Math.max(this.settings.minEase, newEase - 0.15);
        break;

      case 'good':
        newInterval = Math.floor(card.interval * card.easeFactor);
        break;

      case 'easy':
        newInterval = Math.floor(
          card.interval * card.easeFactor * this.settings.easyBonus,
        );
        newEase += 0.15;
        break;
    }

    newInterval = Math.floor(newInterval * this.settings.intervalModifier);
    if (newInterval < 1) newInterval = 1;
    if (this.settings.useFuzz) newInterval = applyFuzz(newInterval);

    card.interval = newInterval;
    card.easeFactor = newEase;
    card.dueDate = addDays(now, newInterval);
  }
}
```

## **4\. API Endpoints**

### **POST /api/cards/{id}/review**

Accepts the user's rating and updates the card state.

**Payload:**

{  
 "rating": "again" | "hard" | "good" | "easy"  
}

**Logic:**

1. Fetch Card from DB.
2. Instantiate AnkiScheduler.
3. Call calculateNextReview(card, rating).
4. Update DB with new status, interval, ease_factor, step_index, and due_date.
5. Return the updated card.
