# **3\. Deck Endpoints**

Manage collections of flashcards (decks).

### **3.1 Create Deck**

Create a new deck with optional customization options.

- **URL**: /deck
- **Method**: POST
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "title": "Basic Vietnamese",
  "description": "Essential Vietnamese phrases",
  "iconName": "flag-vietnam",
  "colorCode": "#DA251D",
  "languageMode": "BIDIRECTIONAL"
}
```

**Field Descriptions:**

- title (string, required): Title of the deck
- description (string, optional): Description of the deck
- iconName (string, optional): Icon identifier for the deck (e.g., "flag-vietnam", "book", "star")
- colorCode (string, optional): Hex color code for the deck (e.g., "\#FF5733" or "\#FFF"). Must be a valid hex format.
- languageMode (string, optional): Learning direction mode. One of:
  - VN_EN: Vietnamese to English only (default)
  - EN_VN: English to Vietnamese only
  - BIDIRECTIONAL: Both directions with auto-generated reverse cards

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-24T15:00:00.000Z",
  "message": "Create Deck",
  "data": {
    "id": 3,
    "userId": 7,
    "title": "Basic Vietnamese",
    "description": "Essential Vietnamese phrases",
    "iconName": "flag-vietnam",
    "colorCode": "#DA251D",
    "languageMode": "BIDIRECTIONAL",
    "createdAt": "2025-11-24T15:00:00.000Z",
    "updatedAt": "2025-11-24T15:00:00.000Z"
  },
  "path": "/api/deck"
}
```

**Notes:**

- When languageMode is set to BIDIRECTIONAL, creating a card will automatically generate a reverse card with swapped front/back content and duplicated rich content fields (wordType, pronunciation, examples)
- The colorCode must match the pattern `/^\#(\[A-Fa-f0-9\]{6}|\[A-Fa-f0-9\]{3})$/`
- All new fields are optional for backward compatibility

### **3.2 Get All Decks For Current User**

Retrieve all decks belonging to the authenticated user.

- **URL**: /deck
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T15:00:00.000Z",
  "message": "Get All Decks By User",
  "data": [
    {
      "id": 3,
      "userId": 7,
      "title": "Basic Vietnamese",
      "description": "Essential Vietnamese phrases",
      "iconName": "flag-vietnam",
      "colorCode": "#DA251D",
      "languageMode": "BIDIRECTIONAL",
      "createdAt": "2025-11-24T15:00:00.000Z",
      "updatedAt": "2025-11-24T15:00:00.000Z",
      "cards": []
    }
  ],
  "path": "/api/deck"
}
```

### **3.3 Find Decks (Admin/Filter)**

Find decks, optionally filtering by user ID.

- **URL**: /deck/by
- **Method**: GET
- **Auth Required**: Yes (Admin)
- **Query Parameters**:
  - userId: (Optional) ID of the user to filter decks by.

**Note:** This endpoint requires Admin privileges.

### **3.4 Get Deck By ID**

Retrieve a specific deck by its ID.

- **URL**: /deck/:id
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.038Z",
  "message": "Get Deck By ID",
  "data": {
    "id": 3,
    "userId": 7,
    "title": "Basic Math",
    "description": "Simple arithmetic flashcards",
    "createdAt": "2025-11-23T13:44:28.992Z",
    "updatedAt": "2025-11-23T13:44:28.992Z",
    "user": {
      "id": 7,
      "username": "test",
      "email": "test@gmail.com",
      "role": "USER",
      "createdAt": "2025-11-23T13:44:28.843Z",
      "lastLoginAt": "2025-11-23T13:44:28.841Z",
      "isEmailConfirmed": false
    },
    "cards": []
  },
  "path": "/api/deck/3"
}
```

### **3.5 Update Deck**

Update a deck's details including customization options.

- **URL**: /deck/:id
- **Method**: PATCH
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "title": "Advanced Vietnamese",
  "description": "Complex Vietnamese phrases",
  "iconName": "star",
  "colorCode": " #4CAF50",
  "languageMode": "VN_EN"
}
```

**Field Descriptions:**

- title (string, optional): Updated title of the deck
- description (string, optional): Updated description
- iconName (string, optional): Updated icon identifier
- colorCode (string, optional): Updated hex color code (must be valid hex format)
- languageMode (string, optional): Updated language mode (VN_EN, EN_VN, or BIDIRECTIONAL)

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T15:00:00.000Z",
  "message": "Update Deck By ID",
  "data": {
    "id": 3,
    "userId": 7,
    "title": "Advanced Vietnamese",
    "description": "Complex Vietnamese phrases",
    "iconName": "star",
    "colorCode": "#4CAF50",
    "languageMode": "VN_EN",
    "createdAt": "2025-11-24T15:00:00.000Z",
    "updatedAt": "2025-11-24T15:05:00.000Z"
  },
  "path": "/api/deck/3"
}
```

