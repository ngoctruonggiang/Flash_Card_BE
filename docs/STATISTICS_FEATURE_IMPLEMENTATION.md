# Statistics Feature Implementation Guide

## Overview

This document details the comprehensive statistics features added to the flash-learn backend application. These features provide detailed insights into card performance, deck statistics, study sessions, and time-range analytics.

## Table of Contents

1. [Features Implemented](#features-implemented)
2. [API Endpoints](#api-endpoints)
3. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
4. [Service Methods](#service-methods)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)

---

## Features Implemented

### 1. Card Statistics

Track individual card performance including:

- Review counts and quality distribution
- Ease factor and interval tracking
- Retention rates
- Card age and status
- Last review information

### 2. Advanced Deck Statistics

Comprehensive deck-level metrics:

- Card distribution by status (new, learning, review, relearning)
- Mature vs young card counts
- Cards due today and next week
- Retention and completion rates
- Average ease factor and interval
- Consecutive study days
- Estimated review time

### 3. Study Session Statistics

Session-based tracking:

- Cards reviewed per session
- Accuracy percentage
- Quality distribution (Again, Hard, Good, Easy)
- Time spent per session
- Cards by status (new, learning, review)

### 4. Time Range Statistics

Historical analytics over custom date ranges:

- Daily breakdown of reviews
- Study consistency metrics
- Current and longest study streaks
- Quality distribution over time
- New cards introduced and cards matured
- Average reviews per day

---

## API Endpoints

### Card Endpoints

#### Get Card Statistics

```http
GET /card/:id/statistics
Authorization: Bearer <token>
```

Returns comprehensive statistics for a specific card.

**Response:**

```json
{
  "totalReviews": 15,
  "correctReviews": 12,
  "correctPercentage": 80.0,
  "againCount": 2,
  "hardCount": 1,
  "goodCount": 10,
  "easyCount": 2,
  "currentInterval": 7,
  "easeFactor": 2.5,
  "nextReviewDate": "2024-12-10T00:00:00.000Z",
  "lastReviewDate": "2024-12-03T10:30:00.000Z",
  "status": "review",
  "averageTimePerReview": null,
  "cardAge": 45,
  "retentionRate": 85.7
}
```

#### Get Cards Statistics by Deck

```http
GET /card/deck/:deckId/statistics
Authorization: Bearer <token>
```

Returns statistics for all cards in a specific deck.

**Response:** Array of CardStatistics objects

---

### Deck Endpoints

#### Get Advanced Deck Statistics

```http
GET /deck/:id/advanced-statistics
Authorization: Bearer <token>
```

Returns comprehensive deck-level statistics.

**Response:**

```json
{
  "totalCards": 150,
  "newCards": 25,
  "learningCards": 30,
  "reviewCards": 85,
  "relearningCards": 10,
  "matureCards": 45,
  "youngCards": 40,
  "cardsDueToday": 15,
  "cardsDueNextWeek": 42,
  "retentionRate": 87.5,
  "averageEaseFactor": 2.45,
  "averageInterval": 18.5,
  "totalReviews": 2450,
  "correctPercentage": 85.2,
  "lastStudiedDate": "2024-12-03T10:30:00.000Z",
  "consecutiveDaysStudied": 12,
  "cardDistribution": {
    "new": 25,
    "learning": 30,
    "review": 85,
    "relearning": 10
  },
  "qualityDistribution": {
    "Again": 245,
    "Hard": 490,
    "Good": 1470,
    "Easy": 245
  },
  "averageReviewsPerDay": 15.5,
  "estimatedReviewTime": 25,
  "completionPercentage": 83.3,
  "maturityPercentage": 30.0
}
```

---

### Study Endpoints

#### Get Study Session Statistics

```http
GET /study/session-statistics/:deckId?startDate=<ISO_DATE>&endDate=<ISO_DATE>
Authorization: Bearer <token>
```

Calculate statistics for a specific study session.

**Query Parameters:**

- `startDate`: Session start time (ISO format)
- `endDate`: Session end time (ISO format)

**Response:**

```json
{
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
  "sessionStartTime": "2024-12-03T10:00:00.000Z",
  "sessionEndTime": "2024-12-03T10:15:00.000Z",
  "deckId": "123",
  "deckName": "Spanish Vocabulary"
}
```

#### Get Time Range Statistics

```http
GET /study/time-range-statistics/:deckId?startDate=<ISO_DATE>&endDate=<ISO_DATE>
Authorization: Bearer <token>
```

Get comprehensive statistics over a custom date range.

**Query Parameters:**

- `startDate`: Range start date (ISO format)
- `endDate`: Range end date (ISO format)

**Response:**

```json
{
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
}
```

---

## Data Transfer Objects (DTOs)

### CardStatisticsDto

**Location:** `src/utils/types/dto/card/cardStatistics.dto.ts`

**Properties:**

- `totalReviews`: Total number of reviews
- `correctReviews`: Number of correct reviews (Good/Easy)
- `correctPercentage`: Percentage of correct reviews
- `againCount`, `hardCount`, `goodCount`, `easyCount`: Quality distribution
- `currentInterval`: Days until next review
- `easeFactor`: Current ease factor
- `nextReviewDate`: Date of next scheduled review
- `lastReviewDate`: Date of last review
- `status`: Current card status (new, learning, review, relearning)
- `averageTimePerReview`: Average time spent per review (currently null)
- `cardAge`: Days since card creation
- `retentionRate`: Overall retention rate

### AdvancedDeckStatisticsDto

**Location:** `src/utils/types/dto/deck/advancedDeckStatistics.dto.ts`

**Key Metrics:**

- Card counts by status (new, learning, review, relearning)
- Mature/young card distinction (≥21 days interval)
- Due cards (today and next week)
- Retention and completion rates
- Average ease factor and interval
- Study streak information
- Quality distribution across all reviews
- Estimated review time

### StudySessionStatisticsDto

**Location:** `src/utils/types/dto/study/studySessionStatistics.dto.ts`

**Session Metrics:**

- Total cards reviewed
- Cards by status (new, learning, review)
- Correct/incorrect answers
- Accuracy percentage
- Study time metrics
- Quality distribution
- Session timeframe

### TimeRangeStatisticsDto

**Location:** `src/utils/types/dto/study/timeRangeStatistics.dto.ts`

**Time-based Analytics:**

- Review counts and sessions
- Study consistency metrics
- Accuracy trends
- New cards and matured cards
- Daily breakdown
- Study streaks (current and longest)
- Quality distribution over time

---

## Service Methods

### CardService

**File:** `src/services/card/card.service.ts`

#### `getCardStatistics(cardId: number): Promise<CardStatisticsDto>`

Calculates comprehensive statistics for a single card including:

- Review quality distribution
- Retention rates
- Card age and status
- Interval and ease factor tracking

#### `getCardsStatisticsByDeck(deckId: number): Promise<CardStatisticsDto[]>`

Returns statistics for all cards in a deck.

---

### DeckService

**File:** `src/services/deck/deck.service.ts`

#### `getAdvancedStatistics(deckId: number): Promise<AdvancedDeckStatisticsDto>`

Generates comprehensive deck statistics including:

- Card distribution analysis
- Maturity metrics
- Study streak calculation
- Quality distribution
- Due card forecasting

**Key Algorithms:**

- **Mature Card Detection:** Cards with interval ≥ 21 days
- **Due Card Calculation:** Compares nextReviewDate with current time
- **Consecutive Days Logic:** Counts backward from most recent study day

#### `getConsecutiveStudyDays(deckId: number): Promise<number>`

Private method calculating consecutive study days:

1. Groups reviews by date
2. Checks if studied today or yesterday
3. Counts backward until gap found

---

### StudyService

**File:** `src/services/study/study.service.ts`

#### `calculateSessionStatistics(deckId, startDate, endDate): Promise<StudySessionStatisticsDto>`

Analyzes a single study session:

- Filters reviews by time range
- Categorizes cards by status
- Calculates accuracy and quality distribution
- Estimates study time

#### `getTimeRangeStatistics(deckId, startDate, endDate): Promise<TimeRangeStatisticsDto>`

Comprehensive time-range analysis:

- Daily breakdown generation
- Streak calculation (current and longest)
- Consistency percentage
- Quality distribution over time
- Cards matured tracking

**Streak Algorithm:**

1. Extract unique study dates
2. Sort chronologically
3. Count consecutive days backward from end date
4. Track longest streak separately

---

## Usage Examples

### Example 1: Get Individual Card Performance

```typescript
// GET /card/123/statistics
const stats = await cardService.getCardStatistics(123);
console.log(`Card has ${stats.totalReviews} reviews`);
console.log(`Retention rate: ${stats.retentionRate}%`);
console.log(`Current status: ${stats.status}`);
```

### Example 2: Monitor Deck Progress

```typescript
// GET /deck/456/advanced-statistics
const deckStats = await deckService.getAdvancedStatistics(456);
console.log(`Mature cards: ${deckStats.matureCards}/${deckStats.totalCards}`);
console.log(`Completion: ${deckStats.completionPercentage}%`);
console.log(`Study streak: ${deckStats.consecutiveDaysStudied} days`);
```

### Example 3: Analyze Study Session

```typescript
// GET /study/session-statistics/789?startDate=2024-12-03T10:00:00Z&endDate=2024-12-03T11:00:00Z
const sessionStats = await studyService.calculateSessionStatistics(
  789,
  new Date('2024-12-03T10:00:00Z'),
  new Date('2024-12-03T11:00:00Z'),
);
console.log(`Reviewed ${sessionStats.totalCardsReviewed} cards`);
console.log(`Accuracy: ${sessionStats.accuracyPercentage}%`);
```

### Example 4: Monthly Progress Report

```typescript
// GET /study/time-range-statistics/789?startDate=2024-11-01&endDate=2024-11-30
const monthlyStats = await studyService.getTimeRangeStatistics(
  789,
  new Date('2024-11-01'),
  new Date('2024-11-30'),
);
console.log(
  `Days studied: ${monthlyStats.daysStudied}/${monthlyStats.totalDaysInRange}`,
);
console.log(`Consistency: ${monthlyStats.consistencyPercentage}%`);
console.log(`Longest streak: ${monthlyStats.longestStreak} days`);
```

---

## Testing

### Manual Testing with curl

#### Test Card Statistics

```bash
curl -X GET "http://localhost:3000/card/1/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Advanced Deck Statistics

```bash
curl -X GET "http://localhost:3000/deck/1/advanced-statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Session Statistics

```bash
curl -X GET "http://localhost:3000/study/session-statistics/1?startDate=2024-12-03T10:00:00Z&endDate=2024-12-03T11:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Time Range Statistics

```bash
curl -X GET "http://localhost:3000/study/time-range-statistics/1?startDate=2024-11-01T00:00:00Z&endDate=2024-11-30T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### E2E Test Structure (To Be Implemented)

```typescript
// tests/e2e/statistics.e2e-spec.ts
describe('Statistics API (e2e)', () => {
  describe('/card/:id/statistics (GET)', () => {
    it('should return card statistics');
    it('should return 404 for non-existent card');
  });

  describe('/deck/:id/advanced-statistics (GET)', () => {
    it('should return advanced deck statistics');
    it('should correctly calculate mature cards');
    it('should calculate consecutive study days');
  });

  describe('/study/session-statistics/:deckId (GET)', () => {
    it('should calculate session statistics');
    it('should handle empty sessions');
  });

  describe('/study/time-range-statistics/:deckId (GET)', () => {
    it('should calculate time range statistics');
    it('should correctly identify study streaks');
  });
});
```

---

## Implementation Notes

### Design Decisions

1. **No timeSpent Field:** The CardReview model doesn't have a timeSpent field, so `averageTimePerReview` is set to `null` and study times are estimated at 10 seconds per review.

2. **Mature Card Threshold:** Cards are considered "mature" when their interval is ≥ 21 days, following Anki's convention.

3. **Correct Review Definition:** Reviews with quality "Good" or "Easy" are considered correct, while "Again" and "Hard" are incorrect or difficult.

4. **Streak Calculation:** Study streaks allow for studying either today or yesterday as the starting point, preventing streak breaks on the current day.

5. **Time Estimation:** Without actual time tracking, study time is estimated at 10 seconds per review for analytics purposes.

### Performance Considerations

- **Database Queries:** Methods fetch related data efficiently using Prisma's include/select
- **Calculation Complexity:** Most calculations are O(n) where n is the number of reviews
- **Caching Opportunities:** Consider caching statistics for large decks if performance becomes an issue

### Future Enhancements

1. **Add timeSpent field** to CardReview model for accurate time tracking
2. **Implement caching** for frequently accessed statistics
3. **Add graph data endpoints** for visualization
4. **Export functionality** for statistics data
5. **Comparison features** to compare different time periods
6. **Predictive analytics** for review forecasting

---

## Related Documentation

- [Backend Specification](./Backend-specification.md)
- [SM-2 Algorithm Documentation](./NEW-SM-2-Algorithm.md)
- [API Overview](../api-docs/overview.md)

---

## Changelog

### 2024-12-03 - Initial Implementation

- Created 4 new DTOs for statistics features
- Added statistics methods to CardService, DeckService, and StudyService
- Implemented 6 new API endpoints
- Fixed ApiProperty type issues
- All TypeScript compilation errors resolved

---

## Support

For issues or questions about the statistics features, please refer to:

- Backend specification: `docs/Backend-specification.md`
- API documentation: `api-docs/` directory
- Code update guide: `docs/code-update-guide.md`
