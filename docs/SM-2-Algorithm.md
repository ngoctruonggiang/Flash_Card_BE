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

### Case 2: Success (quality ≥ 3 → “Hard/Good/Easy”)

- Increment repetitions: `repetitions = repetitions + 1`
- Interval calculation:
  - If `repetitions == 1`: interval = 1
  - If `repetitions == 2`: interval = 6
  - Else: interval = round(previous_interval \* e_factor)
- Update ease factor:
  ```
  e' = e_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  e_factor = max(e', 1.3)
  ```
- Set `next_review_date = today + interval`

---

## 5. Behavior of the Algorithm

- **Again:** forces the card to reappear soon (next day), helping weak cards stay in rotation.
- **Hard:** grows the interval slowly, reducing pressure but keeping card reviews more frequent.
- **Good:** grows the interval normally, giving steady progress.
- **Easy:** grows the interval faster, quickly pushing strong cards further out.

---

## 6. Example Flow

1. New card reviewed as **Good**:
   - repetitions = 1 → interval = 1 day → next review tomorrow.
2. Next day reviewed as **Good**:
   - repetitions = 2 → interval = 6 days → next review in 6 days.
3. Later reviewed as **Easy**:
   - interval ≈ previous*interval * e*factor (e.g., 6 * 2.5 ≈ 15 days).
4. If reviewed as **Again**:
   - resets to repetitions = 0, interval = 1, review again tomorrow.

---

## 7. Advantages

- **Ease of implementation:** small number of fields per card, simple formulas.
- **User-friendly:** four buttons instead of a 0–5 scale.
- **Deterministic & testable:** predictable behavior for grading and debugging.
- **Effective learning:** cards are repeated at intervals that adapt to learner performance.

---

This simplified SM-2 ensures that the application is both easy to code and effective for learners, striking a balance between simplicity and memory retention.
