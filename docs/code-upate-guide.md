# **Anki V2 Algorithm Implementation Guide**

This guide outlines the steps to upgrade your application from the "Simplified SM-2" (repetition-based) algorithm to the **Anki V2** (state machine-based) algorithm.

Since you are in the development phase, this guide assumes you can modify the database schema freely without writing complex migration scripts for existing users.

---

## 1. Database Schema Updates (`schema.prisma`)

**Key change:** In the old system card state (repetitions, interval, eFactor) was derived from `CardReview` history. In the new system the `Card` model **must** hold its current state to support _learning steps_ (minutes) vs _review intervals_ (days).

**Action:** Update your `Card` model and add the `CardStatus` enum.

```prisma
// 1. Add the Status Enum
enum CardStatus {
  new
  learning
  review
  relearning
}

model Card {
  // ... keep existing fields (id, deckId, front, back, richContent ...)

  // 2. Add state fields (Anki fields)
  status         CardStatus @default(new)
  stepIndex      Int        @default(0)    // Tracks progress in learning steps (e.g., 1m -> 10m)
  interval       Float      @default(0)    // Stores days (review) or minutes (learning)
  easeFactor     Float      @default(2.5)  // Multiplier (min 1.3)
  nextReviewDate DateTime?

  // Relations
  deck    Deck        @relation(fields: [deckId], references: [id])
  reviews CardReview[]

  @@index([deckId])
  @@map("Card")
}

model CardReview {
  id             Int        @id @default(autoincrement())
  cardId         Int

  // 3. Review history reflecting new algorithm metrics
  // 'repetitions' is kept for stats but is less critical now
  repetitions    Int        @default(0)

  interval       Float      // Interval calculated at that time
  easeFactor     Float      // EF at that time
  previousStatus CardStatus // Useful for analytics (e.g., lapses)
  newStatus      CardStatus // Status after this review

  reviewDuration Int?       // Optional: time taken to answer (ms)
  reviewedAt     DateTime   @default(now())
  quality        ReviewQuality

  // Relations
  card Card @relation(fields: [cardId], references: [id])

  @@index([cardId])
  @@index([reviewedAt])
}
```

---

## 2. The Scheduler Service (`src/services/scheduler.ts`)

Create a new file `src/services/scheduler.ts`. This replaces the logic described in `old-algorithm.md`.

**Key concept:** Instead of `repetitions == 1` we now check `status == 'learning'`.

```ts
export type Rating = 'Again' | 'Hard' | 'Good' | 'Easy';
export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

export interface SchedulerCard {
  status: CardStatus;
  stepIndex: number;
  easeFactor: number;
  interval: number;
  nextReviewDate?: Date | null;
}

// Configuration
const SETTINGS = {
  learningSteps: [1, 10], // 1 min, 10 min
  relearningSteps: [10], // 10 min lapse step
  graduatingInterval: 1, // 1 day
  easyInterval: 4, // 4 days
  startingEase: 2.5,
  minEase: 1.3,
  hardIntervalFactor: 1.2,
  easyBonus: 1.3,
  useFuzz: true, // Prevent clumping
};

// Helpers
const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

const addDays = (d: Date, days: number) => {
  const newDate = new Date(d);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

// Fuzz: random variance to avoid clumping
const applyFuzz = (days: number): number => {
  if (days < 3 || !SETTINGS.useFuzz) return days;
  const fuzzRange = days < 7 ? 0.15 : days < 30 ? 0.1 : 0.05;
  const fuzz = days * fuzzRange * (Math.random() - 0.5);
  return Math.max(1, Math.round(days + fuzz));
};

export class AnkiScheduler {
  public calculateNext(card: SchedulerCard, rating: Rating): SchedulerCard {
    // Clone to avoid mutation
    let next = { ...card };
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
          ? SETTINGS.relearningSteps
          : SETTINGS.learningSteps;

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
          next.interval = SETTINGS.graduatingInterval; // 1 day
          next.nextReviewDate = addDays(now, next.interval);
        }
      } else if (rating === 'Easy') {
        // Jump to review
        next.status = 'review';
        next.stepIndex = 0;
        next.interval = SETTINGS.easyInterval; // 4 days
        next.nextReviewDate = addDays(now, next.interval);
      }
    }

    // --- PHASE 2: Review (days) ---
    else if (next.status === 'review') {
      if (rating === 'Again') {
        // Lapse -> relearning
        next.status = 'relearning';
        next.stepIndex = 0;
        next.easeFactor = Math.max(SETTINGS.minEase, next.easeFactor - 0.2);
        next.interval = SETTINGS.relearningSteps[0]; // minutes
        next.nextReviewDate = addMinutes(now, next.interval);
      } else if (rating === 'Hard') {
        next.interval = Math.max(
          1,
          Math.floor(next.interval * SETTINGS.hardIntervalFactor),
        );
        next.easeFactor = Math.max(SETTINGS.minEase, next.easeFactor - 0.15);
        next.nextReviewDate = addDays(now, applyFuzz(next.interval));
      } else if (rating === 'Good') {
        next.interval = Math.max(
          1,
          Math.floor(next.interval * next.easeFactor),
        );
        next.nextReviewDate = addDays(now, applyFuzz(next.interval));
      } else if (rating === 'Easy') {
        next.interval = Math.max(
          1,
          Math.floor(
            next.interval * next.easeFactor * (SETTINGS as any).easyBonus,
          ),
        );
        next.easeFactor = next.easeFactor + 0.15;
        next.nextReviewDate = addDays(now, applyFuzz(next.interval));
      }
    }

    return next;
  }
}
```

