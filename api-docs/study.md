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
      "repetitions": 0,
      "interval": 1,
      "eFactor": 2.5,
      "nextReviewDate": "2023-10-28T10:00:00.000Z",
      "reviewedAt": "2023-10-28T10:00:00.000Z",
      "quality": "Good",
      "previousStatus": "learning",
      "newStatus": "review"
    }
  ],
  "path": "/api/study/review"
}
```

**Response Field Descriptions:**

- repetitions: (Deprecated) Number of consecutive correct reviews. Currently always 0.
- interval: Days (or minutes) until next review
- eFactor: Easiness factor (used in SM-2 algorithm)
- nextReviewDate: When the card should be reviewed next
- reviewedAt: When the review was recorded
- quality: The quality rating given in the review
- previousStatus: Status of the card before this review (new, learning, review, relearning)
- newStatus: Status of the card after this review

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
    "Again": "1 min",
    "Hard": "1 min",
    "Good": "10 min",
    "Easy": "4 days"
  },
  "path": "/api/study/preview/1"
}
```

Example for a **graduated card** (Review Mode):

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T10:30:00.000Z",
  "message": "Get Review Preview",
  "data": {
    "Again": "10 min",
    "Hard": "1 day",
    "Good": "3 days",
    "Easy": "4 days"
  },
  "path": "/api/study/preview/1"
}
```

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

### **5.5 Start Cram Session (Practice Mode)**

Get cards for practice without affecting their scheduling (Cram Mode). This allows users to review cards immediately, regardless of their due date.

- **URL**: /study/cram/:deckId
- **Method**: GET
- **Auth Required**: Yes
- **URL Parameters**:
  - deckId: ID of the deck
- **Query Parameters**:
  - limit: (Optional) Number of cards to fetch (default: 50)

**Success Response (200 OK):**

```json
{
  "message": "Cram session started",
  "data": [
    {
      "id": 1,
      "deckId": 3,
      "front": "What is 3+3?",
      "back": "6",
      "createdAt": "2025-11-23T13:44:29.060Z",
      "updatedAt": "2025-11-23T13:44:29.091Z",
      "tags": "math,basics",
      "status": "review",
      "nextReviewDate": "2025-12-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Notes:**

- Cards are selected randomly from the deck.
- Reviews submitted during a cram session should **NOT** be sent to the `/study/review` endpoint if you want to avoid updating the card's schedule.
- This mode is purely for extra practice.

### **5.6 Submit Cram Review**

Submit reviews for cram sessions. These reviews are recorded to count towards study streaks but do **NOT** update the card's SRS schedule (interval, ease factor, etc.).

- **URL**: /study/cram/review
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

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-23T13:44:29.122Z",
  "message": "Submitting cram review",
  "data": [
    {
      "id": 105,
      "cardId": 1,
      "repetitions": 0,
      "interval": 1,
      "eFactor": 2.5,
      "nextReviewDate": "2023-10-28T10:00:00.000Z",
      "reviewedAt": "2023-10-27T10:00:00Z",
      "quality": "Good",
      "previousStatus": "review",
      "newStatus": "review"
    }
  ],
  "path": "/api/study/cram/review"
}
```

**Notes:**

- Use this endpoint to log progress during cram sessions.
- It ensures that cramming contributes to the user's daily study streak.
- The `previousStatus` and `newStatus` will be identical, and `interval` will remain unchanged.

### **5.7 Get Study Session Statistics**

Get detailed statistics for a specific study session time range.

- **URL**: /study/session-statistics/:deckId
- **Method**: GET
- **Auth Required**: Yes
- **URL Parameters**:
  - deckId: ID of the deck
- **Query Parameters**:
  - startDate (required): Session start date/time in ISO 8601 format
  - endDate (required): Session end date/time in ISO 8601 format

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-12-06T10:00:00.000Z",
  "message": "Get Study Session Statistics",
  "data": {
    "totalCardsReviewed": 25,
    "newCardsIntroduced": 5,
    "learningCardsReviewed": 8,
    "reviewCardsReviewed": 12,
    "correctAnswers": 20,
    "incorrectAnswers": 5,
    "accuracyPercentage": 80.0,
    "totalStudyTime": 450,
    "averageTimePerCard": 18.0,
    "againCount": 5,
    "hardCount": 3,
    "goodCount": 15,
    "easyCount": 2,
    "sessionStartTime": "2025-12-03T10:00:00.000Z",
    "sessionEndTime": "2025-12-03T10:15:00.000Z",
    "deckId": "123",
    "deckName": "Spanish Vocabulary"
  },
  "path": "/api/study/session-statistics/123?startDate=2025-12-03T10:00:00Z&endDate=2025-12-03T10:15:00Z"
}
```

**Response Field Descriptions:**

- totalCardsReviewed (number): Total cards reviewed in session
- newCardsIntroduced (number): New cards studied for the first time
- learningCardsReviewed (number): Cards in learning phase reviewed
- reviewCardsReviewed (number): Cards in review phase reviewed
- correctAnswers (number): Number of Good/Easy responses
- incorrectAnswers (number): Number of Again responses
- accuracyPercentage (number): Percentage of correct answers
- totalStudyTime (number): Total session duration in seconds
- averageTimePerCard (number): Average time per card in seconds
- againCount, hardCount, goodCount, easyCount (number): Quality distribution
- sessionStartTime, sessionEndTime (string): ISO timestamps
- deckId (string): ID of the deck
- deckName (string): Name of the deck

### **5.8 Get Time Range Statistics**

Get comprehensive statistics for a custom date range including daily breakdowns, streaks, and consistency metrics.

- **URL**: /study/time-range-statistics/:deckId
- **Method**: GET
- **Auth Required**: Yes
- **URL Parameters**:
  - deckId: ID of the deck
- **Query Parameters**:
  - startDate (required): Range start date in ISO 8601 format
  - endDate (required): Range end date in ISO 8601 format

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-12-06T10:00:00.000Z",
  "message": "Get Time Range Statistics",
  "data": {
    "startDate": "2024-11-01T00:00:00.000Z",
    "endDate": "2024-11-30T23:59:59.999Z",
    "totalCardsReviewed": 450,
    "totalSessions": 25,
    "totalStudyTime": 12000,
    "averageSessionTime": 480,
    "daysStudied": 23,
    "totalDaysInRange": 30,
    "consistencyPercentage": 76.7,
    "correctReviews": 380,
    "incorrectReviews": 70,
    "accuracyPercentage": 84.4,
    "newCardsIntroduced": 60,
    "cardsMatured": 45,
    "averageReviewsPerDay": 15.0,
    "qualityDistribution": {
      "Again": 70,
      "Hard": 50,
      "Good": 280,
      "Easy": 50
    },
    "dailyBreakdown": [
      { "date": "2024-11-01", "reviewCount": 15, "studyTime": 400 },
      { "date": "2024-11-02", "reviewCount": 18, "studyTime": 480 }
    ],
    "currentStreak": 12,
    "longestStreak": 15
  },
  "path": "/api/study/time-range-statistics/1?startDate=2024-11-01&endDate=2024-11-30"
}
```

**Response Field Descriptions:**

- startDate, endDate (string): ISO timestamps of the time range
- totalCardsReviewed (number): Total cards reviewed in range
- totalSessions (number): Number of unique study days
- totalStudyTime (number): Total study time in seconds
- averageSessionTime (number): Average study time per session in seconds
- daysStudied (number): Number of days with at least one review
- totalDaysInRange (number): Total days between start and end dates
- consistencyPercentage (number): (daysStudied / totalDaysInRange) \* 100
- correctReviews, incorrectReviews (number): Review counts by correctness
- accuracyPercentage (number): Percentage of correct reviews
- newCardsIntroduced (number): New cards first reviewed in this range
- cardsMatured (number): Cards that reached mature status (interval ≥ 21 days)
- averageReviewsPerDay (number): Average reviews per day
- qualityDistribution (object): Review counts by quality rating
- dailyBreakdown (array): Day-by-day review counts and study times
- currentStreak (number): Current consecutive study days from end date
- longestStreak (number): Longest consecutive study streak in range

**Notes:**

- Study time is estimated at 10 seconds per review (timeSpent field not yet implemented)
- Streaks count backward from the end date
- Daily breakdown includes only days with at least one review
- All percentages rounded to 2 decimal places
