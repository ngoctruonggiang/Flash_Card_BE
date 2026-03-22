# FlashLearn API Documentation

This document provides a comprehensive reference for the FlashLearn API. The API allows you to manage users, decks, and flashcards.

## Base URL

All API requests should be made to the base URL configured for the environment (e.g., `http://localhost:3000/api`). In this documentation, `{{url}}` refers to the base URL.

## Authentication

The API uses **Bearer Token** authentication.
Most endpoints require a valid JWT token in the `Authorization` header.

**Header Format:**

```
Authorization: Bearer <your_token>
```

---

## 1. Auth Endpoints

Manage user registration and authentication.

### 1.1 Register

Register a new user.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No

**Request Body (JSON):**

```json
{
  "username": "test",
  "email": "test@gmail.com",
  "password": "12345678a",
  "confirmPassword": "12345678a"
}
```

**Field Descriptions:**

- `username` (string, required): Unique username for the user
- `email` (string, required): Valid email address
- `password` (string, required): User's password
- `confirmPassword` (string, required): Must match the `password` field exactly

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-23T13:44:28.850Z",
  "message": "",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": 7,
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/auth/register"
}
```

### 1.2 Login

Authenticate a user and retrieve a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No

**Request Body (JSON):**

```json
{
  "email": "test@gmail.com",
  "password": "12345678a"
}
```

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:28.917Z",
  "message": "",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": 7,
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/auth/login"
}
```

---

## 2. User Endpoints

Manage user accounts.

### 2.1 Get Current User

Retrieve details of the currently authenticated user.

- **URL**: `/user`
- **Method**: `GET`
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:28.928Z",
  "message": "Get Current User",
  "data": {
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/user"
}
```

### 2.2 Update Current User

Update the currently authenticated user's information.

- **URL**: `/user`
- **Method**: `PATCH`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:28.966Z",
  "message": "Update User",
  "data": {
    "id": 7,
    "username": "newusername",
    "email": "newemail@example.com",
    "role": "USER",
    "passwordHash": "$2b$10$GGa/AfDJL6EnWiUelTNzi...",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z",
    "isEmailConfirmed": false
  },
  "path": "/api/user"
}
```

### 2.3 Delete Current User

Delete the currently authenticated user's account.

- **URL**: `/user`
- **Method**: `DELETE`
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.189Z",
  "message": "Delete User",
  "data": {
    "id": 7,
    "username": "test",
    "email": "test@gmail.com",
    "role": "USER",
    "createdAt": "2025-11-23T13:44:28.843Z",
    "lastLoginAt": "2025-11-23T13:44:28.841Z"
  },
  "path": "/api/user"
}
```

**Note:** Delete operations may return a 500 error if there are related records (cascading delete issue).

### 2.4 Get User By ID (Admin)

Retrieve details of a specific user by their ID. Requires Admin privileges.

- **URL**: `/user/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Admin)

### 2.5 Get All Users (Admin)

Retrieve a list of all users. Requires Admin privileges.

- **URL**: `/user/all`
- **Method**: `GET`
- **Auth Required**: Yes (Admin)

### 2.6 Admin Update User

Update a specific user's details (e.g., role). Requires Admin privileges.

- **URL**: `/user/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (Admin)

### 2.7 Admin Delete User

Delete a specific user by their ID. Requires Admin privileges.

- **URL**: `/user/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Admin)

---

## 3. Deck Endpoints

Manage collections of flashcards (decks).

### 3.1 Create Deck

Create a new deck.

- **URL**: `/deck`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "title": "Basic Math",
  "description": "Simple arithmetic flashcards"
}
```

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-23T13:44:29.004Z",
  "message": "Create Deck",
  "data": {
    "id": 3,
    "userId": 7,
    "title": "Basic Math",
    "description": "Simple arithmetic flashcards",
    "createdAt": "2025-11-23T13:44:28.992Z",
    "updatedAt": "2025-11-23T13:44:28.992Z"
  },
  "path": "/api/deck"
}
```

### 3.2 Get All Decks For Current User

Retrieve all decks belonging to the authenticated user.

- **URL**: `/deck`
- **Method**: `GET`
- **Auth Required**: Yes

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.016Z",
  "message": "Get All Decks By User",
  "data": [
    {
      "id": 3,
      "userId": 7,
      "title": "Basic Math",
      "description": "Simple arithmetic flashcards",
      "createdAt": "2025-11-23T13:44:28.992Z",
      "updatedAt": "2025-11-23T13:44:28.992Z",
      "cards": []
    }
  ],
  "path": "/api/deck"
}
```

### 3.3 Find Decks (Admin/Filter)

Find decks, optionally filtering by user ID.

- **URL**: `/deck/by`
- **Method**: `GET`
- **Auth Required**: Yes (Admin)
- **Query Parameters**:
  - `userId`: (Optional) ID of the user to filter decks by.

**Note:** This endpoint requires Admin privileges.

### 3.4 Get Deck By ID

Retrieve a specific deck by its ID.

- **URL**: `/deck/:id`
- **Method**: `GET`
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

### 3.5 Update Deck

Update a deck's details.

- **URL**: `/deck/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "title": "Advanced Math",
  "description": "Complex arithmetic flashcards"
}
```

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.050Z",
  "message": "Update Deck By ID",
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

### 3.6 Delete Deck

Delete a specific deck.

- **URL**: `/deck/:id`
- **Method**: `DELETE`
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

**Note:** Delete operations may return a 500 error if there are related records (cascading delete issue).

---

## 4. Card Endpoints

Manage individual flashcards within decks.

### 4.1 Create Card

Add a new card to a deck.

- **URL**: `/card`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "deckId": 1,
  "front": "What is 2+2?",
  "back": "4",
  "tags": "math,basics"
}
```

