# Simplified SM-2 Algorithm — Detailed Summary

The **simplified SM-2 algorithm** is a lightweight version of the original SuperMemo 2 spaced-repetition algorithm. It is adapted to work with four intuitive user options (**Again, Hard, Good, Easy**), making the study process simple while still providing effective review scheduling.

---

## 1. Core Idea

- Each flashcard has a **review interval** (days until the next review), a **repetition count** (how many successful recalls in a row), and an **ease factor (eFactor)** that determines how quickly the interval grows.
- When the learner reviews a card, they rate how easy it was to recall using one of the four buttons.
- The system uses this rating to update the card’s scheduling fields and calculate the next review date.

---

## 2. User Input (Buttons → Quality Mapping)

- **Again** → Quality = 2 → failure, resets progress.
- **Hard** → Quality = 3 → success, but with small interval increase.
- **Good** → Quality = 4 → normal success.
- **Easy** → Quality = 5 → strong success, faster interval growth.

A quality of 3 or higher counts as a **successful recall**.

---

## 3. Stored Fields (per card)

- **repetitions** (int) — number of consecutive successful recalls.
- **interval** (int) — current review interval in days.
- **e_factor** (float) — ease factor, default 2.5, minimum 1.3.
- **last_reviewed** (date) — date of last review.
- **next_review_date** (date) — scheduled date for next review.

---

## 4. Update Rules

When a review is completed on day `today` with mapped `quality`:

### Case 1: Failure (quality < 3 → “Again”)

- `repetitions = 0`
- `interval = 1`
- `next_review_date = today + 1`
- `e_factor` unchanged (kept simple)

### Case 2: Success (quality ≥ 3 → "Hard/Good/Easy")

- Increment repetitions: `repetitions = repetitions + 1`
- Interval calculation:
  - If `repetitions == 1` (first review), differentiate by quality:
    - **Hard (quality = 3):** interval = 1 day
    - **Good (quality = 4):** interval = 3 days
    - **Easy (quality = 5):** interval = 5 days
  - If `repetitions == 2`: interval = 6
  - Else (repetitions > 2), differentiate by quality:
    - **Hard (quality = 3):** interval = round(previous_interval \* 1.2) — Fixed growth
    - **Good (quality = 4):** interval = round(previous_interval \* e_factor) — Standard growth
    - **Easy (quality = 5):** interval = round(previous*interval * e*factor * 1.3) — Bonus growth
- Update ease factor:
  ```
  e' = e_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  e_factor = max(e', 1.3)
  ```
- Set `next_review_date = today + interval`

---

## 5. Behavior of the Algorithm

- **Again:** forces the card to reappear soon (next day), helping weak cards stay in rotation.
- **Hard:** grows the interval slowly with a fixed 1.2x multiplier, reducing pressure but keeping card reviews more frequent.
- **Good:** grows the interval normally using the e_factor, giving steady progress based on card difficulty.
- **Easy:** grows the interval faster with a 1.3x bonus on top of e_factor, quickly pushing strong cards further out.

---

## 6. Example Flow

1. **New card reviewed** as different qualities (first review):
   - **Hard:** repetitions = 1 → interval = 1 day → next review tomorrow
   - **Good:** repetitions = 1 → interval = 3 days → next review in 3 days
   - **Easy:** repetitions = 1 → interval = 5 days → next review in 5 days

2. **Second review** as **Good** (after first Good review):
   - repetitions = 2 → interval = 6 days → next review in 6 days

3. **Third review** onwards (differentiated by quality):
   - **Easy:** interval = round(6 _ 2.5 _ 1.3) = 20 days (bonus growth)
   - **Good:** interval = round(6 \* 2.5) = 15 days (standard growth)
   - **Hard:** interval = round(6 \* 1.2) = 7 days (fixed slow growth)

4. **If reviewed as Again** at any time:
   - Resets to repetitions = 0, interval = 1, review again tomorrow

---

## 7. Advantages

- **Ease of implementation:** small number of fields per card, simple formulas.
- **User-friendly:** four buttons instead of a 0–5 scale.
- **Deterministic & testable:** predictable behavior for grading and debugging.
- **Effective learning:** cards are repeated at intervals that adapt to learner performance.

---

This simplified SM-2 ensures that the application is both easy to code and effective for learners, striking a balance between simplicity and memory retention.
