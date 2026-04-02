# **4\. Card Endpoints**

Manage individual flashcards within decks.

### **4.1 Create Card**

Add a new card to a deck with optional rich content fields for language learning.

- **URL**: /card
- **Method**: POST
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "deckId": 1,
  "front": "xin chào",
  "back": "hello",
  "tags": "greetings,basics",
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
  ]
}
```

**Field Descriptions:**

- deckId (number, required): ID of the deck to add the card to
- front (string, required): Front side of the card (question/prompt)
- back (string, required): Back side of the card (answer)
- tags (string, optional): Comma-separated tags
- wordType (string, optional): Type of word (e.g., "noun", "verb", "adjective", "interjection")
- pronunciation (string, optional): Pronunciation guide (e.g., IPA notation or phonetic spelling)
- examples (array, optional): Array of example sentences with translations
  - sentence (string, required): Example sentence
  - translation (string, required): Translation of the example sentence

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-24T15:00:00.000Z",
  "message": "Create Card",
  "data": {
    "id": 1,
    "deckId": 1,
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
    "createdAt": "2025-11-24T15:00:00.000Z",
    "updatedAt": "2025-11-24T15:00:00.000Z"
  },
  "path": "/api/card"
}
```

**Bidirectional Card Creation:**

If the deck has languageMode set to BIDIRECTIONAL, creating a card will automatically generate a **second reverse card**:

**Primary Card Created:**

```json

{
 "id": 1,
 "front": "xin chào",
 "back": "hello",
 "wordType": "interjection",
 "pronunciation": "həˈləʊ",
 "examples": [...]
}
```

**Auto-Generated Reverse Card (now includes rich content):**

```json
{
  "id": 2,
  "front": "hello",
  "back": "xin chào",
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
  ]
}
```

**Notes:**

- Rich content fields (wordType, pronunciation, examples) are now duplicated on the reverse card for BIDIRECTIONAL decks
- This automatic creation only happens when languageMode is BIDIRECTIONAL
- Both cards are created in a single API call

### **4.2 Get Cards**

Retrieve cards, optionally filtered by deck ID.

- **URL**: /card
- **Method**: GET
- **Auth Required**: Yes
- **Query Parameters**:
  - deckId: (Optional) ID of the deck to retrieve cards from.

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T15:00:00.000Z",
  "message": "Get All Cards",
  "data": [
    {
      "id": 1,
      "deckId": 1,
      "front": "xin chào",
      "back": "hello",
      "wordType": "interjection",
      "pronunciation": "həˈləʊ",
      "examples": [
        {
          "sentence": "Hello, how are you?",
          "translation": "Xin chào, bạn khỏe không?"
        }
      ],
      "tags": "greetings,basics",
      "createdAt": "2025-11-24T15:00:00.000Z",
      "updatedAt": "2025-11-24T15:00:00.000Z",
      "reviews": []
    }
  ],
  "path": "/api/card?deckId=1"
}
```

**Notes:**

- The examples field is automatically parsed from JSON string to object array
- If examples is null or empty, it will be returned as null

### **4.3 Get Card By ID**

Retrieve a specific card by its ID.

- **URL**: /card/:id
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.081Z",
  "message": "Get All Cards",
  "data": {
    "id": 1,
    "deckId": 3,
    "front": "What is 2+2?",
    "back": "4",
    "createdAt": "2025-11-23T13:44:29.060Z",
    "updatedAt": "2025-11-23T13:44:29.060Z",
    "tags": "math,basics",
    "deck": {
      "id": 3,
      "userId": 7,
      "title": "Advanced Math",
      "description": "Complex arithmetic flashcards",
      "createdAt": "2025-11-23T13:44:28.992Z",
      "updatedAt": "2025-11-23T13:44:29.047Z",
      "user": {
        "id": 7,
        "username": "test",
        "email": "test@gmail.com",
        "role": "USER",
        "createdAt": "2025-11-23T13:44:28.843Z",
        "lastLoginAt": "2025-11-23T13:44:28.841Z",
        "isEmailConfirmed": false
      }
    },
    "reviews": []
  },
  "path": "/api/card/1"
}
```

### **4.4 Update Card**

Update a card's content including rich content fields.

- **URL**: /card/:id
- **Method**: PATCH
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "front": "xin chào",
  "back": "hello",
  "wordType": "greeting",
  "pronunciation": "/həˈloʊ/",
  "examples": [
    {
      "sentence": "Hello there!",
      "translation": "Xin chào bạn!"
    }
  ]
}
```

**Field Descriptions:**

- All fields are optional
- front (string): Updated front side of the card
- back (string): Updated back side of the card
- tags (string): Updated comma-separated tags
- wordType (string): Updated word type
- pronunciation (string): Updated pronunciation guide
- examples (array): Updated array of example sentences with translations

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-24T15:00:00.000Z",
  "message": "Update Card",
  "data": {
    "id": 1,
    "deckId": 1,
    "front": "xin chào",
    "back": "hello",
    "wordType": "greeting",
    "pronunciation": "/həˈloʊ/",
    "examples": [
      {
        "sentence": "Hello there!",
        "translation": "Xin chào bạn!"
      }
    ],
    "tags": "greetings,basics",
    "createdAt": "2025-11-24T15:00:00.000Z",
    "updatedAt": "2025-11-24T15:05:00.000Z"
  },
  "path": "/api/card/1"
}
```

