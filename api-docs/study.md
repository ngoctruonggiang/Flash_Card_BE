# **5\. Study Endpoints**

Manage study sessions and reviews.

### **5.1 Start Study Session**

Get cards that are due for review in a specific deck.

- **URL**: /study/start/:id
- **Method**: GET
- **Auth Required**: Yes
- **URL Parameters**:
  - id: ID of the deck

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.106Z",
  "message": "Start Study Session",
  "data": [
    {
      "id": 1,
      "deckId": 3,
      "front": "What is 3+3?",
      "back": "6",
      "createdAt": "2025-11-23T13:44:29.060Z",
      "updatedAt": "2025-11-23T13:44:29.091Z",
      "tags": "math,basics"
    }
  ],
  "path": "/api/study/start/3"
}
```

### **5.2 Submit Card Review**

Submit reviews for cards using the SM-2 spaced repetition algorithm.

- **URL**: /study/review
- **Method**: POST
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "CardReviews": [
    {
      "cardId": 1,
      "quality": "Good"
    }
  ],
  "reviewedAt": "2023-10-27T10:00:00Z"
}
```

**Field Descriptions:**

- CardReviews (array, required): Array of card review objects
  - cardId (number, required): ID of the card being reviewed
  - quality (string, required): Review quality \- one of: "Again", "Hard", "Good", "Easy"
- reviewedAt (string, required): ISO 8601 timestamp of when the review occurred

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-23T13:44:29.122Z",
  "message": "Submitting card review",
  "data": [
    {
      "id": 1,
      "cardId": 1,
      "repetitions": 1,
      "interval": 1,
      "eFactor": 2.5,
      "nextReviewDate": "2023-10-28T10:00:00.000Z",
      "reviewedAt": "2023-10-28T10:00:00.000Z",
      "quality": "Good"
    }
  ],
  "path": "/api/study/review"
}
```

**Response Field Descriptions:**

- repetitions: Number of consecutive correct reviews
- interval: Days until next review
- eFactor: Easiness factor (used in SM-2 algorithm)
- nextReviewDate: When the card should be reviewed next
- reviewedAt: When the review was recorded
- quality: The quality rating given in the review

### **5.3 Get Review Preview**

Preview future review intervals for all quality options without submitting a review. This allows users to see what the next review date would be for each quality rating (Again, Hard, Good, Easy) before making their selection.

- **URL**: /study/preview/:id
- **Method**: GET
- **Auth Required**: Yes
- **URL Parameters**:
  - id: ID of the card

**Success Response (200 OK):**

Example for a **new card** (never reviewed):

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T10:30:00.000Z",
  "message": "Get Review Preview",
  "data": {
    "Again": "1 day",
    "Hard": "1 day",
    "Good": "3 days",
    "Easy": "5 days"
  },
  "path": "/api/study/preview/1"
}
```

Example for a card after 2 reviews (repetitions=2, interval=6, eFactor=2.5):

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T10:30:00.000Z",
  "message": "Get Review Preview",
  "data": {
    "Again": "1 day",
    "Hard": "7 days",
    "Good": "15 days",
    "Easy": "20 days"
  },
  "path": "/api/study/preview/1"
}
```

**Response Field Descriptions:**

- Again: Interval if the card is marked as "Again" (forgotten/incorrect) \- always resets to 1 day
- Hard: Interval if the card is marked as "Hard" (difficult to recall) \- uses fixed 1.2x growth (for repetitions \> 2\)
- Good: Interval if the card is marked as "Good" (correctly recalled) \- uses standard SM-2 eFactor growth
- Easy: Interval if the card is marked as "Easy" (very easy to recall) \- uses eFactor with 1.3x bonus multiplier

**Interval Calculation:**

For **first review** (repetitions \= 1):

- **Hard:** 1 day
- **Good:** 3 days
- **Easy:** 5 days

For **second review** (repetitions \= 2):

- All qualities: 6 days

For **third+ reviews** (repetitions \> 2):

- **Hard:** round(previous_interval \* 1.2) \- Fixed 20% growth
- **Good:** round(previous_interval \* eFactor) \- Standard SM-2 growth
- **Easy:** round(previous_interval \* eFactor \* 1.3) \- Bonus 30% growth

**Notes:**

- This endpoint performs a read-only simulation and does not modify the card's review history
- Intervals are calculated using the SM-2 algorithm based on the card's current state
- **New cards** (never reviewed) show differentiated intervals: Hard=1, Good=3, Easy=5 days
- Starting from the **first review**, intervals are differentiated by quality rating
- Intervals are formatted as human-readable strings (e.g., "1 day", "15 days")

### **5.4 Get Consecutive Study Days**

Get the number of consecutive days a deck has been studied. A study streak is considered active if the deck was studied today or yesterday. The streak breaks if more than one day passes without studying.

- **URL**: /study/consecutive-days/:id
- **Method**: GET
- **Auth Required**: Yes
- **URL Parameters**:
  - id: ID of the deck

**Success Response (200 OK):**

Example for an **active streak**:

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T10:30:00.000Z",
  "message": "Get consecutive study days",
  "data": {
    "consecutiveDays": 7,
    "streakStartDate": "2025-11-17T00:00:00.000Z",
    "lastStudyDate": "2025-11-24T00:00:00.000Z"
  },
  "path": "/api/study/consecutive-days/3"
}
```

Example for a **broken streak** (not studied today or yesterday):

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T10:30:00.000Z",
  "message": "Get consecutive study days",
  "data": {
    "consecutiveDays": 0,
    "streakStartDate": null,
    "lastStudyDate": "2025-11-20T00:00:00.000Z"
  },
  "path": "/api/study/consecutive-days/3"
}
```

Example for a **deck with no study history**:

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T10:30:00.000Z",
  "message": "Get consecutive study days",
  "data": {
    "consecutiveDays": 0,
    "streakStartDate": null,
    "lastStudyDate": null
  },
  "path": "/api/study/consecutive-days/3"
}
```

**Response Field Descriptions:**

- consecutiveDays (number): The number of consecutive days the deck has been studied. Returns 0 if:
  - The deck has never been studied
  - More than one day has passed since the last study session (streak broken)
- streakStartDate (string | null): ISO 8601 timestamp of when the current streak started (normalized to start of day in UTC). null if there is no active streak.
- lastStudyDate (string | null): ISO 8601 timestamp of the most recent study session (normalized to start of day in UTC). null if the deck has never been studied.

**How Consecutive Days Are Calculated:**

1. All reviews for cards in the deck are collected
2. Review dates are normalized to the start of the day (UTC) and deduplicated \- multiple reviews on the same day count as one study day
3. The streak is considered active if the last study date is today or yesterday
4. Starting from the most recent study date, consecutive days are counted backward
5. The streak breaks when there's a gap of more than one day between study sessions

**Notes:**

- A "study day" is defined by having at least one card review submitted on that day
- Multiple reviews on the same day count as a single study day
- The streak continues if you study either today or yesterday (1-day gap is allowed to account for timezone differences and late-night studying)
- All dates are normalized to UTC for consistency
- An empty deck (no cards) or a deck with cards but no reviews will return consecutiveDays: 0