**Success Response (201 Created):**

```json
{
  "statusCode": 201,
  "timestamp": "2025-11-23T13:44:29.062Z",
  "message": "Create Card",
  "data": {
    "id": 1,
    "deckId": 3,
    "front": "What is 2+2?",
    "back": "4",
    "createdAt": "2025-11-23T13:44:29.060Z",
    "updatedAt": "2025-11-23T13:44:29.060Z",
    "tags": "math,basics"
  },
  "path": "/api/card"
}
```

### 4.2 Get Cards

Retrieve cards, optionally filtered by deck ID.

- **URL**: `/card`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `deckId`: (Optional) ID of the deck to retrieve cards from.

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.073Z",
  "message": "Get All Cards",
  "data": [
    {
      "id": 1,
      "deckId": 3,
      "front": "What is 2+2?",
      "back": "4",
      "createdAt": "2025-11-23T13:44:29.060Z",
      "updatedAt": "2025-11-23T13:44:29.060Z",
      "tags": "math,basics",
      "reviews": []
    }
  ],
  "path": "/api/card?deckId=3"
}
```

### 4.3 Get Card By ID

Retrieve a specific card by its ID.

- **URL**: `/card/:id`
- **Method**: `GET`
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

### 4.4 Update Card

Update a card's content.

- **URL**: `/card/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes

**Request Body (JSON):**

```json
{
  "front": "What is 3+3?",
  "back": "6"
}
```

**Success Response (200 OK):**

```json
{
  "statusCode": 200,
  "timestamp": "2025-11-23T13:44:29.094Z",
  "message": "Get All Cards",
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

### 4.5 Delete Card

Delete a specific card.

- **URL**: `/card/:id`
- **Method**: `DELETE`
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

---

## 5. Study Endpoints

Manage study sessions and reviews.

### 5.1 Start Study Session

Get cards that are due for review in a specific deck.

- **URL**: `/study/start/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `id`: ID of the deck

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

### 5.2 Submit Card Review

Submit reviews for cards using the SM-2 spaced repetition algorithm.

- **URL**: `/study/review`
- **Method**: `POST`
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

- `CardReviews` (array, required): Array of card review objects
  - `cardId` (number, required): ID of the card being reviewed
  - `quality` (string, required): Review quality - one of: "Again", "Hard", "Good", "Easy"
- `reviewedAt` (string, required): ISO 8601 timestamp of when the review occurred

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

- `repetitions`: Number of consecutive correct reviews
- `interval`: Days until next review
- `eFactor`: Easiness factor (used in SM-2 algorithm)
- `nextReviewDate`: When the card should be reviewed next
- `reviewedAt`: When the review was recorded
- `quality`: The quality rating given in the review

### 5.3 Get Review Preview

Preview future review intervals for all quality options without submitting a review. This allows users to see what the next review date would be for each quality rating (Again, Hard, Good, Easy) before making their selection.

- **URL**: `/study/preview/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:
  - `id`: ID of the card

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

- `Again`: Interval if the card is marked as "Again" (forgotten/incorrect) - always resets to 1 day
- `Hard`: Interval if the card is marked as "Hard" (difficult to recall) - uses fixed 1.2x growth (for repetitions > 2)
- `Good`: Interval if the card is marked as "Good" (correctly recalled) - uses standard SM-2 eFactor growth
- `Easy`: Interval if the card is marked as "Easy" (very easy to recall) - uses eFactor with 1.3x bonus multiplier

**Interval Calculation:**

For **first review** (repetitions = 1):

- **Hard:** 1 day
- **Good:** 3 days
- **Easy:** 5 days

For **second review** (repetitions = 2):

- All qualities: 6 days

For **third+ reviews** (repetitions > 2):

- **Hard:** `round(previous_interval * 1.2)` - Fixed 20% growth
- **Good:** `round(previous_interval * eFactor)` - Standard SM-2 growth
- **Easy:** `round(previous_interval * eFactor * 1.3)` - Bonus 30% growth

**Notes:**

- This endpoint performs a read-only simulation and does not modify the card's review history
- Intervals are calculated using the SM-2 algorithm based on the card's current state
- **New cards** (never reviewed) show differentiated intervals: Hard=1, Good=3, Easy=5 days
- Starting from the **first review**, intervals are differentiated by quality rating
- Intervals are formatted as human-readable strings (e.g., "1 day", "15 days")

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**

```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

**401 Unauthorized:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null
}
```

**404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "data": null
}
```

**500 Internal Server Error:**

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "data": null,
  "timestamp": "2025-11-23T13:44:29.189Z",
  "path": "/api/endpoint"
}
```

---

## Notes

1. **Authentication**: Store the `accessToken` received from login/register and include it in the `Authorization` header for all authenticated requests.
2. **Timestamps**: All timestamps are in ISO 8601 format (UTC).
3. **IDs**: All IDs are integers.
4. **Cascading Deletes**: Some delete operations may fail with a 500 error if there are related records. This is a known issue with the current implementation.
5. **Spaced Repetition**: The study system uses the SM-2 algorithm for spaced repetition learning.