**Notes:**

- Changing languageMode only affects new cards created after the change
- Existing cards are not modified when the language mode is changed

### **3.6 Delete Deck**

Delete a specific deck.

- **URL**: /deck/:id
- **Method**: DELETE
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.176Z",
  "message": "Delete Deck By ID",
  "data": {
    "id": 3,
    "userId": 7,
    "title": "Advanced Math",
    "description": "Complex arithmetic flashcards",
    "createdAt": "2025-11-23T13:44:28.992Z",
    "updatedAt": "2025-11-23T13:44:29.047Z"
  },
  "path": "/api/deck/3"
}
```

### **3.7 Get Reviewed Cards Count**

Retrieve the number of cards that have been reviewed at least once in a specific deck.

- **URL**: /deck/:id/reviewed-count
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "deckId": 1,
  "reviewedCount": 5,
  "totalCards": 20
}
```

**Response Field Descriptions:**

- deckId (number): The ID of the deck.
- reviewedCount (number): The number of cards in the deck that have been reviewed at least once.
- totalCards (number): The total number of cards in the deck.

**Notes:**

- This endpoint requires authentication.
- The reviewedCount includes only cards with at least one review.

### **3.8 Get Reviewed Cards Count In Day**

Retrieve the number of cards that have been reviewed in a specific deck on a particular day.

- **URL**: /deck/:id/reviewed-count-day
- **Method**: GET
- **Auth Required**: Yes
- **Query Parameters**:
  - date (Optional): Date in YYYY-MM-DD format (e.g., "2025-11-24"). Defaults to today if not provided.

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T12:00:00.000Z",
  "message": "Get Reviewed Cards Count In Day",
  "data": {
    "deckId": 1,
    "date": "2025-11-24",
    "reviewedCount": 8,
    "totalCards": 20
  },
  "path": "/api/deck/1/reviewed-count-day?date=2025-11-24"
}
```

**Response Field Descriptions:**

- deckId (number): The ID of the deck.
- date (string): The date for which the count was calculated (YYYY-MM-DD format).
- reviewedCount (number): The number of unique cards in the deck that have been reviewed at least once on the specified day.
- totalCards (number): The total number of cards in the deck.

**Example Requests:**

Get reviewed count for today:

GET /api/deck/1/reviewed-count-day

Get reviewed count for a specific date:

GET /api/deck/1/reviewed-count-day?date=2025-11-20

**Notes:**

- This endpoint requires authentication.
- The reviewedCount includes only cards that have at least one review on the specified date.
- The date range covers the entire day (00:00:00 to 23:59:59) in the server's timezone.
- If no date is provided, it defaults to the current date.
- If a card was reviewed multiple times in the same day, it is counted only once.

### **3.9 Get Cards Due Today**

Retrieve all cards in a specific deck that are due for review today. This includes cards that have never been reviewed and cards whose next review date is today or earlier.

- **URL**: /deck/:id/due-today
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T12:00:00.000Z",
  "message": "Get Cards Due Today",
  "data": [
    {
      "id": 1,
      "deckId": 3,
      "front": "xin chào",
      "back": "hello",
      "wordType": "interjection",
      "pronunciation": "həˈləʊ",
      "examples": [
        {
          "sentence": "Hello, how are you?",
          "translation": "Xin chào, bạn khỏe không?"
        },
        {
          "sentence": "Hello everyone!",
          "translation": "Xin chào mọi người!"
        }
      ],
      "tags": "greetings,basics",
      "createdAt": "2025-11-20T10:00:00.000Z",
      "updatedAt": "2025-11-23T15:30:00.000Z",
      "nextReviewDate": "2025-11-24T10:00:00.000Z"
    }
  ],
  "path": "/api/deck/3/due-today"
}
```

**Response Field Descriptions:**

- id (number): The card ID.
- deckId (number): The deck ID this card belongs to.
- front (string): The front side of the card (question/prompt).
- back (string): The back side of the card (answer).
- wordType (string | null): Type of word (e.g., "noun", "verb", "adjective", "interjection").
- pronunciation (string | null): Pronunciation guide (e.g., IPA notation or phonetic spelling).
- examples (array | null): Array of example sentences with translations. Each example contains:
- sentence (string): The example sentence.
- translation (string): Translation of the example sentence.
- tags (string | null): Comma-separated tags for the card.
- createdAt (string): ISO 8601 timestamp when the card was created.
- updatedAt (string): ISO 8601 timestamp when the card was last updated.
- nextReviewDate (string | null): ISO 8601 timestamp of when the card is next due for review. null indicates the card has never been reviewed.

