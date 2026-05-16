# **Anki's Modified SM-2 Algorithm: Technical Deep Dive**

## **1. Introduction**

This document outlines the logic behind the Spaced Repetition System (SRS) used in our application. We utilize a **Modified SM-2 Algorithm** (specifically based on Anki's V2 scheduler).

While the original SuperMemo-2 (SM-2) algorithm was developed in the late 1980s to optimize human memory retention, Anki introduced several practical modifications to better suit modern software usage, specifically regarding "Learning" phases and button inputs.

## **2. Core Concepts**

### **2.1 The Two Phases**

The algorithm treats cards differently based on their phase. This distinction is critical for implementation.

1. **Learning Phase (Short-term Memory):**
   - The goal is to move a card from "Unknown" to "Known".
   - Intervals are short (minutes/hours) and fixed.
   - The "Algorithm" (exponential math) **does not apply here**.
   - Cards move linearly through a queue of "Steps".
2. **Review Phase (Long-term Memory):**
   - The goal is to maintain the memory efficiently.
   - Intervals are long (days/years) and calculated mathematically.
   - The "Algorithm" is fully active.

### **2.2 Key Metrics**

- **Ease Factor (EF):** A floating-point number (default 2.5). It represents the "stickiness" of the memory.
  - Higher EF = Slower forgetting = Intervals grow faster.
  - Lower EF = Faster forgetting = Intervals grow slower.
  - _Constraint:_ EF never drops below 1.3 (130%).
- **Interval (I):** The number of days until the next review.

## **3. The Mathematics (Review Phase)**

Once a card graduates from the Learning Phase, its next interval is determined by the user's rating (Again, Hard, Good, Easy).

### **3.1 The "Good" Button (Standard Interaction)**

This is the baseline behavior. When a user presses "Good", we assume the Difficulty (Ease Factor) is accurate.

$$
I_{new} = I_{current} \times EF
$$

- **Logic:** If you remembered a card for 10 days with an Ease Factor of 2.5, you will likely remember it for $10 \times 2.5 = 25$ days next time.
- **Effect on Ease:** None. The Ease Factor remains unchanged.

### **3.2 The "Easy" Button (Bonus)**

Used when the answer was recalled instantly. We reward the user with a larger jump in time and a permanent increase in the card's ease.

$$
I_{new} = I_{current} \times EF \times \text{EasyBonus}
$$

- **Standard Easy Bonus:** 1.3 (130%)
- **Effect on Ease:**  
  $$EF_{new} = EF_{current} + 0.15$$

### **3.3 The "Hard" Button (Penalty)**

Used when the user struggled but succeeded. We slow down the expansion of the interval and permanently decrease the card's ease.

$$
I_{new} = I_{current} \times 1.2
$$

- **Logic:** The interval grows by a flat 20% (1.2x) instead of the usual Ease Factor (typically 2.5x).
- **Effect on Ease:**
  $$
  EF_{new} = \max(1.3,\, EF_{current} - 0.15)
  $$

### **3.4 The "Again" Button (Failure)**

Used when the user forgot the card. The card is penalized heavily.

1. **Lapse:** The card enters the **Relearning** status.
2. **Ease Penalty:**
   $$
   EF_{new} = \max(1.3,\, EF_{current} - 0.20)
   $$
3. **Interval Reset:** The card returns to short-term learning steps (e.g., 10 minutes).
4. **Future Interval:** Once relearned, the new interval is a percentage of the _old_ interval (often 0% or 10% in default Anki settings, effectively resetting progress).

## **4. Anki Deviations from Standard SM-2**

It is important to note where our logic differs from the academic SM-2 paper.

| Feature              | Standard SM-2                                       | Anki Modified (V2)                                                    |
| :------------------- | :-------------------------------------------------- | :-------------------------------------------------------------------- |
| **Initial Steps**    | Fixed: 1 day, then 6 days.                          | Configurable Learning Steps (e.g., 1m, 10m).                          |
| **Rating Scale**     | 0 to 5 (6 options).                                 | 1 to 4 (Again, Hard, Good, Easy).                                     |
| **"Hard" Response**  | treated as passing (grade 3), but resets interval.  | Passes, but grows interval slowly (1.2x) and reduces Ease.            |
| **Ease Calculation** | Complex polynomial formula updated on every review. | Simplified updates (+0.15, 0.0, -0.15, -0.20) based on button choice. |

## **5. Advanced Mechanics**

### **5.1 Fuzz (Input Noise)**

To prevent "clumping"—where 50 cards introduced on Monday all become due on the same Friday—a small random factor is added to the calculated interval.

- **Mechanism:** A random percentage (e.g., ±5%) is applied to the final calculated days.
- **Impact:** Intervals might be 9, 10, or 11 days instead of exactly 10.

### **5.2 Late Reviews**

If a user reviews a card 5 days late, we do not punish them by calculating the next interval based on the _original_ due date. We credit the extra time.

- **Logic:** If you were supposed to see it in 10 days, but saw it in 15 and still remembered, your memory is stronger than predicted.
- **Formula (Simplified):**
  $$
  I_{new} = (I_{scheduled} + \frac{\text{DaysLate}}{2}) \times EF
  $$

## **6. Algorithm flow-chart**

````mermaid
graph TD
    Start([User Reviews Card]) --> CheckState{Card Status?}

    %% --- LEARNING PHASE ---
    CheckState -- New / Learning --> LearnDecide[User Rating?]

    LearnDecide -- Again --> L_Fail[Reset Step Index to 0]
    L_Fail --> L_SetNext[Next Due: <br/>1st Learning Step<br/>e.g., 1 min]

    LearnDecide -- Hard --> L_Hard[No Step Advance]
    L_Hard --> L_HardCalc[Next Due: <br/>Current Step * 1.5]

    LearnDecide -- Good --> L_Good{More Steps?}
    L_Good -- Yes --> L_IncStep[Step Index + 1]
    L_IncStep --> L_NextStep[Next Due: <br/>Value of New Step]

    L_Good -- No --> Graduate[GRADUATE]
    LearnDecide -- Easy --> Graduate

    Graduate --> SetReviewMode[Set Status: REVIEW]
    SetReviewMode --> InitReview[Interval: Graduating Interval<br/>Default: 1 Day<br/>EF: 2.5]

    %% --- REVIEW PHASE ---
    CheckState -- Review --> ReviewDecide[User Rating?]

    ReviewDecide -- Again --> R_Fail[LAPSE]
    R_Fail --> SetRelearn[Set Status: RELEARNING]
    SetRelearn --> DropEase[Ease Factor - 0.20<br/>min 1.3]
    DropEase --> ResetIvl[Interval: 1 Day<br/>Enters Relearning Steps]

    ReviewDecide -- Hard --> R_Hard[Hard Logic]
    R_Hard --> CalcHard[Interval * 1.2<br/>Ease Factor - 0.15]

    ReviewDecide -- Good --> R_Good[Good Logic]
    R_Good --> CalcGood[Interval * Ease Factor]

    ReviewDecide -- Easy --> R_Easy[Easy Logic]
    R_Easy --> CalcEasy[Interval * Ease Factor * 1.3<br/>Ease Factor + 0.15]
    ```
````

## **7. Core Algorithm Implementation (TypeScript)**

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