---

## 3. API Logic Updates

### 3.1 Update `POST /study/review` (submit card review)

**Old logic:** looked up `CardReview` history to find repetition count, did math, saved to `CardReview`.  
**New logic:** read `Card` state directly, run scheduler, update `Card` state and save history.

_Controller pseudocode:_

```ts
import { AnkiScheduler } from '../services/scheduler';

export const submitReview = async (req, res) => {
  const { cardId, quality } = req.body;

  // 1. Get card (now contains state)
  const card = await prisma.card.findUnique({ where: { id: cardId } });

  // 2. Prepare scheduler input
  const schedulerInput = {
    status: card.status,
    stepIndex: card.stepIndex,
    easeFactor: card.easeFactor,
    interval: card.interval,
  };

  // 3. Calculate
  const scheduler = new AnkiScheduler();
  const result = scheduler.calculateNext(schedulerInput, quality);

  // 4. Update DB (transaction recommended)
  await prisma.$transaction([
    // Update the Card state (critical for next review)
    prisma.card.update({
      where: { id: cardId },
      data: {
        status: result.status,
        stepIndex: result.stepIndex,
        easeFactor: result.easeFactor,
        interval: result.interval,
        nextReviewDate: result.nextReviewDate,
      },
    }),
    // Log history
    prisma.cardReview.create({
      data: {
        cardId,
        quality,
        reviewedAt: new Date(),
        interval: result.interval,
        easeFactor: result.easeFactor,
        previousStatus: card.status, // track transition
        newStatus: result.status,
      },
    }),
  ]);

  res.status(201).json(result);
};
```

### 3.2 Update `GET /study/preview/:id` (get review preview)

**Old logic:** returned fixed days for new cards.  
**New logic:** simulate the scheduler for all four responses based on `Card.status`.

```ts
export const getReviewPreview = async (req, res) => {
  const { id } = req.params;
  const card = await prisma.card.findUnique({ where: { id: Number(id) } });

  const scheduler = new AnkiScheduler();
  const input = {
    status: card.status,
    stepIndex: card.stepIndex,
    easeFactor: card.easeFactor,
    interval: card.interval,
  };

  // Simulate all 4 outcomes
  const again = scheduler.calculateNext(input, 'Again');
  const hard = scheduler.calculateNext(input, 'Hard');
  const good = scheduler.calculateNext(input, 'Good');
  const easy = scheduler.calculateNext(input, 'Easy');

  // Helper to format minutes vs days
  const formatIvl = (c) => {
    if (c.status === 'learning' || c.status === 'relearning') {
      return `${Math.round(c.interval)} min`;
    }
    return `${Math.round(c.interval)} days`;
  };

  res.json({
    data: {
      Again: formatIvl(again), // e.g., "1 min"
      Hard: formatIvl(hard), // e.g., "6 min" (if learning)
      Good: formatIvl(good), // e.g., "10 min" or "3 days"
      Easy: formatIvl(easy), // e.g., "4 days"
    },
  });
};
```

---

## 4. Summary of Changes

| Feature         | Old Algorithm                 | New Anki Algorithm                        |
| --------------- | ----------------------------- | ----------------------------------------- |
| Logic source    | repetition count from history | `status` + `stepIndex` on `Card`          |
| New cards       | Fixed 1, 3, 5 day options     | Steps: 1 min, 10 min                      |
| Failing a card  | Reset to 1 day                | Reset to 1 min (relearning)               |
| Card schema     | No state fields               | Added `status`, `easeFactor`, `stepIndex` |
| Review endpoint | Writes to history table only  | Updates `Card` state + writes history     |