**Notes:**

- This endpoint requires authentication.
- Cards are sorted by their next review date, with never-reviewed cards appearing first.
- Cards with nextReviewDate of today or earlier are included.
- Cards that have never been reviewed (nextReviewDate is null) are included as they are due for their first review.
- The response includes all card information needed for a study session, including rich content fields (wordType, pronunciation, examples).
- The examples field is automatically parsed from JSON string to object array.
- This endpoint is useful for starting a study session without needing to fetch cards individually.

### **3.10 Get Deck Statistics**

Retrieve review statistics for a specific deck, including the percentage of correct reviews and detailed counts by quality.

- **URL**: /deck/:id/statistics
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T12:00:00.000Z",
  "message": "Get Deck Statistics",
  "data": {
    "totalReviews": 150,
    "correctReviews": 120,
    "correctPercentage": 80.0,
    "againCount": 30,
    "hardCount": 25,
    "goodCount": 70,
    "easyCount": 25
  },
  "path": "/api/deck/1/statistics"
}
```

**Response Field Descriptions:**

- totalReviews (number): Total number of reviews for all cards in the deck.
- correctReviews (number): Number of correct reviews (quality ≥ 3: Hard, Good, Easy).
- correctPercentage (number): Percentage of correct reviews.
- againCount (number): Number of reviews with quality "Again" (quality \= 2).
- hardCount (number): Number of reviews with quality "Hard" (quality \= 3).
- goodCount (number): Number of reviews with quality "Good" (quality \= 4).
- easyCount (number): Number of reviews with quality "Easy" (quality \= 5).

**Notes:**

- This endpoint requires authentication.
- The correctPercentage is calculated as (correctReviews / totalReviews) \* 100 and rounded to two decimal places.
- If there are no reviews, correctPercentage will be 0.0.

### **3.11 Get Deck Last Studied Date**

Retrieve when a deck was last studied (i.e., the most recent review date for any card in the deck).

- **URL**: /deck/:id/last-studied
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T12:00:00.000Z",
  "message": "Get Deck Last Studied Date",
  "data": {
    "deckId": 1,
    "lastStudiedAt": "2025-11-24T10:30:45.123Z"
  },
  "path": "/api/deck/1/last-studied"
}
```

**Response Field Descriptions:**

- deckId (number): The ID of the deck.
- lastStudiedAt (string | null): ISO 8601 timestamp of the most recent review for any card in the deck. null if no cards have been reviewed yet.

**Notes:**

- This endpoint requires authentication.
- The lastStudiedAt field represents when the deck was last studied (most recent review across all cards).
- If the deck has no reviews, lastStudiedAt will be null.
- This is useful for displaying "last studied" information in the UI or tracking study activity.

### **3.12 Get Advanced Deck Statistics**

Get comprehensive deck-level statistics including card distribution, retention rates, maturity data, and more.

- **URL**: /deck/:id/advanced-statistics
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-12-06T10:00:00.000Z",
  "message": "Get Advanced Deck Statistics",
  "data": {
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
    "lastStudiedDate": "2025-12-03T10:30:00.000Z",
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
  },
  "path": "/api/deck/1/advanced-statistics"
}
```

**Response Field Descriptions:**

- totalCards (number): Total number of cards in the deck
- newCards (number): Cards that have never been studied
- learningCards (number): Cards currently in learning phase
- reviewCards (number): Cards that have graduated to review status
- relearningCards (number): Cards that are being relearned after failures
- matureCards (number): Review cards with interval ≥ 21 days
- youngCards (number): Review cards with interval < 21 days
- cardsDueToday (number): Number of cards due for review today
- cardsDueNextWeek (number): Number of cards due in the next 7 days
- retentionRate (number): Percentage of reviews that were correct (Good/Easy)
- averageEaseFactor (number): Average ease factor across review cards
- averageInterval (number): Average interval in days across review cards
- totalReviews (number): Total number of reviews performed on this deck
- correctPercentage (number): Percentage of correct reviews
- lastStudiedDate (string | null): ISO timestamp of most recent review
- consecutiveDaysStudied (number): Current study streak in days
- cardDistribution (object): Count of cards by status
- qualityDistribution (object): Count of reviews by quality rating
- averageReviewsPerDay (number): Average reviews per day (last 30 days)
- estimatedReviewTime (number): Estimated time to complete due reviews (minutes)
- completionPercentage (number): Percentage of cards reviewed at least once
- maturityPercentage (number): Percentage of mature cards

**Notes:**

- Mature cards are defined as review cards with interval ≥ 21 days (Anki convention)
- Consecutive days studied includes today if studied, or starts from yesterday if not
- Estimated review time assumes 10 seconds per card
- All percentages are rounded to 2 decimal places