**Notes:**

- Updating a card does NOT trigger automatic creation of reverse cards, even if the deck is in BIDIRECTIONAL mode
- To update the corresponding reverse card, you must update it separately
- The examples field is automatically parsed from JSON string to object array in the response

### **4.5 Delete Card**

Delete a specific card.

- **URL**: /card/:id
- **Method**: DELETE
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.165Z",
  "message": "Delete Card",
  "data": {
    "id": 1,
    "deckId": 3,
    "front": "What is 3+3?",
    "back": "6",
    "createdAt": "2025-11-23T13:44:29.060Z",
    "updatedAt": "2025-11-23T13:44:29.091Z",
    "tags": "math,basics"
  },
  "path": "/api/card/1"
}
```

**Note:** Delete operations may return a 500 error if there are related records (cascading delete issue).

### **4.6 Get Card Review Status**

Retrieve when a card was last reviewed and when it is due for the next review.

- **URL**: /card/:id/review-status
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

Example for a **card that has been reviewed**:

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-25T12:37:00.701Z",
  "message": "Get Card Review Status",
  "data": {
    "cardId": 1,
    "lastReviewedAt": "2025-11-25T12:37:00.687Z",
    "nextReviewDate": "2025-11-25T12:47:00.686Z",
    "hasBeenReviewed": true
  },
  "path": "/api/card/1/review-status"
}
```

Example for a **card that has never been reviewed**:

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-25T12:37:00.642Z",
  "message": "Get Card Review Status",
  "data": {
    "cardId": 1,
    "lastReviewedAt": null,
    "nextReviewDate": null,
    "hasBeenReviewed": false
  },
  "path": "/api/card/1/review-status"
}
```

**Response Field Descriptions:**

- cardId (number): The ID of the card.
- lastReviewedAt (string | null): ISO 8601 timestamp of when the card was last reviewed. null if never reviewed.
- nextReviewDate (string | null): ISO 8601 timestamp of when the card is next due for review. null if never reviewed.
- hasBeenReviewed (boolean): Whether the card has been reviewed at least once.

**Notes:**

- This endpoint requires authentication.
- The lastReviewedAt and nextReviewDate are based on the most recent review.
- Cards that have never been reviewed will have null for both date fields.
- This is useful for displaying review progress and scheduling information in the UI.

### **4.8 Get Card Statistics**

Get comprehensive statistics for a specific card including review history, retention rates, and performance metrics.

- **URL**: /card/:id/statistics
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-12-06T10:00:00.000Z",
  "message": "Get Card Statistics",
  "data": {
    "totalReviews": 15,
    "correctReviews": 12,
    "correctPercentage": 80.0,
    "againCount": 2,
    "hardCount": 1,
    "goodCount": 10,
    "easyCount": 2,
    "currentInterval": 7,
    "easeFactor": 2.5,
    "nextReviewDate": "2025-12-10T00:00:00.000Z",
    "lastReviewDate": "2025-12-03T10:30:00.000Z",
    "status": "review",
    "averageTimePerReview": null,
    "cardAge": 45,
    "retentionRate": 80.0
  },
  "path": "/api/card/1/statistics"
}
```

**Response Field Descriptions:**

- totalReviews (number): Total number of times the card has been reviewed
- correctReviews (number): Number of reviews with "Good" or "Easy" quality
- correctPercentage (number): Percentage of correct reviews
- againCount, hardCount, goodCount, easyCount (number): Distribution of review qualities
- currentInterval (number): Current interval in days until next review
- easeFactor (number): Current ease factor of the card (used in SM-2 algorithm)
- nextReviewDate (string): ISO 8601 timestamp of when the card is due for next review
- lastReviewDate (string | null): ISO 8601 timestamp of the most recent review (null if never reviewed)
- status (string): Current status (new, learning, review, relearning)
- averageTimePerReview (number | null): Average time spent per review in seconds (currently null)
- cardAge (number): Number of days since the card was created
- retentionRate (number): Overall retention rate percentage for this card

### **4.9 Get Cards Statistics By Deck**

Get statistics for all cards in a specific deck.

- **URL**: /card/deck/:deckId/statistics
- **Method**: GET
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-12-06T10:00:00.000Z",
  "message": "Get Cards Statistics By Deck",
  "data": [
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
      "nextReviewDate": "2025-12-10T00:00:00.000Z",
      "lastReviewDate": "2025-12-03T10:30:00.000Z",
      "status": "review",
      "averageTimePerReview": null,
      "cardAge": 45,
      "retentionRate": 80.0
    }
  ],
  "path": "/api/card/deck/1/statistics"
}
```

**Notes:**

- Returns an array of card statistics, one for each card in the deck
- Useful for displaying overall deck performance and identifying problem cards
- Can be used to generate progress reports and insights
