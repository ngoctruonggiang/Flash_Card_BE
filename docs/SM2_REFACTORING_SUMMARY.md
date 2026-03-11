# SM-2 Algorithm Refactoring Summary

## Overview

This document summarizes the refactoring of the SM-2 spaced repetition algorithm to differentiate interval calculations for Hard, Good, and Easy quality ratings when repetitions > 2.

## Problem Statement

Previously, when `repetitions > 2`, all three quality options (Hard, Good, Easy) produced the same interval because they all used the formula:

```
interval = round(previous_interval * eFactor)
```

This meant that clicking "Hard", "Good", or "Easy" would result in identical next review dates, which defeated the purpose of having different quality levels.

## Solution

The interval calculation logic was updated to differentiate between the three quality levels when `repetitions > 2`:

### New Interval Formulas (for repetitions > 2)

- **Hard (quality = 3):** `interval = round(previous_interval * 1.2)`
  - Fixed growth rate of 20% increase
  - Slower progression for difficult cards
- **Good (quality = 4):** `interval = round(previous_interval * eFactor)`
  - Standard SM-2 algorithm behavior
  - Dynamic growth based on card's ease factor
- **Easy (quality = 5):** `interval = round(previous_interval * eFactor * 1.3)`
  - Bonus 30% multiplier on top of eFactor
  - Faster progression for easy cards

### Unchanged Behavior

- **Again (quality = 2):** Still resets to `interval = 1`, `repetitions = 0`
- **First review (repetitions = 1):** Still sets `interval = 1`
- **Second review (repetitions = 2):** Still sets `interval = 6`
- **eFactor updates:** Remain the same for all quality levels

## Example Comparison

### Scenario: Card with `repetitions = 2`, `interval = 6`, `eFactor = 2.5`

| Quality | Old Behavior | New Behavior | Difference  |
| ------- | ------------ | ------------ | ----------- |
| Again   | 1 day        | 1 day        | No change   |
| Hard    | 15 days      | **7 days**   | ✓ Different |
| Good    | 15 days      | **15 days**  | No change   |
| Easy    | 15 days      | **20 days**  | ✓ Different |

Now users can see meaningful differences between their quality choices!

## Impact on Components

### Modified Files

1. **`src/services/review/sm2Algo.ts`**
   - Updated interval calculation logic to differentiate by quality
   - Added conditional branches for quality 3, 4, and 5

2. **`src/services/review/sm2Algo.spec.ts`**
   - Updated 3 test cases with new expected values
   - All 39 tests passing

3. **`src/services/review/review.service.preview.spec.ts`**
   - Updated 3 test cases with new expected values
   - All 10 tests passing

4. **`docs/SM-2-Algorithm.md`**
   - Updated documentation to reflect new differentiated logic
   - Added examples showing all three quality paths

5. **`API_DOCUMENTATION.md`**
   - Added documentation for new `/study/preview/:id` endpoint

### Verified Functionality

✅ **Preview Endpoint:** `GET /study/preview/:id`

- Correctly shows differentiated intervals for all quality options
- Works for new cards, cards in progress, and cards with high repetitions

✅ **Actual Review Submission:** `POST /study/review`

- Uses the same differentiated logic
- Maintains consistency between preview and actual results

✅ **All Tests Passing:**

- 39 SM-2 algorithm unit tests ✓
- 10 preview service unit tests ✓
- 6 preview e2e tests ✓

## Test Examples

### New Card Preview

```json
{
  "Again": "1 day",
  "Hard": "1 day",
  "Good": "1 day",
  "Easy": "1 day"
}
```

### Card After 2 Reviews (interval=6, eFactor=2.5)

```json
{
  "Again": "1 day",
  "Hard": "7 days", // 6 * 1.2 = 7
  "Good": "15 days", // 6 * 2.5 = 15
  "Easy": "20 days" // 6 * 2.5 * 1.3 = 20
}
```

### Mature Card (interval=100, eFactor=2.8, rep=10)

```json
{
  "Again": "1 day",
  "Hard": "120 days", // 100 * 1.2 = 120
  "Good": "280 days", // 100 * 2.8 = 280
  "Easy": "364 days" // 100 * 2.8 * 1.3 = 364
}
```

## Benefits

1. **Better User Experience:** Users can now see meaningful differences between quality options
2. **More Intuitive:** "Hard" → slower growth, "Easy" → faster growth
3. **Maintains SM-2 Core:** "Good" continues to use standard SM-2 algorithm
4. **Backward Compatible:** All existing cards continue to work correctly
5. **Well Tested:** Comprehensive test coverage ensures reliability

## Deployment Notes

- No database migration required (schema unchanged)
- No breaking API changes
- Existing card reviews will use new logic on next review
- Preview endpoint provides transparent view of interval calculations

## Date Completed

November 24, 2025
